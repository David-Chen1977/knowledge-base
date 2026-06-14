#!/usr/bin/env python3
"""
clip-import.py — 剪辑板代理桥
将当前剪贴板内容导入元宝桥接目录

用途：腾讯元宝 → 文件 → OpenCode
用法：python3 clip-import.py [--title "自定义标题"]
"""

import subprocess
import sys
import os
from datetime import datetime

BRIDGE_DIR = os.path.expanduser("~/OpencodeWorkspace/知识库/元宝桥接")

def get_clipboard():
    """macOS: 用 pbpaste 获取剪贴板"""
    try:
        result = subprocess.run(["pbpaste"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception as e:
        print(f"❌ pbpaste 失败: {e}")
    return None

def save_content(content, title=None):
    os.makedirs(BRIDGE_DIR, exist_ok=True)

    now = datetime.now()
    ts = now.strftime("%Y%m%d-%H%M%S")
    date_prefix = now.strftime("%Y-%m-%d")

    if title:
        filename = f"{date_prefix}-{title}.md"
    else:
        # 从内容中取前20字作为标题
        first_line = content.strip().split("\n")[0][:20]
        safe_title = "".join(c if c.isalnum() or c in " _-" else "_" for c in first_line).strip() or "元宝导入"
        filename = f"{date_prefix}-{safe_title}.md"

    filepath = os.path.join(BRIDGE_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"# {title or safe_title}\n\n")
        f.write(f"导入时间: {now.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"来源: 腾讯元宝\n\n")
        f.write("---\n\n")
        f.write(content)

    print(f"✅ 已导入: {filepath}")
    print(f"   长度: {len(content)} 字符")
    return filepath

def main():
    title = None
    if len(sys.argv) > 2 and sys.argv[1] == "--title":
        title = sys.argv[2]

    content = get_clipboard()
    if not content:
        print("❌ 剪贴板为空或无法读取")
        print("   先在元宝里复制内容，再运行此脚本")
        sys.exit(1)

    save_content(content, title)

if __name__ == "__main__":
    main()
