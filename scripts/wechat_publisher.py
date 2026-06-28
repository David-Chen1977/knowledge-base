#!/usr/bin/env python3
"""
微信公众号文章发布脚本
功能：将 Markdown 格式的文章转换为 HTML，通过微信官方 API 创建草稿箱
      支持封面/正文图片上传、inline 图片映射、草稿更新、Keychain 凭证

使用方法：
    python wechat_publisher.py <markdown_file> [options]

选项：
    --md <file>       Markdown 文件路径（替代 positional file）
    --preview         预览模式：仅输出 HTML 到终端，不调用 API
    --title           文章标题（默认从文件名或文件内标题提取）
    --author          作者（默认：陈道雷）
    --digest          摘要（默认取正文前100字）
    --source-url      原文链接
    --cover           封面图片路径
    --body-images     正文图片路径列表，按顺序替换 BODY_IMG_1, BODY_IMG_2, ...
    --images          正文图片映射: "标签1=路径1,标签2=路径2"（inline 替换）
    --update <id>     更新已有草稿的 media_id
    --index <n>       多图文草稿中的索引（默认0）

示例：
    python wechat_publisher.py article.md
    python wechat_publisher.py article.md --cover cover.png --body-images img1.png img2.png
    python wechat_publisher.py article.md --images "示意图1=img1.png,示意图2=img2.png"
    python wechat_publisher.py --md article.md --preview
    python wechat_publisher.py article.md --update MEDIA_ID --index 0

配置：
    设置环境变量或同级目录 .env 文件：
        WECHAT_APP_ID=your_app_id
        WECHAT_APP_SECRET=your_app_secret
    或 macOS Keychain 存储 secret（account=wx7ae4cfe0d680c0fe, service=wechat-publisher）

依赖：
    pip install requests markdown
"""

import os
import sys
import json
import re
import argparse
import hashlib
import time
import subprocess
from typing import Optional

try:
    import requests
except ImportError:
    print("请先安装 requests: pip install requests")
    sys.exit(1)

try:
    import markdown
except ImportError:
    print("请先安装 markdown: pip install markdown")
    sys.exit(1)

# 全局 SSL 配置：系统 LibreSSL 2.8.3 与 urllib3 v2 不兼容，跳过证书验证
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
REQUESTS_KWARGS = {"verify": False, "timeout": 30}

# ============ 配置 ============
# 方式1：设置环境变量（推荐）
# 方式2：在同级目录创建 .env 文件
# 方式3：macOS Keychain（仅 APP_SECRET）

APP_ID = os.environ.get("WECHAT_APP_ID", "")
APP_SECRET = os.environ.get("WECHAT_APP_SECRET", "")

# 如果环境变量未设置，尝试读取 .env 文件
if not APP_ID or not APP_SECRET:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip("\"'")
                    if key == "WECHAT_APP_ID":
                        APP_ID = value
                    elif key == "WECHAT_APP_SECRET":
                        APP_SECRET = value

# 如果仍然没有 APP_SECRET，尝试 macOS Keychain
if not APP_SECRET:
    try:
        result = subprocess.run(
            ["security", "find-generic-password", "-a", "wx7ae4cfe0d680c0fe", "-s", "wechat-publisher", "-w"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            APP_SECRET = result.stdout.strip()
            print("🔑 已通过 macOS Keychain 获取 APP_SECRET")
    except Exception:
        pass


def resolve_app_secret() -> Optional[str]:
    """从环境变量或 macOS Keychain 解析 AppSecret"""
    secret = os.environ.get("WECHAT_APP_SECRET", "")
    if secret:
        return secret
    try:
        result = subprocess.run(
            ["security", "find-generic-password", "-a", "wx7ae4cfe0d680c0fe", "-s", "wechat-publisher", "-w"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return None


# 默认作者（微信API限制：最多2个中文字符或8个英文字符）
DEFAULT_AUTHOR = "道雷"

# 微信API限制常量
MAX_TITLE_BYTES = 200     # 标题：最多200字节（微信API实际限制约64字符）
MAX_AUTHOR_BYTES = 8      # 作者：最多8字节（约2个中文字符）
MAX_DIGEST_BYTES = 60     # 摘要：最多60字节（约20个中文字符）


def get_access_token(app_id: str, app_secret: str) -> Optional[str]:
    """获取微信 API 的 access_token"""
    url = "https://api.weixin.qq.com/cgi-bin/token"
    params = {
        "grant_type": "client_credential",
        "appid": app_id,
        "secret": app_secret,
    }
    try:
        resp = requests.get(url, params=params, **REQUESTS_KWARGS)
        data = resp.json()
        if "access_token" in data:
            print(f"✅ access_token 获取成功（有效期 {data.get('expires_in', 7200)} 秒）")
            return data["access_token"]
        else:
            print(f"❌ 获取 access_token 失败: {data}")
            return None
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return None


def parse_frontmatter(md_content: str) -> tuple:
    """
    解析 YAML frontmatter，返回 (metadata_dict, body_content)
    支持 --- 包裹的简单 key: value 格式
    """
    fm = {}
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
                    key = key.strip().lower()
                    val = val.strip().strip("\"'")
                    if val:
                        fm[key] = val
    return fm, body


def extract_title(md_content: str, filename: str = "") -> str:
    """从 Markdown 内容中提取标题（优先 frontmatter，其次 # 标题，最后文件名）"""
    fm, _ = parse_frontmatter(md_content)
    if "title" in fm:
        return fm["title"].strip()
    match = re.search(r"^#\s+(.+)$", md_content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    if filename:
        name = os.path.splitext(os.path.basename(filename))[0]
        return name
    return "未命名文章"


def extract_digest(md_content: str, max_len: int = 40) -> str:
    """从正文提取摘要（微信API限制：推荐40字以内）"""
    _, body = parse_frontmatter(md_content)
    text = re.sub(r"^#+\s+", "", body, flags=re.MULTILINE)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"\[(.+?)\]\(.*?\)", r"\1", text)
    text = re.sub(r">+\s*.*?(?:\n|$)", "", text)
    text = re.sub(r"[-*_]{3,}", "", text)
    text = re.sub(r"\s+", "", text)
    text = text.strip()
    if len(text) > max_len:
        cut = text[:max_len]
        last_period = cut.rfind("。")
        if last_period > 0:
            return cut[:last_period + 1]
        return cut + "…"
    return text


def truncate_bytes(text: str, max_bytes: int) -> str:
    """截断字符串到指定字节数（UTF-8），避免截断多字节字符"""
    if len(text.encode("utf-8")) <= max_bytes:
        return text
    while text and len(text.encode("utf-8")) > max_bytes:
        text = text[:-1]
    return text


def upload_cover(access_token: str, image_path: str) -> Optional[str]:
    """上传封面图到微信素材库（type=thumb），返回 media_id（用于封面 thumb_media_id）"""
    url = "https://api.weixin.qq.com/cgi-bin/material/add_material"
    params = {"access_token": access_token, "type": "thumb"}
    try:
        with open(image_path, "rb") as f:
            files = {"media": (os.path.basename(image_path), f, "image/png")}
            resp = requests.post(url, params=params, files=files, **REQUESTS_KWARGS)
            data = resp.json()
            if "media_id" in data:
                print(f"✅ 封面上传成功！media_id: {data['media_id']}")
                return data["media_id"]
            else:
                print(f"⚠️ 封面上传失败: {data}")
                return None
    except Exception as e:
        print(f"❌ 封面上传异常: {e}")
        return None


def upload_body_image(access_token: str, image_path: str) -> Optional[str]:
    """上传正文图片到微信，返回可嵌入正文的永久 CDN URL"""
    url = "https://api.weixin.qq.com/cgi-bin/media/uploadimg"
    params = {"access_token": access_token}
    try:
        with open(image_path, "rb") as f:
            files = {"media": (os.path.basename(image_path), f, "image/png")}
            resp = requests.post(url, params=params, files=files, **REQUESTS_KWARGS)
            data = resp.json()
            if "url" in data:
                print(f"✅ 正文图片上传成功 → {data['url']}")
                return data["url"]
            else:
                print(f"⚠️ 正文图片上传失败: {data}")
                return None
    except Exception as e:
        print(f"❌ 正文图片上传异常: {e}")
        return None


def build_article(
    title: str,
    html_content: str,
    author: str = DEFAULT_AUTHOR,
    digest: str = "",
    source_url: str = "",
    thumb_media_id: str = "",
) -> dict:
    """构建微信草稿文章数据结构"""
    article = {
        "title": truncate_bytes(title, MAX_TITLE_BYTES),
        "author": truncate_bytes(author, MAX_AUTHOR_BYTES),
        "content": html_content,
        "content_source_url": source_url,
    }
    if digest:
        article["digest"] = truncate_bytes(digest, MAX_DIGEST_BYTES)
    if thumb_media_id:
        article["thumb_media_id"] = thumb_media_id
    article["need_open_comment"] = 0
    article["only_fans_can_comment"] = 0
    return article


def create_draft(
    access_token: str,
    title: str,
    html_content: str,
    author: str = DEFAULT_AUTHOR,
    digest: str = "",
    source_url: str = "",
    thumb_media_id: str = "",
) -> bool:
    """在微信草稿箱创建文章"""
    url = "https://api.weixin.qq.com/cgi-bin/draft/add"
    params = {"access_token": access_token}
    article = build_article(title, html_content, author, digest, source_url, thumb_media_id)
    body = {"articles": [article]}
    try:
        request_body = json.dumps(body, ensure_ascii=False)
        resp = requests.post(
            url, params=params,
            data=request_body.encode("utf-8"),
            headers={"Content-Type": "application/json; charset=utf-8"},
            **REQUESTS_KWARGS,
        )
        data = resp.json()
        if "media_id" in data:
            print(f"✅ 草稿创建成功！media_id: {data['media_id']}")
            print(f"   请前往公众号后台「草稿箱」查看和发布")
            return True
        else:
            print(f"❌ 草稿创建失败: {data}")
            return False
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False


def update_draft(
    access_token: str,
    media_id: str,
    title: str,
    html_content: str,
    author: str = DEFAULT_AUTHOR,
    digest: str = "",
    source_url: str = "",
    thumb_media_id: str = "",
    index: int = 0,
) -> bool:
    """更新已有草稿"""
    url = "https://api.weixin.qq.com/cgi-bin/draft/update"
    params = {"access_token": access_token}
    article = {
        "title": title,
        "author": author,
        "digest": digest,
        "content": html_content,
        "content_source_url": source_url,
    }
    if thumb_media_id:
        article["thumb_media_id"] = thumb_media_id
    body = {"media_id": media_id, "index": index, "articles": article}
    try:
        request_body = json.dumps(body, ensure_ascii=False)
        resp = requests.post(
            url, params=params,
            data=request_body.encode("utf-8"),
            headers={"Content-Type": "application/json; charset=utf-8"},
            **REQUESTS_KWARGS,
        )
        data = resp.json()
        if "errcode" not in data or data.get("errcode") == 0:
            print(f"✅ 草稿更新成功！media_id: {media_id}")
            return True
        else:
            print(f"❌ 草稿更新失败: {data}")
            return False
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False


def optimize_wechat_html(html: str) -> str:
    """对微信 HTML 进行最终优化（样式增强、空段落清理）"""
    html = html.replace(
        '<section style="height:1px;background:#d0d0d0;margin:25px 0;"></section>',
        '<section style="height:1px;background:#d0d0d0;margin:20px 0 15px 0;"></section>',
    )
    html = html.replace("<strong>", '<strong style="color:#333333;">')
    html = f'<section data-style="default">{html}</section>'
    html = re.sub(r'<p>\s*</p>', '', html)
    return html


def markdown_to_wechat_html(md_content: str, image_map: dict = None) -> str:
    """
    将 Markdown 转换为微信公众号兼容的 HTML
    - 自动剥离 YAML frontmatter
    - image_map: { "标签名": "微信URL" }，会替换正文中 ![标签名](BODY_IMG_N) 占位符
    - 应用内联样式优化代码块、表格、引用等渲染
    """
    _, body = parse_frontmatter(md_content)

    if image_map:
        for i, (label, url) in enumerate(image_map.items(), start=1):
            body = re.sub(
                rf'!\[.*?\]\(BODY_IMG_{i}\)',
                f'<img src="{url}" alt="{label}" data-img="inline" />',
                body,
            )

    html = markdown.markdown(
        body,
        extensions=[
            "markdown.extensions.extra",
            "markdown.extensions.codehilite",
            "markdown.extensions.tables",
        ],
    )

    # 将 inline 图片标记替换为带样式的 img
    html = html.replace(
        'data-img="inline"',
        'style="width:100%;border-radius:6px;margin:15px 0;display:block;"',
    )

    # 代码样式
    html = html.replace('<code>', '<code style="background:#f5f5f5;padding:2px 6px;border-radius:3px;font-size:0.9em;">')
    html = html.replace('<pre>', '<pre style="background:#f8f8f8;padding:15px;border-radius:6px;overflow-x:auto;font-size:0.85em;line-height:1.6;">')

    # 表格样式
    html = html.replace('<table>', '<table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:0.95em;">')
    html = html.replace('<td>', '<td style="border:1px solid #e0e0e0;padding:8px 12px;">')
    html = html.replace('<th>', '<th style="border:1px solid #e0e0e0;padding:8px 12px;background:#f5f7fa;font-weight:600;">')

    # 引用样式
    html = html.replace('<blockquote>', '<blockquote style="border-left:4px solid #c0392b;padding:10px 15px;margin:15px 0;background:#fafafa;color:#555;">')

    # 分割线
    html = html.replace(
        "<hr />",
        '<section style="height:1px;background:#d0d0d0;margin:25px 0;"></section>',
    )

    html = optimize_wechat_html(html)

    return html


def upload_images_from_map(access_token: str, images_arg: str) -> dict:
    """解析 --images 参数并上传所有图片，返回 {label: url} 映射"""
    image_map = {}
    if not images_arg:
        return image_map
    print("📤 上传正文图片...")
    for pair in images_arg.split(","):
        pair = pair.strip()
        if "=" not in pair:
            continue
        label, path = pair.split("=", 1)
        label = label.strip()
        path = path.strip()
        if not os.path.exists(path):
            print(f"  ⚠️ 图片不存在: {path}")
            continue
        print(f"  {label}...", end=" ")
        url = upload_body_image(access_token, path)
        if url:
            image_map[label] = url
    return image_map


def upload_body_images_list(access_token: str, body_images: list) -> dict:
    """上传 --body-images 路径列表，返回 {BODY_IMG_N: url} 映射"""
    body_image_map = {}
    if not body_images:
        return body_image_map
    print(f"📤 正在上传 {len(body_images)} 张正文图片...")
    for i, img_path in enumerate(body_images, start=1):
        placeholder = f"BODY_IMG_{i}"
        if os.path.exists(img_path):
            url = upload_body_image(access_token, img_path)
            if url:
                body_image_map[placeholder] = url
        else:
            print(f"⚠️ 正文图片不存在，跳过: {img_path}")
    return body_image_map


def main():
    parser = argparse.ArgumentParser(description="将 Markdown 文章发布到微信公众号草稿箱")
    parser.add_argument("file", nargs="?", help="Markdown 文件路径")
    parser.add_argument("--md", help="Markdown 文件路径（替代 positional file）")
    parser.add_argument("--preview", action="store_true", help="预览模式：仅输出 HTML 到终端，不调用 API")
    parser.add_argument("--title", help="文章标题（默认从文件提取）")
    parser.add_argument("--author", default=DEFAULT_AUTHOR, help="作者名称")
    parser.add_argument("--digest", help="文章摘要（默认自动提取）")
    parser.add_argument("--source-url", help="原文链接")
    parser.add_argument("--cover", help="封面图片路径（可选）")
    parser.add_argument("--body-images", nargs="*", help="正文图片路径列表，按顺序替换 BODY_IMG_1, BODY_IMG_2, ...")
    parser.add_argument("--images", help='正文图片映射: "标签1=路径1,标签2=路径2"')
    parser.add_argument("--update", help="更新已有草稿的 media_id")
    parser.add_argument("--index", type=int, default=0, help="多图文草稿中的索引（默认0）")
    args = parser.parse_args()

    # 支持 --md 作为 file 的别名
    file_path = args.md or args.file

    # 检查凭证（尝试 Keychain 兜底）
    app_id = APP_ID
    app_secret = APP_SECRET
    if not app_secret:
        app_secret = resolve_app_secret()
    if not app_id or not app_secret:
        print("❌ 未设置公众号凭证")
        print("   请设置环境变量：")
        print("   export WECHAT_APP_ID=your_app_id")
        print("   export WECHAT_APP_SECRET=your_app_secret")
        print("   或在脚本同级目录创建 .env 文件")
        print("   或通过 macOS Keychain 存储 secret：")
        print('   security add-generic-password -a "wx7ae4cfe0d680c0fe" -s "wechat-publisher" -w "你的secret"')
        sys.exit(1)

    # 读取 Markdown 文件
    if not file_path:
        # 交互模式：列出可用的文章
        content_dir = os.path.join(os.path.dirname(__file__), "..", "内容输出")
        if os.path.exists(content_dir):
            print("可发布的文章：")
            for root, dirs, files in os.walk(content_dir):
                for f in files:
                    if f == "公众号版.md":
                        rel_path = os.path.relpath(os.path.join(root, f), os.path.dirname(__file__))
                        print(f"  {rel_path}")
        print("\n用法: python wechat_publisher.py <markdown_file> [options]")
        sys.exit(1)

    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    # 自动追加标准化结尾（如果文章还没包含的话）
    footer_path = os.path.join(os.path.dirname(__file__), "wechat_footer.template.md")
    if os.path.exists(footer_path):
        with open(footer_path, "r", encoding="utf-8") as f:
            footer = f.read().strip()
        if footer not in md_content:
            md_content = md_content.rstrip() + "\n\n" + footer
            print("📝 已追加标准化结尾模板")

    # 提取信息（优先 frontmatter）
    title = args.title or extract_title(md_content, file_path)
    digest = args.digest or extract_digest(md_content)

    # 预览模式：仅输出 HTML 到终端
    if args.preview:
        html_content = markdown_to_wechat_html(md_content)
        print(f"<!-- 预览: {title} -->")
        print(f"<!-- 摘要: {digest} -->")
        print(html_content)
        return

    # 获取 access_token
    token = get_access_token(app_id, app_secret)
    if not token:
        sys.exit(1)

    # 上传正文图片（--body-images 格式），替换 md 中的 BODY_IMG_1/2/3 等占位符
    body_image_map = upload_body_images_list(token, args.body_images)
    for placeholder, url in body_image_map.items():
        md_content = md_content.replace(placeholder, url)
        print(f"   ↳ 替换 {placeholder} → {url}")

    # 上传正文图片（--images 格式），inline 替换
    image_map = upload_images_from_map(token, args.images)

    html_content = markdown_to_wechat_html(md_content, image_map)

    print(f"📄 文章: {title}")
    print(f"✍️  作者: {args.author}")
    print(f"📝 摘要: {digest[:60]}...")
    print(f"📏 正文长度: {len(html_content)} 字符（HTML）")

    # 上传封面（可选）
    thumb_id = ""
    if args.cover:
        print("📤 正在上传封面图片...")
        thumb_id = upload_cover(token, args.cover) or ""

    # 创建或更新草稿
    if args.update:
        success = update_draft(
            token,
            args.update,
            title,
            html_content,
            args.author,
            digest,
            args.source_url or "",
            thumb_id,
            args.index,
        )
    else:
        success = create_draft(
            token,
            title,
            html_content,
            args.author,
            digest,
            args.source_url or "",
            thumb_id,
        )

    if success:
        print("\n🎉 操作完成！请前往公众号后台确认。")
    else:
        print("\n❌ 操作失败，请检查错误信息。")
        sys.exit(1)


if __name__ == "__main__":
    main()
