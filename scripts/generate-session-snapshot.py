#!/usr/bin/env python3
"""generate-session-snapshot.py — 从 vault 和 内容输出 自动生成 _session_state.md 快照

   替代旧版：去掉 brain/、context/state.json、三件套输出/ 等所有不存在路径。
   数据源：
     - vault/10-知识库/当前关注.md  → 当前研究重点
     - 内容输出/                    → 最近产出概况
"""
import os
import re
from datetime import datetime
from pathlib import Path

WORKSPACE = Path("/Users/Admin/OpencodeWorkspace")
OUTPUT_FILE = WORKSPACE / "_session_state.md"


def load_current_focus() -> str:
    """读取 当前关注.md 的摘要"""
    path = WORKSPACE / "vault/10-知识库/当前关注.md"
    if not path.exists():
        return "（未设置 — 阅读 vault/10-知识库/ 了解研究重点）"
    content = path.read_text(encoding="utf-8")
    lines = [l.strip() for l in content.split("\n") if l.strip() and not l.startswith("---")]
    summary = "\n".join(lines[:15])  # 取前 15 行
    if len(summary) > 600:
        summary = summary[:600] + "\n..."
    return summary


def scan_recent_outputs() -> list:
    """扫描 内容输出/ 下的最近产出"""
    out_dir = WORKSPACE / "内容输出"
    if not out_dir.exists():
        return []
    entries = []
    for d in sorted(out_dir.iterdir(), reverse=True):
        if d.is_dir():
            md_files = list(d.glob("*.md"))
            pptx_files = list(d.glob("*.pptx"))
            entries.append({
                "name": d.name,
                "md_count": len(md_files),
                "has_pptx": len(pptx_files) > 0,
                "md_titles": [f.stem for f in md_files[:3]],
            })
    return entries


def generate():
    focus = load_current_focus()
    outputs = scan_recent_outputs()

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = []
    lines.append("# 🧠 会话状态快照（自动生成）")
    lines.append("")
    lines.append(f"> 最后更新：{now}")
    lines.append("> 数据源：`vault/10-知识库/当前关注.md` + `内容输出/`")
    lines.append(">")
    lines.append("> 启动流程：1. 读 SYSTEM_CORE.md → 2. 读此文件 → 3. 读 当前关注.md")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 当前关注
    lines.append("## 📌 当前研究重点")
    lines.append("")
    lines.append(focus)
    lines.append("")

    # 最近产出
    lines.append("---")
    lines.append("")
    lines.append("## 📦 最近产出")
    lines.append("")
    if outputs:
        for o in outputs[:5]:  # 最多显示 5 个
            pptx_mark = " 📊" if o["has_pptx"] else ""
            titles = "、".join(o["md_titles"][:3])
            lines.append(f"- **{o['name']}**{pptx_mark} — {titles}")
    else:
        lines.append("（暂无产出记录）")
    lines.append("")

    # 关键文件索引
    lines.append("---")
    lines.append("")
    lines.append("## 🔑 关键文件索引")
    lines.append("")
    lines.append("| 文件 | 用途 |")
    lines.append("|------|------|")
    lines.append("| `SYSTEM_CORE.md` | 系统核心文档（开机必读） |")
    lines.append("| `vault/10-知识库/当前关注.md` | 当前研究重点 |")
    lines.append("| `内容输出/` | 三件套最终产出 |")
    lines.append("| `deploy.sh` | 一键部署网站到 Cloudflare |")
    lines.append("")

    lines.append("---")
    lines.append("")
    lines.append(f"*自动生成于 {now} — 请勿手动编辑*")
    lines.append("")

    OUTPUT_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"✅ 快照已生成: {OUTPUT_FILE}")


if __name__ == "__main__":
    generate()
