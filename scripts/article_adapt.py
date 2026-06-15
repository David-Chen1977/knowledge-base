#!/usr/bin/env python3
"""
文章格式适配器 — 一键输出 知乎/头条/百家号 ready 内容

用法:
    python3 article_adapt.py <文章.md> [--platform zhihu|toutiao|baijiahao|all]
    python3 article_adapt.py <文章.md> --clipboard  直接复制到剪贴板

输出: 三件套输出/<文章名>_知乎.txt / _头条.txt / _百家号.txt
"""

import re, sys, os, argparse
from pathlib import Path

OUTPUT_DIR = "/Users/Admin/三件套输出"

# ── 平台规则 ──
PLATFORMS = {
    "zhihu": {
        "name": "知乎",
        "keep_images": True,       # 知乎支持图片
        "keep_bold": True,
        "keep_links": True,
        "max_headings": 3,
        "paragraph_break": "\n\n",
        "add_source": True,
        "intro_template": "",
    },
    "toutiao": {
        "name": "头条号",
        "keep_images": False,       # 头条图片需单独上传
        "keep_bold": True,
        "keep_links": False,        # 头条对外链限制严格
        "max_headings": 2,
        "paragraph_break": "\n\n",
        "add_source": True,
        "intro_template": "",
    },
    "baijiahao": {
        "name": "百家号",
        "keep_images": False,
        "keep_bold": True,
        "keep_links": False,
        "max_headings": 2,
        "paragraph_break": "\n\n",
        "add_source": True,
        "intro_template": "",
    },
}

# ── 核心转换 ──

def extract_title(md_text: str) -> str:
    m = re.search(r'^#\s+(.+)$', md_text, re.MULTILINE)
    return m.group(1).strip() if m else ""


def clean_markdown(md_text: str, platform: str) -> str:
    cfg = PLATFORMS[platform]
    text = md_text

    # 1. 去掉 YAML frontmatter
    text = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.DOTALL)

    # 2. 去掉 HTML 注释
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)

    # 3. 处理标题层级
    lines = []
    h_count = 0
    for line in text.split('\n'):
        m = re.match(r'^(#{1,6})\s+(.+)$', line)
        if m:
            level = len(m.group(1))
            if level == 1:
                continue  # 去掉 H1（已作标题）
            if h_count < cfg['max_headings'] or level > 2:
                pass
            # 在知乎/头条中，用 **粗体** 代替子标题效果更好
            line = f"\n**{m.group(2)}**\n"
            h_count += 1
        lines.append(line)
    text = '\n'.join(lines)

    # 4. 处理图片
    if cfg['keep_images']:
        # 保留图片链接但转成知乎格式
        text = re.sub(r'!\[(.*?)\]\((.*?)\)', r'[\1](\2)', text)
    else:
        # 去掉图片，保留 alt text 或替换为提示
        text = re.sub(r'!\[(.*?)\]\(.*?\)', r'[\1: 图片请手动上传]', text)

    # 5. 处理链接（头条/百家号去掉）
    if not cfg['keep_links']:
        text = re.sub(r'\[(.+?)\]\(.*?\)', r'\1', text)

    # 6. 处理粗体 — 保持 **text** 格式
    # 7. 引用块 → 普通段落
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)

    # 8. 去掉多余空行
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 9. 分割过长的段落（>500字一行拆开）
    result = []
    for para in text.split('\n\n'):
        para = para.strip()
        if not para:
            continue
        if len(para) > 500 and not para.startswith('**'):
            # 按句号拆分
            parts = re.split(r'(?<=。)(?=[^\s])', para)
            result.extend(p.strip() for p in parts if p.strip())
        else:
            result.append(para)
    text = cfg['paragraph_break'].join(result)

    # 10. 添加来源声明
    if cfg['add_source']:
        text += f"\n\n---\n*原文首发于公众号「道雷说道」，关注获取更多 PE/VC 投资研究。*"

    return text.strip()


def adapt(md_path: str, platform: str):
    cfg = PLATFORMS[platform]
    md = Path(md_path).read_text()
    title = extract_title(md)
    content = clean_markdown(md, platform)

    base = Path(md_path).stem
    out_path = os.path.join(OUTPUT_DIR, f"{base}_{cfg['name']}.txt")
    Path(out_path).write_text(f"{title}\n\n{content}")
    print(f"  ✅ {cfg['name']}: {out_path} ({len(content)}字)")
    return out_path


# ── CLI ──

def main():
    p = argparse.ArgumentParser(description="文章多平台格式适配器")
    p.add_argument("article", help="Markdown 文章路径")
    p.add_argument("--platform", default="all",
                   choices=["zhihu", "toutiao", "baijiahao", "all"])
    p.add_argument("--clipboard", action="store_true", help="复制到剪贴板")
    args = p.parse_args()

    md_path = args.article
    if not os.path.exists(md_path):
        print(f"❌ 文件不存在: {md_path}")
        sys.exit(1)

    platforms = list(PLATFORMS.keys()) if args.platform == "all" else [args.platform]

    print(f"\n📄 {Path(md_path).name}")
    for p in platforms:
        out = adapt(md_path, p)

    if args.clipboard:
        try:
            import subprocess
            with open(out) as f:
                subprocess.run("pbcopy", input=f.read().encode('utf-8'))
            print("  📋 已复制到剪贴板")
        except:
            print("  ⚠️ 剪贴板复制失败")

    print(f"\n🎉 完成 — 粘贴到对应平台发布\n")


if __name__ == "__main__":
    main()
