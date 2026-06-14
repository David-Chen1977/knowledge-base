#!/usr/bin/env python3
"""
微信公众号文章发布脚本
功能：将 Markdown 格式的文章转换为 HTML，通过微信官方 API 创建草稿箱

使用方法：
    python wechat_publisher.py <markdown_file> [options]

选项：
    --title      文章标题（默认从文件名或文件内标题提取）
    --author     作者（默认：陈道雷）
    --digest     摘要（默认取正文前100字）
    --source-url 原文链接

配置：
    首次使用前在脚本顶部或环境变量设置 APP_ID 和 APP_SECRET
    或在同级目录创建 .env 文件：
        WECHAT_APP_ID=your_app_id
        WECHAT_APP_SECRET=your_app_secret

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

# ============ 配置 ============
# 方式1：直接在脚本中设置（不推荐共享给他人）
# 方式2：设置环境变量（推荐）
# 方式3：在同级目录创建 .env 文件

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
        resp = requests.get(url, params=params, timeout=10)
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


def markdown_to_wechat_html(md_content: str) -> str:
    """将 Markdown 转换为微信公众号兼容的 HTML（无内联样式，使用WeChat原生渲染）"""
    html = markdown.markdown(
        md_content,
        extensions=[
            "markdown.extensions.extra",
            "markdown.extensions.codehilite",
            "markdown.extensions.tables",
        ],
    )

    # WeChat不支持<hr />，用空section替代
    html = html.replace("<hr />", '<section style="height:1px;background:#e0e0e0;margin:15px 0;"></section>')

    # 去除所有内联style属性（WeChat用自己CSS渲染）
    html = re.sub(r'\s+style="[^"]*"', "", html)

    # 用<section>包裹作为标准微信富文本容器
    html = f'<section data-style="default">{html}</section>'

    return html


def extract_title(md_content: str, filename: str = "") -> str:
    """从 Markdown 内容中提取标题"""
    # 尝试提取第一个 # 标题
    match = re.search(r"^#\s+(.+)$", md_content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    # 文件名作为后备
    if filename:
        name = os.path.splitext(os.path.basename(filename))[0]
        return name
    return "未命名文章"


def extract_digest(md_content: str, max_len: int = 40) -> str:
    """从正文提取摘要（微信API限制：推荐40字以内）"""
    text = re.sub(r"^#+\s+", "", md_content, flags=re.MULTILINE)
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


def build_article(
    title: str,
    html_content: str,
    author: str = DEFAULT_AUTHOR,
    digest: str = "",
    source_url: str = "",
    thumb_media_id: str = "",
) -> dict:
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

    # 加上微信 API 要求的必填字段
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
        resp = requests.post(url, params=params, data=request_body.encode("utf-8"), headers={"Content-Type": "application/json; charset=utf-8"}, timeout=30)
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
        resp = requests.post(url, params=params, data=request_body.encode("utf-8"), headers={"Content-Type": "application/json; charset=utf-8"}, timeout=15)
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


def upload_image(access_token: str, image_path: str) -> Optional[str]:
    """上传图片到微信素材库，返回 media_id（用于封面）"""
    url = "https://api.weixin.qq.com/cgi-bin/material/add_material"
    params = {"access_token": access_token, "type": "image"}

    try:
        with open(image_path, "rb") as f:
            files = {"media": (os.path.basename(image_path), f, "image/jpeg")}
            resp = requests.post(url, params=params, files=files, timeout=30)
            data = resp.json()
            if "media_id" in data:
                print(f"✅ 图片上传成功！media_id: {data['media_id']}")
                return data["media_id"]
            else:
                print(f"⚠️ 图片上传失败: {data}")
                return None
    except Exception as e:
        print(f"❌ 图片上传异常: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="将 Markdown 文章发布到微信公众号草稿箱")
    parser.add_argument("file", nargs="?", help="Markdown 文件路径")
    parser.add_argument("--title", help="文章标题（默认从文件提取）")
    parser.add_argument("--author", default=DEFAULT_AUTHOR, help="作者名称")
    parser.add_argument("--digest", help="文章摘要（默认自动提取）")
    parser.add_argument("--source-url", help="原文链接")
    parser.add_argument("--cover", help="封面图片路径（可选）")
    parser.add_argument("--update", help="更新已有草稿的 media_id")
    parser.add_argument("--index", type=int, default=0, help="多图文草稿中的索引（默认0）")
    args = parser.parse_args()

    # 检查凭证
    if not APP_ID or not APP_SECRET:
        print("❌ 未设置公众号凭证")
        print("   请设置环境变量：")
        print("   export WECHAT_APP_ID=your_app_id")
        print("   export WECHAT_APP_SECRET=your_app_secret")
        print("   或在脚本同级目录创建 .env 文件")
        sys.exit(1)

    # 读取 Markdown 文件
    if not args.file:
        # 交互模式：列出可用的文章
        content_dir = os.path.join(os.path.dirname(__file__), "..", "内容输出")
        if os.path.exists(content_dir):
            print("可发布的文章：")
            for root, dirs, files in os.walk(content_dir):
                for f in files:
                    if f == "公众号版.md":
                        rel_path = os.path.relpath(os.path.join(root, f), os.path.dirname(__file__))
                        print(f"  {rel_path}")
        print("\n用法: python wechat_publisher.py <markdown_file>")
        sys.exit(1)

    if not os.path.exists(args.file):
        print(f"❌ 文件不存在: {args.file}")
        sys.exit(1)

    with open(args.file, "r", encoding="utf-8") as f:
        md_content = f.read()

    # 提取信息
    title = args.title or extract_title(md_content, args.file)
    digest = args.digest or extract_digest(md_content)
    html_content = markdown_to_wechat_html(md_content)

    print(f"📄 文章: {title}")
    print(f"✍️  作者: {args.author}")
    print(f"📝 摘要: {digest[:60]}...")
    print(f"📏 正文长度: {len(html_content)} 字符（HTML）")

    # 获取 access_token
    token = get_access_token(APP_ID, APP_SECRET)
    if not token:
        sys.exit(1)

    # 上传封面（可选）
    thumb_id = ""
    if args.cover:
        print("📤 正在上传封面图片...")
        thumb_id = upload_image(token, args.cover) or ""

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
