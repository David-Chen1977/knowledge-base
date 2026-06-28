#!/usr/bin/env python3
"""
zhihu_publisher.py — 知乎专栏发布脚本（Playwright 浏览器自动化）

通过 Playwright 启动已登录 Chromium 浏览器，在知乎专栏创建/发布草稿。
需要先手动登录一次以保存会话（使用 --login 标志）。

用法:
    python zhihu_publisher.py --login               首次登录（保存会话）
    python zhihu_publisher.py --draft <md_file>     创建草稿
    python zhihu_publisher.py --publish <draft_id>   发布草稿
    python zhihu_publisher.py --preview <md_file>    预览模式（仅输出 HTML）
    python zhihu_publisher.py --status               检查草稿状态
    python zhihu_publisher.py --headless             无头模式（默认有头）

配置:
    ZHIHU_USER_DATA_DIR  浏览器用户数据目录（默认 ~/.config/sisyphus-browser/zhihu）
    ZHIHU_COLUMN_ID      知乎专栏 ID（从专栏 URL 获取）

工作流:
    1. python zhihu_publisher.py --login    # 首次：手动登录知乎
    2. python zhihu_publisher.py --draft article.md   # 创建草稿
    3. # 人工在 zhihu.com 上审阅草稿
    4. python zhihu_publisher.py --publish <draft_url>  # 发布
"""

import os
import sys
import json
import re
import argparse
import time
from datetime import datetime
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PTimeout
except ImportError:
    print("❌ 请先安装 playwright: pip install playwright && python -m playwright install chromium")
    sys.exit(1)


# ── 配置 ──

DEFAULT_USER_DATA_DIR = os.path.expanduser("~/.config/sisyphus-browser/zhihu")
COLUMN_URL = "https://zhuanlan.zhihu.com"
WRITE_URL = f"{COLUMN_URL}/write"
DASHBOARD_URL = "https://zhuanlan.zhihu.com/dashboard"


def resolve_user_data_dir() -> str:
    return os.environ.get("ZHIHU_USER_DATA_DIR", DEFAULT_USER_DATA_DIR)


def resolve_column_id() -> str:
    return os.environ.get("ZHIHU_COLUMN_ID", "")


# ── 浏览器管理 ──

def create_browser(headless: bool = False, user_data_dir: str = None):
    """创建 Playwright 浏览器实例（持久上下文 = 保持登录态）"""
    if user_data_dir is None:
        user_data_dir = resolve_user_data_dir()
    os.makedirs(user_data_dir, exist_ok=True)

    playwright = sync_playwright().start()

    # 国内站点直连（代理环境会干扰 TLS 连接）
    browser_args = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--no-proxy-server",
    ]

    context = playwright.chromium.launch_persistent_context(
        user_data_dir,
        headless=headless,
        args=browser_args,
        viewport={"width": 1280, "height": 900},
        locale="zh-CN",
        timezone_id="Asia/Shanghai",
    )
    page = context.pages[0] if context.pages else context.new_page()
    return playwright, context, page


def close_browser(playwright, context):
    """安全关闭浏览器"""
    try:
        context.close()
    except Exception:
        pass
    try:
        playwright.stop()
    except Exception:
        pass


# ── 页面操作 ──

def login_session(page) -> bool:
    """打开知乎登录页面，等待用户手动登录"""
    print("🔐 正在打开知乎登录页面...")
    print("   请在弹出的浏览器中手动登录知乎。登录完成后按 Enter 继续...")
    page.goto("https://www.zhihu.com/signin", wait_until="domcontentloaded")

    # Wait for user to log in manually
    input("   按 Enter 确认已登录并继续...")

    # Verify login
    page.goto(DASHBOARD_URL, wait_until="domcontentloaded")
    time.sleep(2)
    current_url = page.url
    if "signin" in current_url or "login" in current_url:
        print("❌ 登录失败，请重试 --login")
        return False

    print(f"✅ 登录成功！当前页面: {current_url}")
    print(f"   会话已保存到: {resolve_user_data_dir()}")
    return True


def check_login(page) -> bool:
    """检查是否已登录"""
    page.goto(DASHBOARD_URL, wait_until="domcontentloaded", timeout=30000)
    time.sleep(2)
    current_url = page.url
    if "signin" in current_url or "login" in current_url:
        return False
    return True


def escape_markdown_for_zhihu(text: str) -> str:
    """将 Markdown 内容转换为知乎编辑器兼容格式"""
    # Zhihu 编辑器接受标准 Markdown
    return text


def create_draft(page, md_path: str, headless: bool) -> str:
    """在知乎专栏创建草稿"""
    if not os.path.exists(md_path):
        print(f"❌ 文件不存在: {md_path}")
        return None

    # Accept both .md and .txt files
    with open(md_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Extract title and body
    title = "未命名文章"
    body = md_content
    if md_content.startswith("---"):
        end = md_content.find("---", 3)
        if end != -1:
            fm_block = md_content[3:end].strip()
            body = md_content[end + 3:].strip()
            for line in fm_block.split("\n"):
                line = line.strip()
                if ":" in line:
                    key, _, val = line.partition(":")
                    if key.strip().lower() == "title":
                        title = val.strip().strip("\"'")
                        break

    # If title not in frontmatter, try first heading
    if title == "未命名文章":
        match = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
        if match:
            title = match.group(1).strip()
        else:
            # Try first non-empty line as title (for .txt pipeline files)
            for line in body.split("\n"):
                line = line.strip()
                if line and not line.startswith("#") and not line.startswith("["):
                    title = line
                    break

    print(f"📝 文章: {title}")
    print(f"   正文长度: {len(body)} 字符")

    if not check_login(page):
        print("❌ 未登录，请先运行 --login")
        return None

    print("🌐 正在打开知乎专栏编辑器...")
    page.goto(WRITE_URL, wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)

    try:
        # Wait for editor to load
        page.wait_for_selector(".WriteIndex-titleInput", timeout=15000)
    except PTimeout:
        print("⚠️ 编辑器加载超时，尝试备用选择器...")
        try:
            page.wait_for_selector("div[data-texthashtag]", timeout=10000)
        except PTimeout:
            # Try to dump page for debugging
            print("⚠️ 编辑器可能结构已变，尝试通用填写...")

    # Fill title
    try:
        title_input = page.locator(".WriteIndex-titleInput")
        if title_input.is_visible():
            title_input.fill("")
            title_input.type(title, delay=50)
            print("  ✅ 标题已填写")
    except Exception as e:
        print(f"  ⚠️ 标题填写异常: {e}")

    # Fill content body
    try:
        # Zhihu editor uses contenteditable div
        content_div = page.locator(".Editable-editor .DraftEditor-editorContainer, .RichText-editor, div[contenteditable='true']").first
        if content_div.is_visible():
            content_div.click()
            # Type in chunks to avoid issues
            chunk_size = 500
            body_text = body
            # Remove markdown title if it matches article title
            body_text = re.sub(r"^#\s+.*\n?", "", body_text, count=1)
            for i in range(0, len(body_text), chunk_size):
                chunk = body_text[i:i + chunk_size]
                content_div.type(chunk, delay=10)
            print("  ✅ 正文已填写")
    except Exception as e:
        print(f"  ⚠️ 正文填写异常: {e}")

    print(f"\n✅ 草稿已创建在知乎专栏编辑器！")
    print(f"   请前往 {WRITE_URL} 查看和编辑草稿")
    print(f"   或者手动编辑后，稍后运行 --publish 发布")

    # Return the write URL as draft identifier
    return WRITE_URL


def publish_draft(page, draft_id: str, headless: bool):
    """发布已有草稿（通过访问草稿 URL 点击发布）"""
    if not check_login(page):
        print("❌ 未登录，请先运行 --login")
        return False

    print(f"🌐 正在访问草稿: {draft_id}")

    try:
        page.goto(draft_id, wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
    except Exception as e:
        print(f"❌ 页面加载失败: {e}")
        return False

    # Try to find and click publish button
    publish_selectors = [
        "button:has-text('发布')",
        ".PublishPanel-submitButton",
        "button.PublishButton",
        "button:has-text('发布文章')",
        "[data-role='publish']",
    ]

    for selector in publish_selectors:
        try:
            btn = page.locator(selector).first
            if btn.is_visible(timeout=3000):
                btn.click()
                print(f"  ✅ 已点击发布按钮 ({selector})")
                time.sleep(2)

                # Check for confirmation dialogs
                try:
                    confirm_btn = page.locator("button:has-text('确认发布'), button:has-text('确定')").first
                    if confirm_btn.is_visible(timeout=3000):
                        confirm_btn.click()
                        print("  ✅ 已确认发布")
                except Exception:
                    pass

                print(f"\n🎉 文章已提交发布！")
                print(f"   知乎审核通常需要几分钟到几小时。")
                return True
        except Exception:
            continue

    print("❌ 未找到发布按钮。请手动在知乎页面上发布。")
    print(f"   草稿地址: {draft_id}")
    return False


def generate_preview(md_path: str) -> str:
    """生成知乎格式预览 HTML"""
    if not os.path.exists(md_path):
        print(f"❌ 文件不存在: {md_path}")
        return None

    with open(md_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Simple preview - just output the markdown
    print("=" * 56)
    print("📄 知乎格式预览")
    print("=" * 56)
    print(md_content)
    print("=" * 56)
    print(f"总字符数: {len(md_content)}")
    print("注意：知乎正文建议在 50000 字以内")
    return md_content


# ── 主入口 ──

def main():
    parser = argparse.ArgumentParser(description="知乎专栏发布脚本（Playwright 自动化）")
    parser.add_argument("--login", action="store_true", help="首次登录：保存浏览器会话")
    parser.add_argument("--draft", metavar="MD_FILE", help="创建草稿")
    parser.add_argument("--publish", metavar="DRAFT_URL", help="发布草稿（草稿 URL）")
    parser.add_argument("--preview", metavar="MD_FILE", help="预览模式（仅输出格式检查结果）")
    parser.add_argument("--status", action="store_true", help="检查登录状态")
    parser.add_argument("--headless", action="store_true", help="无头模式（默认有头）")
    parser.add_argument("--user-data-dir", help="浏览器用户数据目录（覆盖环境变量）")
    args = parser.parse_args()

    # Validate args
    actions = [args.login, args.draft, args.publish, args.preview, args.status]
    if sum(1 for a in actions if a) == 0:
        print("❌ 请指定操作: --login / --draft / --publish / --preview / --status")
        parser.print_help()
        sys.exit(1)

    user_data_dir = args.user_data_dir or resolve_user_data_dir()

    # Special case: --preview doesn't need browser
    if args.preview:
        generate_preview(args.preview)
        return

    # --status only needs basic check
    if args.status:
        os.makedirs(user_data_dir, exist_ok=True)
        playwright, context, page = create_browser(headless=True, user_data_dir=user_data_dir)
        try:
            if check_login(page):
                print("✅ 知乎登录状态：有效")
            else:
                print("❌ 知乎登录状态：未登录（请运行 --login）")
        finally:
            close_browser(playwright, context)
        return

    # Browser-required operations
    headless = args.headless
    playwright, context, page = create_browser(headless=headless, user_data_dir=user_data_dir)

    try:
        if args.login:
            success = login_session(page)
            if not success:
                sys.exit(1)

        elif args.draft:
            draft_url = create_draft(page, args.draft, headless)
            if draft_url:
                # Update draft-state.json if present
                article_dir = os.path.dirname(os.path.abspath(args.draft))
                state_path = os.path.join(article_dir, ".draft-state.json")
                if os.path.exists(state_path):
                    with open(state_path, "r", encoding="utf-8") as f:
                        state = json.load(f)
                    state["drafts"]["zhihu"] = {
                        "status": "draft",
                        "draft_id": draft_url,
                        "url": draft_url,
                        "updated_at": datetime.now().isoformat(),
                        "error": None,
                    }
                    with open(state_path, "w", encoding="utf-8") as f:
                        json.dump(state, f, ensure_ascii=False, indent=2)
                    print(f"📋 已更新草稿状态: {state_path}")
            else:
                sys.exit(1)

        elif args.publish:
            success = publish_draft(page, args.publish, headless)
            if not success:
                sys.exit(1)

    finally:
        close_browser(playwright, context)


if __name__ == "__main__":
    main()
