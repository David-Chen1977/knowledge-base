#!/usr/bin/env python3
"""
toutiao_publisher.py — 头条号发布脚本（Playwright 浏览器自动化）

通过 Playwright 启动已登录 Chromium 浏览器，在头条号创建/发布草稿。
需要先手动登录一次以保存会话（使用 --login 标志）。

用法:
    python toutiao_publisher.py --login                首次登录（保存会话）
    python toutiao_publisher.py --draft <md_file>      创建草稿
    python toutiao_publisher.py --publish <draft_url>  发布草稿
    python toutiao_publisher.py --preview <md_file>    预览模式
    python toutiao_publisher.py --status               检查登录状态
    python toutiao_publisher.py --headless             无头模式（默认有头）

配置:
    TOUTIAO_USER_DATA_DIR  浏览器用户数据目录（默认 ~/.config/sisyphus-browser/toutiao）

工作流:
    1. python toutiao_publisher.py --login         # 首次：手动登录头条号
    2. python toutiao_publisher.py --draft article.md   # 创建草稿
    3. # 人工在 mp.toutiao.com 上审阅草稿
    4. python toutiao_publisher.py --publish <draft_url>  # 发布
"""

import os
import sys
import json
import re
import argparse
import time
from datetime import datetime

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PTimeout
except ImportError:
    print("❌ 请先安装 playwright: pip install playwright && python -m playwright install chromium")
    sys.exit(1)


# ── 配置 ──

DEFAULT_USER_DATA_DIR = os.path.expanduser("~/.config/sisyphus-browser/toutiao")
MP_URL = "https://mp.toutiao.com"
PUBLISH_URL = f"{MP_URL}/profile_v4/graphic/publish"
DRAFT_LIST_URL = f"{MP_URL}/profile_v4/graphic/drafts"
ARTICLE_LIST_URL = f"{MP_URL}/profile_v4/graphic/article"


def resolve_user_data_dir() -> str:
    return os.environ.get("TOUTIAO_USER_DATA_DIR", DEFAULT_USER_DATA_DIR)


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

def _is_login_page(page) -> bool:
    """Check if current page shows a Toutiao login form (content-based, not URL-based)."""
    try:
        # Check for login form elements in the page
        login_classes = [
            ".web-login-button",
            ".web-login-union__login__form",
            ".web-login-normal-input__input",
            ".web-login-scan-code__content",
        ]
        for sel in login_classes:
            try:
                if page.locator(sel).first.is_visible(timeout=1000):
                    return True
            except Exception:
                continue
        # Check for login button with text
        login_btn = page.locator("button:has-text('登录')")
        try:
            if login_btn.is_visible(timeout=500):
                return True
        except Exception:
            pass
    except Exception:
        pass
    return False


def login_session(page) -> bool:
    """打开头条号登录页面，等待用户手动登录（自动检测登录完成）"""
    print("🔐 正在打开头条号登录页面...")
    print("   请在浏览器窗口中完成头条号登录（手机号+验证码或扫码）")
    page.goto(f"{MP_URL}/login", wait_until="domcontentloaded")

    # Wait for user to log in by polling (no blocking input())
    print("   检测到登录完成后自动继续（最长等待 5 分钟）...")
    start = time.time()
    while time.time() - start < 300:
        try:
            if not _is_login_page(page):
                print("   ⏳ 登录按钮消失，正在验证...")
                time.sleep(2)
                # Verify by navigating to drafts page
                page.goto(DRAFT_LIST_URL, wait_until="domcontentloaded", timeout=30000)
                time.sleep(2)
                if "login" not in page.url.lower() and not _is_login_page(page):
                    print(f"  ✅ 登录成功！当前页面: {page.url}")
                    print(f"   会话已保存到: {resolve_user_data_dir()}")
                    return True
                else:
                    # Go back to login page and continue waiting
                    page.goto(f"{MP_URL}/login", wait_until="domcontentloaded")
                    print("   ⚠️ 登录验证未通过，继续等待...")
        except Exception:
            pass
        time.sleep(1)

    print("❌ 登录超时（5分钟），请重试 --login")
    return False


def check_login(page) -> bool:
    """检查是否已登录头条号（检测页面内容，不依赖 URL）"""
    try:
        page.goto(DRAFT_LIST_URL, wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        if "login" in page.url.lower():
            return False
        if _is_login_page(page):
            return False
        return True
    except Exception:
        return False


def create_draft(page, md_path: str, headless: bool) -> str:
    """在头条号创建草稿"""
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

    if title == "未命名文章":
        # Try H1 heading
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

    print("🌐 正在打开头条号后台...")
    # Step 1: Visit main dashboard first to establish session cookies
    try:
        page.goto(MP_URL, wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
    except Exception:
        pass

    # Step 2: Check if we're logged in by looking for login redirect
    if "login" in page.url.lower() or "passport" in page.url.lower():
        print("⚠️  被重定向到登录页面，尝试重新加载会话...")
        # Try the drafts page which sometimes works better
        try:
            page.goto(DRAFT_LIST_URL, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)
        except Exception:
            pass
        if "login" in page.url.lower() or "passport" in page.url.lower():
            print("❌ 会话已过期，请重新运行 --login")
            return None

    # Step 3: Navigate to publish editor
    print("🌐 正在打开头条号图文编辑器...")
    try:
        page.goto(PUBLISH_URL, wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
    except Exception as e:
        print(f"⚠️  编辑器页面加载异常: {e}")
        # If redirected to login, the session might have expired
        if "login" in page.url.lower():
            print("❌ 会话已过期，请重新运行 --login")
            return None

    # Fill title
    try:
        title_input = page.locator("textarea[placeholder*='标题'], textarea.editor-title, input[placeholder*='标题'], .publish-title-input, input.article-title").first
        if title_input.is_visible(timeout=5000):
            title_input.fill("")
            title_input.type(title, delay=50)
            print("  ✅ 标题已填写")
        else:
            print("  ⚠️ 未找到标题输入框，尝试备用选择器...")
            for sel in [
                "div[class*='title'] input, div[class*='title'] textarea",
                "input:not([type=hidden])",
                "textarea:not([type=hidden])",
                "[class*=title] [contenteditable]",
                ".byte-editor-title input, .byte-editor-title [contenteditable]",
                "div[class*=Title] div[class*=editor]",
                "div[spellcheck]",
                "div[data-role=title]",
                "#publish-title",
            ]:
                try:
                    alt = page.locator(sel).first
                    if alt.is_visible(timeout=1000):
                        alt.click()
                        alt.fill("")
                        page.keyboard.type(title, delay=50)
                        print(f"  ✅ 标题已填写 (via {sel})")
                        break
                except Exception:
                    continue
            else:
                print("  ⚠️  所有标题选择器均未匹配")
    except Exception as e:
        print(f"  ⚠️ 标题填写异常: {e}")

    # Fill content body
    # Debug: dump page HTML to find editor selectors
    force_html = os.environ.get("TOUTIAO_DEBUG_HTML")
    debug_saved = False

    try:
        # Toutiao editor uses contenteditable div or rich text area
        content_selectors = [
            "div.NoteEditor",
            "div.editor-content",
            "div[contenteditable='true']",
            "div.ProseMirror",
            "div.publish-textarea",
        ]
        content_div = None
        for sel in content_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=2000):
                    content_div = el
                    break
            except Exception:
                continue

        if not content_div:
            # Debug: try ALL contenteditable divs and log their attributes
            print("  ⚠️ 未找到正文编辑器，尝试扩展搜索...")
            for broad_sel in [
                "div[contenteditable]",
                "section[contenteditable]",
                "[class*=editor]",
                "[class*=Editor]",
                "div[id*=editor]",
                "div[id*=Editor]",
                "div[role=textbox]",
                "[class*=content] [contenteditable]",
                "[class*=Content] [contenteditable]",
                "[class*=article] [contenteditable]",
                "[class*=Article] [contenteditable]",
                "div[spellcheck]",
                ".byte-editor",
                "[class^=editor-]",
                "[class*=richtext]",
                "[class*=rich-text]",
                ".ql-editor",
                ".tiptap",
                "[data-slate-editor]",
            ]:
                try:
                    el = page.locator(broad_sel).first
                    if el.is_visible(timeout=1000):
                        content_div = el
                        print(f"  ✅ 找到正文编辑器 (via {broad_sel})")
                        break
                except Exception:
                    continue

        if not content_div and force_html and not debug_saved:
            with open(force_html, "w", encoding="utf-8") as df:
                df.write(page.content())
            debug_saved = True
            print(f"  📄 HTML已保存: {force_html}")
            # Also log all visible elements
            all_visible = page.locator("body *").all()
            print(f"  📋 页面上共有 {len(all_visible)} 个元素")

        if content_div:
            content_div.click()
            time.sleep(1)

            # Clean body: remove the markdown title if it matches article title
            body_text = body
            body_text = re.sub(r"^#\s+.*\n?", "", body_text, count=1)

            # Type in chunks
            chunk_size = 300
            for i in range(0, len(body_text), chunk_size):
                chunk = body_text[i:i + chunk_size]
                content_div.type(chunk, delay=5)
                time.sleep(0.1)

            print("  ✅ 正文已填写")
        else:
            print("  ⚠️ 未找到正文编辑器")
    except Exception as e:
        print(f"  ⚠️ 正文填写异常: {e}")

    # Save as draft
    print("💾 正在保存草稿...")
    try:
        # Try "Save Draft" button
        draft_btn = page.locator("button:has-text('保存草稿'), button:has-text('存草稿'), span:has-text('保存草稿')").first
        if draft_btn.is_visible(timeout=5000):
            draft_btn.click()
            time.sleep(3)
            print("  ✅ 草稿已保存")
        else:
            # If no explicit draft button, the content auto-saves
            print("  ℹ️ 头条号编辑器可能自动保存（检查草稿列表确认）")
    except Exception as e:
        print(f"  ⚠️ 保存草稿异常: {e}")

    # Navigate to draft list to get the draft URL
    time.sleep(2)
    page.goto(DRAFT_LIST_URL, wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)

    # Try to get the most recent draft's link
    current_url = page.url
    print(f"\n✅ 草稿创建完成！")
    print(f"   请前往 {DRAFT_LIST_URL} 查看和编辑草稿")
    print(f"   或者手动编辑后，稍后运行 --publish 发布")

    return DRAFT_LIST_URL


def publish_draft(page, draft_url: str, headless: bool):
    """发布已有草稿"""
    if not check_login(page):
        print("❌ 未登录，请先运行 --login")
        return False

    print(f"🌐 正在访问草稿列表...")

    try:
        page.goto(DRAFT_LIST_URL, wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
    except Exception as e:
        print(f"❌ 页面加载失败: {e}")
        return False

    # Try to find and click publish button in the draft list
    publish_selectors = [
        "button:has-text('发布')",
        "button:has-text('发表')",
        "div.publish-btn",
        "button.publish-button",
        "span:has-text('发布')",
    ]

    for selector in publish_selectors:
        try:
            btn = page.locator(selector).first
            if btn.is_visible(timeout=3000):
                btn.click()
                print(f"  ✅ 已点击发布按钮")
                time.sleep(2)

                # Confirm dialog
                try:
                    confirm = page.locator("button:has-text('确认发布'), button:has-text('确定'), div:has-text('确认发布') button").first
                    if confirm.is_visible(timeout=3000):
                        confirm.click()
                        print("  ✅ 已确认发布")
                        time.sleep(2)
                except Exception:
                    pass

                print(f"\n🎉 文章已提交发布！")
                print(f"   头条审核通常需要几分钟到几小时。")
                return True
        except Exception:
            continue

    print("❌ 未找到发布按钮。请手动在头条号后台发布。")
    print(f"   草稿地址: {draft_url}")
    return False


def generate_preview(md_path: str) -> str:
    """生成头条号格式预览"""
    if not os.path.exists(md_path):
        print(f"❌ 文件不存在: {md_path}")
        return None

    with open(md_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    print("=" * 56)
    print("📄 头条号格式预览")
    print("=" * 56)
    print(md_content)
    print("=" * 56)
    print(f"总字符数: {len(md_content)}")
    print("注意：头条号正文建议在 10000 字以内，过多可能被截断")
    return md_content


# ── 主入口 ──

def main():
    parser = argparse.ArgumentParser(description="头条号发布脚本（Playwright 自动化）")
    parser.add_argument("--login", action="store_true", help="首次登录：保存浏览器会话")
    parser.add_argument("--draft", metavar="MD_FILE", help="创建草稿")
    parser.add_argument("--publish", metavar="DRAFT_URL", help="发布草稿（草稿列表 URL）")
    parser.add_argument("--preview", metavar="MD_FILE", help="预览模式（仅输出格式检查结果）")
    parser.add_argument("--status", action="store_true", help="检查登录状态")
    parser.add_argument("--headless", action="store_true", help="无头模式（默认有头）")
    parser.add_argument("--user-data-dir", help="浏览器用户数据目录（覆盖环境变量）")
    args = parser.parse_args()

    actions = [args.login, args.draft, args.publish, args.preview, args.status]
    if sum(1 for a in actions if a) == 0:
        print("❌ 请指定操作: --login / --draft / --publish / --preview / --status")
        parser.print_help()
        sys.exit(1)

    user_data_dir = args.user_data_dir or resolve_user_data_dir()

    if args.preview:
        generate_preview(args.preview)
        return

    if args.status:
        os.makedirs(user_data_dir, exist_ok=True)
        playwright, context, page = create_browser(headless=True, user_data_dir=user_data_dir)
        try:
            if check_login(page):
                print("✅ 头条号登录状态：有效")
            else:
                print("❌ 头条号登录状态：未登录（请运行 --login）")
        finally:
            close_browser(playwright, context)
        return

    headless = args.headless
    playwright, context, page = create_browser(headless=headless, user_data_dir=user_data_dir)

    try:
        if args.login:
            success = login_session(page)
            if not success:
                sys.exit(1)

        elif args.draft:
            result_url = create_draft(page, args.draft, headless)
            if result_url:
                article_dir = os.path.dirname(os.path.abspath(args.draft))
                state_path = os.path.join(article_dir, ".draft-state.json")
                if os.path.exists(state_path):
                    with open(state_path, "r", encoding="utf-8") as f:
                        state = json.load(f)
                    state["drafts"]["toutiao"] = {
                        "status": "draft",
                        "draft_id": result_url,
                        "url": result_url,
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
