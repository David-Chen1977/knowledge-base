#!/usr/bin/env python3
"""
wechat_inline_upload.py — 公众号文章 + inline图片一步推送

使用方式：
    python wechat_inline_upload.py <markdown_file> \
        --cover <封面图> \
        --images "图说明1=路径1,图说明2=路径2"

示例：
    python wechat_inline_upload.py 三件套输出/05_文章.md \
        --cover 三件套输出/cover_05.png \
        --images "淘金热插图=三件套输出/inline_05_1.png,四方向图=三件套输出/inline_05_2.png"

流程：
    1. 上传封面 → thumb_media_id
    2. 上传正文图片 → 微信URL（用于<img>）
    3. 将 Markdown 中的图片占位符替换为微信URL
    4. 优化 HTML 渲染（标题、分割线、段落间距）
    5. 调用草稿箱 API
"""

import os, sys, re, json, argparse, time
from typing import Optional
import requests
import markdown

sys.path.insert(0, os.path.dirname(__file__))
from wechat_publisher import get_access_token, truncate_bytes

# 常量
MAX_TITLE_BYTES = 200
MAX_AUTHOR_BYTES = 8
MAX_DIGEST_BYTES = 60
DEFAULT_AUTHOR = "道雷"


def upload_inline_image(access_token: str, image_path: str) -> Optional[str]:
    """上传正文图片，返回可嵌入HTML的微信URL"""
    url = "https://api.weixin.qq.com/cgi-bin/media/uploadimg"
    params = {"access_token": access_token}
    try:
        with open(image_path, "rb") as f:
            files = {"media": (os.path.basename(image_path), f, "image/png")}
            resp = requests.post(url, params=params, files=files, timeout=30)
            data = resp.json()
            if "url" in data:
                print(f"  ✅ 上传成功 → url 已获取")
                return data["url"]
            else:
                print(f"  ⚠️ 上传失败: {data}")
                return None
    except Exception as e:
        print(f"  ❌ 异常: {e}")
        return None


def upload_cover_image(access_token: str, image_path: str) -> Optional[str]:
    """上传封面图，返回 media_id"""
    url = "https://api.weixin.qq.com/cgi-bin/material/add_material"
    params = {"access_token": access_token, "type": "image"}
    try:
        with open(image_path, "rb") as f:
            files = {"media": (os.path.basename(image_path), f, "image/png")}
            resp = requests.post(url, params=params, files=files, timeout=30)
            data = resp.json()
            if "media_id" in data:
                return data["media_id"]
            else:
                print(f"  ⚠️ 封面上传失败: {data}")
                return None
    except Exception as e:
        print(f"  ❌ 封面上传异常: {e}")
        return None


def optimize_wechat_html(html: str) -> str:
    """优化 HTML 在微信中的渲染效果"""

    # 1. 中文数字标题优化：<h2>一</h2> → 带分隔线的文字
    # 保留 <h2> 但增强视觉层次
    # 微信对 <h2> 的渲染是大号加粗，所以保留，但增加紧接的分隔线

    # 2. 分割线优化：<hr /> 已替换为 section，保留但增强
    html = html.replace(
        '<section style="height:1px;background:#e0e0e0;margin:15px 0;"></section>',
        '<section style="height:1px;background:#e0e0e0;margin:20px 0 15px 0;"></section>'
    )

    # 3. 段落间距优化：微信默认 <p> 间距小，给每段后加间距
    # 在微信富文本中，段落自动有间距，不需要额外处理

    # 4. 加粗后的行距优化
    html = html.replace("<strong>", '<strong style="color:#333333;">')

    # 5. 用 <section> 包裹作为标准微信容器
    # WeChat 在非草稿箱预览时使用 data-style 渲染
    html = f'<section data-style="default">{html}</section>'

    # 6. 去掉所有空 <p> 标签（markdown渲染有时会产生空的）
    html = re.sub(r'<p>\s*</p>', '', html)

    return html


def markdown_to_wechat_html(md_content: str, image_map: dict = None) -> str:
    """
    将 Markdown 转换为微信公众号兼容的 HTML
    image_map: { "图说明": "微信URL" }
    """
    # 预替换：将图片占位符替换为微信 img 标签
    if image_map:
        for label, url in image_map.items():
            # 匹配 ![label] 或 ![](path) 等模式
            md_content = md_content.replace(f"![{label}]", "")
            md_content = md_content.replace(f"![]({label})", "")
            # 在替换位置插入 img 标签（在段落开始处）
            img_tag = f'<img src="{url}" alt="{label}" style="width:100%;border-radius:8px;margin:10px 0;" />'
            md_content = md_content + f"\n\n{img_tag}\n"

    # 标准 markdown 转换
    html = markdown.markdown(
        md_content,
        extensions=[
            "markdown.extensions.extra",
            "markdown.extensions.codehilite",
            "markdown.extensions.tables",
        ],
    )

    # WeChat 兼容处理
    html = html.replace(
        "<hr />",
        '<section style="height:1px;background:#d0d0d0;margin:20px 0;"></section>'
    )

    # 优化渲染
    html = optimize_wechat_html(html)

    return html


def extract_title(md_content: str, filename: str = "") -> str:
    match = re.search(r"^#\s+(.+)$", md_content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    if filename:
        return os.path.splitext(os.path.basename(filename))[0]
    return "未命名"


def extract_digest(md_content: str, max_len: int = 40) -> str:
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


def create_draft(access_token, title, html_content, author, digest, source_url, thumb_media_id):
    """调用微信 API 创建草稿箱"""
    url = "https://api.weixin.qq.com/cgi-bin/draft/add"
    params = {"access_token": access_token}

    article = {
        "title": truncate_bytes(title, MAX_TITLE_BYTES),
        "author": truncate_bytes(author, MAX_AUTHOR_BYTES),
        "content": html_content,
        "content_source_url": source_url,
        "digest": truncate_bytes(digest, MAX_DIGEST_BYTES),
        "need_open_comment": 0,
        "only_fans_can_comment": 0,
    }
    if thumb_media_id:
        article["thumb_media_id"] = thumb_media_id

    body = {"articles": [article]}
    try:
        req = json.dumps(body, ensure_ascii=False)
        resp = requests.post(
            url, params=params,
            data=req.encode("utf-8"),
            headers={"Content-Type": "application/json; charset=utf-8"},
            timeout=30
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
        print(f"❌ 异常: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="公众号文章 + inline 图片一步推送")
    parser.add_argument("file", help="Markdown 文件路径")
    parser.add_argument("--cover", help="封面图片路径")
    parser.add_argument("--images", help='正文图片: "标签1=路径1,标签2=路径2"')
    parser.add_argument("--title", help="文章标题")
    parser.add_argument("--author", default=DEFAULT_AUTHOR)
    parser.add_argument("--digest", help="摘要")
    args = parser.parse_args()

    # 读取 Markdown
    if not os.path.exists(args.file):
        print(f"❌ 文件不存在: {args.file}")
        sys.exit(1)
    with open(args.file, "r", encoding="utf-8") as f:
        md_content = f.read()

    title = args.title or extract_title(md_content, args.file)
    digest = args.digest or extract_digest(md_content)

    print(f"📄 {title}")
    print(f"📝 摘要: {digest[:40]}...")

    # 获取 token
    from wechat_publisher import APP_ID, APP_SECRET
    token = get_access_token(APP_ID, APP_SECRET)
    if not token:
        sys.exit(1)

    # 1. 上传封面
    thumb_id = ""
    if args.cover:
        print("📤 上传封面图...")
        thumb_id = upload_cover_image(token, args.cover) or ""
        if thumb_id:
            print(f"   封面 media_id: {thumb_id}")

    # 2. 上传正文图片
    image_map = {}
    if args.images:
        print("📤 上传正文图片...")
        for pair in args.images.split(","):
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
            url = upload_inline_image(token, path)
            if url:
                image_map[label] = url

    # 3. 生成 HTML（含图片嵌入）
    print("🔄 生成微信 HTML...")
    html_content = markdown_to_wechat_html(md_content, image_map)
    print(f"   HTML 长度: {len(html_content)} 字符")

    # 4. 创建草稿
    if create_draft(token, title, html_content, args.author, digest, "", thumb_id):
        print("\n🎉 操作完成！请前往公众号后台确认。")
    else:
        print("\n❌ 操作失败")
        sys.exit(1)


if __name__ == "__main__":
    main()
