#!/usr/bin/env python3
"""
多平台一键发布工具

用法：
    # 发布到所有平台
    python publish.py article.md --all --cover cover.png --body-images img1.png img2.png

    # 发布到指定平台
    python publish.py article.md --zhihu --toutiao

    # 登录某个平台（首次需要手动扫码）
    python publish.py --zhihu --login

    # 查看帮助
    python publish.py --help
"""

import os
import sys
import re
import argparse
from pathlib import Path
from typing import Optional

# 确保能找到 publishers 包
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from publishers.base import PublishResult
from publishers.zhihu import ZhihuPublisher
from publishers.toutiao import ToutiaoPublisher
from publishers.baijiahao import BaijiahaoPublisher
from publishers.wechat import WeChatPublisher


# 所有已注册的发布器
PUBLISHERS: dict[str, type] = {
    "zhihu": ZhihuPublisher,
    "toutiao": ToutiaoPublisher,
    "baijiahao": BaijiahaoPublisher,
    "wechat": WeChatPublisher,
}


def load_footer() -> str:
    """加载标准化结尾模板"""
    footer_path = os.path.join(script_dir, "wechat_footer.template.md")
    if os.path.exists(footer_path):
        with open(footer_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    return ""


def ensure_footer(md_content: str) -> str:
    """如果文章中还没有标准化结尾，自动追加"""
    footer = load_footer()
    if footer and footer not in md_content:
        md_content = md_content.rstrip() + "\n\n" + footer
        print("📝 已追加标准化结尾模板")
    return md_content


def process_body_images(md_content: str, image_paths: list[str]) -> str:
    """替换 BODY_IMG_N 占位符为占位文本，各平台 adapter 自行处理上传"""
    for i, img_path in enumerate(image_paths, start=1):
        placeholder = f"BODY_IMG_{i}"
        if os.path.exists(img_path):
            # 保留占位路径，adapter 在 publish() 中自行上传并替换
            md_content = md_content.replace(placeholder, img_path)
        else:
            print(f"  ⚠️ 图片不存在，跳过: {img_path}")
    return md_content


def interactive_login(platform_name: str):
    """交互式登录指定平台"""
    publisher_class = PUBLISHERS.get(platform_name)
    if not publisher_class:
        print(f"❌ 未知平台: {platform_name}")
        sys.exit(1)

    publisher = publisher_class()
    if platform_name == "wechat":
        print(f"⚠️ 微信使用 API 通道，不需要浏览器登录")
        print(f"   请确保 scripts/.env 中的 WECHAT_APP_ID 和 WECHAT_APP_SECRET 正确")
        return

    publisher.login(headless=False)


def main():
    parser = argparse.ArgumentParser(
        description="多平台一键发布工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python publish.py article.md --all --cover cover.png --body-images img1.png img2.png
  python publish.py article.md --zhihu --toutiao
  python publish.py --zhihu --login
        """,
    )
    parser.add_argument("file", nargs="?", help="Markdown 文章文件路径")
    parser.add_argument("--cover", help="封面图片路径")
    parser.add_argument("--body-images", nargs="*", default=[], help="正文图片路径列表")

    # 平台选择
    parser.add_argument("--all", action="store_true", help="发布到所有已配置平台")
    parser.add_argument("--zhihu", action="store_true", help="发布到知乎")
    parser.add_argument("--toutiao", action="store_true", help="发布到头条号")
    parser.add_argument("--baijiahao", action="store_true", help="发布到百家号")
    parser.add_argument("--wechat", action="store_true", help="发布到微信公众号")

    # 登录
    parser.add_argument("--login", choices=list(PUBLISHERS.keys()), help="交互式登录指定平台")

    # 其他选项
    parser.add_argument("--source-url", default="https://chendaolei.pages.dev/blog", help="原文链接")

    args = parser.parse_args()

    # 登录模式
    if args.login:
        interactive_login(args.login)
        return

    # 发布模式：必须提供文件
    if not args.file:
        parser.print_help()
        print("\n❌ 请指定 Markdown 文章文件路径")
        sys.exit(1)

    if not os.path.exists(args.file):
        print(f"❌ 文件不存在: {args.file}")
        sys.exit(1)

    # 确定要发布的平台
    platforms_to_publish = []
    if args.all:
        platforms_to_publish = list(PUBLISHERS.keys())
    else:
        for name in PUBLISHERS:
            if getattr(args, name.replace("-", "_")):
                platforms_to_publish.append(name)

    if not platforms_to_publish:
        print("❌ 未指定发布平台（使用 --all 或 --zhihu/--toutiao/--baijiahao/--wechat）")
        sys.exit(1)

    # 读取文章
    with open(args.file, "r", encoding="utf-8") as f:
        md_content = f.read()

    # 标准化结尾
    md_content = ensure_footer(md_content)

    # 处理正文图片（替换 BODY_IMG_N 占位符为本地路径）
    if args.body_images:
        md_content = process_body_images(md_content, args.body_images)

    # 提取标题
    title = extract_title(md_content, args.file)
    print(f"\n📄 文章: {title}")
    print(f"🎯 发布目标: {', '.join(platforms_to_publish)}")
    print(f"📏 正文长度: {len(md_content)} 字符")
    print()

    # 逐平台发布
    results: list[PublishResult] = []
    for platform_name in platforms_to_publish:
        print(f"━━━ {platform_name} ━━━")
        publisher_class = PUBLISHERS[platform_name]
        publisher = publisher_class()

        result = publisher.publish(
            title=title,
            html_body=md_content,
            cover_path=args.cover or "",
            body_images=args.body_images or [],
        )
        results.append(result)
        print()

    # 汇总
    success_count = sum(1 for r in results if r.success)
    print(f"{'='*40}")
    print(f"📊 发布汇总: {success_count}/{len(results)} 成功")
    for r in results:
        status = "✅" if r.success else "❌"
        detail = r.url if r.success else r.error
        print(f"  {status} {r.platform}: {detail}")


def extract_title(md_content: str, filename: str = "") -> str:
    match = re.search(r"^#\s+(.+)$", md_content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    if filename:
        return os.path.splitext(os.path.basename(filename))[0]
    return "未命名文章"


if __name__ == "__main__":
    main()
