# 管线脚本 · 使用说明

内容生产管线，来自外置硬盘（已 symlink），直接调用。

---

## 一键生产

```bash
node scripts/content-pipe.mjs --topic "主题" [选项]
```

**选项：**
- `--types ppt,article,video,website` — 产出类型
- `--publish` — 发布到公众号
- `--preview` — 预览模式
- `--deploy-website` — 部署到个人网站

**示例：**
```bash
node scripts/content-pipe.mjs --topic "算电协同2026" --types article,website --preview
```

---

## 其他工具

| 脚本 | 用途 |
|------|------|
| `ingest-research.mjs` | 研报/文档消化（PDF→Markdown） |
| `knowledge-index.mjs` | 产出后自动索引到知识库 |
| `wiki-update.mjs` | Wiki 概念页编译 |
| `topic-sense.mjs` | 选题感知与覆盖缺口分析 |
| `topic-pool.mjs` | 选题池管理（排期/优先级） |
| `md-to-astro.mjs` | Markdown→网站 .astro 页面 |
| `web-research.mjs` | 自动化网络研究 |
| `research-to-bundle.mjs` | 研究→结构化内容包 |
| `qc-gate.mjs` | 质量门禁检查 |
| `weekly-report.mjs` | 周报生成 |
| `wechat_publisher.py` | 公众号文章发布 |

---

**注意：** 这些脚本依赖外置硬盘上的 `node_modules/` 和 Python 环境。硬盘需挂载在 `/Volumes/移动硬盘/`。
