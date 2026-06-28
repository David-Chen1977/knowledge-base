#!/usr/bin/env python3
"""
article_adapt.py — 多平台格式校验 & 草稿状态管理

从 bundle 生成平台专属文章的工作已交给 generate-platform-content.mjs。
本脚本仅负责：
  1. 格式校验（标题长度、字数、图片引用完整性）
  2. 生成统一预览 HTML
  3. 初始化/更新 .draft-state.json

用法:
    python article_adapt.py <article.md> [选项]

选项:
    --platform <p>   校验范围: zhihu, toutiao, all（默认 all）
    --preview        仅生成预览 HTML
    --draft-state    仅输出当前草稿状态 JSON
    -h, --help       显示帮助
"""

import os
import sys
import json
import re
import argparse
from datetime import datetime


# ── Frontmatter 解析（复用） ──

def parse_frontmatter(md_content: str) -> tuple:
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
    if "tags" in fm:
        try:
            tags_str = fm["tags"]
            if tags_str.startswith("["):
                fm["tags"] = json.loads(tags_str)
            else:
                fm["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
        except Exception:
            fm["tags"] = []
    return fm, body


def extract_title(fm: dict, body: str) -> str:
    if "title" in fm:
        return fm["title"]
    match = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
    return match.group(1).strip() if match else "未命名文章"


# ── 格式校验 ──

PLATFORM_LIMITS = {
    "zhihu": {
        "max_title_chars": 64,
        "max_body_chars": 50000,
        "min_body_chars": 300,
        "max_tags": 5,
        "checks": [
            ("标题不超过64字", lambda t, b, f: len(t) <= 64),
            ("正文不少于300字", lambda t, b, f: len(b) >= 300),
            ("正文不超过50000字", lambda t, b, f: len(b) <= 50000),
            ("标签不超过5个", lambda t, b, f: len(f.get("tags", [])) <= 5),
            ("无未解析的图片占位符", lambda t, b, f: "BODY_IMG_" not in b),
        ],
    },
    "toutiao": {
        "max_title_chars": 50,
        "max_body_chars": 10000,
        "min_body_chars": 200,
        "max_tags": 5,
        "checks": [
            ("标题不超过50字", lambda t, b, f: len(t) <= 50),
            ("正文不少于200字", lambda t, b, f: len(b) >= 200),
            ("正文不超过10000字", lambda t, b, f: len(b) <= 10000),
            ("标签不超过5个", lambda t, b, f: len(f.get("tags", [])) <= 5),
            ("无未解析的图片占位符", lambda t, b, f: "BODY_IMG_" not in b),
        ],
    },
}


def validate_article(title: str, body: str, fm: dict, platform: str) -> dict:
    """对单篇文章执行平台格式校验"""
    limits = PLATFORM_LIMITS.get(platform, PLATFORM_LIMITS["zhihu"])
    all_checks = []
    passed = 0
    failed = 0

    for check_name, check_fn in limits["checks"]:
        ok = check_fn(title, body, fm)
        all_checks.append({"check": check_name, "status": "✅" if ok else "❌"})
        if ok:
            passed += 1
        else:
            failed += 1

    return {
        "platform": platform,
        "title": title,
        "body_chars": len(body),
        "tags": len(fm.get("tags", [])),
        "checks": all_checks,
        "passed": passed,
        "failed": failed,
        "valid": failed == 0,
    }


# ── 预览 HTML ──

def generate_preview_html(title: str, body: str, fm: dict, validations: list = None) -> str:
    """生成统一预览 HTML"""
    tags = fm.get("tags", [])
    author = fm.get("author", "")

    html_body = body
    html_body = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html_body, flags=re.MULTILINE)
    html_body = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html_body, flags=re.MULTILINE)
    html_body = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html_body, flags=re.MULTILINE)
    html_body = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html_body)
    html_body = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html_body)
    html_body = re.sub(r"!\[(.*?)\]\((.*?)\)", r'<img src="\2" alt="\1" style="max-width:100%;border-radius:6px;margin:10px 0;">', html_body)
    html_body = re.sub(r"\[(.+?)\]\((.*?)\)", r'<a href="\2">\1</a>', html_body)
    lines = html_body.split("\n")
    html_lines = []
    in_code = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            html_lines.append("</code></pre>" if in_code else "<pre><code>")
            in_code = not in_code
            continue
        if in_code:
            html_lines.append(stripped)
            continue
        if stripped.startswith("<h") or stripped.startswith("<img") or stripped.startswith("<pre"):
            html_lines.append(stripped)
        elif stripped == "":
            html_lines.append("")
        else:
            html_lines.append(f"<p>{stripped}</p>")
    html_body = "\n".join(html_lines)

    tags_html = " ".join([f'<span class="tag">{t}</span>' for t in tags]) if tags else ""

    # Build validation status bar
    val_html = ""
    if validations:
        for v in validations:
            icon = "✅" if v["valid"] else "⚠️"
            val_html += f'<div class="platform-status {"" if v["valid"] else "warn"}">'
            val_html += f'  {icon} <strong>{v["platform"]}</strong> — {v["passed"]}/{len(v["checks"])} 检查通过'
            for c in v["checks"]:
                if c["status"] == "❌":
                    val_html += f'<br><span class="fail">  ❌ {c["check"]}</span>'
            val_html += "</div>"

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — 内容预览</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #333; line-height: 1.8; font-size: 16px; }}
  h1 {{ font-size: 26px; border-bottom: 2px solid #c0392b; padding-bottom: 12px; margin-bottom: 24px; }}
  h2 {{ font-size: 20px; margin-top: 32px; color: #222; }}
  h3 {{ font-size: 17px; margin-top: 24px; color: #444; }}
  p {{ margin: 12px 0; }}
  img {{ max-width: 100%; border-radius: 6px; margin: 10px 0; }}
  pre {{ background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 14px; }}
  code {{ background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }}
  blockquote {{ border-left: 4px solid #c0392b; padding: 8px 16px; margin: 16px 0; background: #fafafa; color: #666; }}
  .meta {{ color: #999; font-size: 14px; margin-bottom: 24px; }}
  .tag {{ display: inline-block; background: #f0f0f0; padding: 2px 10px; border-radius: 12px; font-size: 12px; margin: 2px 4px; color: #666; }}
  .status-bar {{ background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; }}
  .platform-status {{ margin: 6px 0; padding: 8px 12px; border-radius: 6px; background: #f0faf0; }}
  .platform-status.warn {{ background: #fff8f0; }}
  .fail {{ color: #e74c3c; font-size: 13px; margin-left: 16px; }}
</style>
</head>
<body>
<div class="status-bar">
  <strong>📋 审阅预览</strong><br>
  {f"作者: {author}" if author else ""}
  {" · Tags: " + tags_html if tags_html else ""}
  {val_html}
</div>
{html_body}
</body>
</html>"""


# ── 草稿状态管理 ──

def load_draft_state(article_dir: str) -> dict:
    state_path = os.path.join(article_dir, ".draft-state.json")
    if os.path.exists(state_path):
        with open(state_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "article": "",
        "topic": "",
        "generated_at": datetime.now().isoformat(),
        "drafts": {},
        "human_reviewed": False,
        "human_reviewed_at": None,
    }


def save_draft_state(article_dir: str, state: dict):
    state_path = os.path.join(article_dir, ".draft-state.json")
    with open(state_path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    print(f"📋 草稿状态已保存: {state_path}")


# ── 主流程 ──

def main():
    parser = argparse.ArgumentParser(description="多平台格式校验 & 草稿状态管理")
    parser.add_argument("file", nargs="?", help="article.md 路径")
    parser.add_argument("--platform", default="all", choices=["zhihu", "toutiao", "all"], help="校验范围")
    parser.add_argument("--preview", action="store_true", help="仅生成预览 HTML")
    parser.add_argument("--draft-state", action="store_true", help="仅输出当前草稿状态 JSON")
    args = parser.parse_args()

    file_path = args.file
    if not file_path:
        print("❌ 请指定 article.md 路径")
        sys.exit(1)
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    fm, body = parse_frontmatter(md_content)
    title = extract_title(fm, body)
    article_dir = os.path.dirname(os.path.abspath(file_path)) or "."

    platforms = ["zhihu", "toutiao"] if args.platform == "all" else [args.platform]

    # ── 格式校验 ──
    validations = []
    for platform in platforms:
        val = validate_article(title, body, fm, platform)
        validations.append(val)
        status = "✅" if val["valid"] else "❌"
        print(f"{status} {platform}: {val['passed']}/{len(val['checks'])} 检查通过")
        for c in val["checks"]:
            if c["status"] == "❌":
                print(f"     ❌ {c['check']}")
        print(f"   正文长度: {val['body_chars']} 字符 | 标签: {val['tags']}")

    # ── 草稿状态 ──
    state = load_draft_state(article_dir)
    state["article"] = os.path.abspath(file_path)
    state["topic"] = title
    state["generated_at"] = datetime.now().isoformat()
    for platform in platforms:
        if platform not in state["drafts"]:
            state["drafts"][platform] = {
                "status": "pending",
                "draft_id": None,
                "url": None,
                "updated_at": None,
                "error": None,
            }
    if not args.preview:
        save_draft_state(article_dir, state)

    # ── 预览 HTML ──
    preview_html = generate_preview_html(title, body, fm, validations)
    preview_path = os.path.join(article_dir, "article.preview.html")
    with open(preview_path, "w", encoding="utf-8") as f:
        f.write(preview_html)
    print(f"✅ 预览 HTML: {preview_path}")

    if args.preview:
        print("\n" + preview_html)

    # ── Draft state only ──
    if args.draft_state:
        print(json.dumps(state, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
