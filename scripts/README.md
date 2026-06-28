# scripts/ 目录说明

## 核心管线（日常工作流）

| 脚本 | 功能 | 使用频率 | 状态 |
|------|------|---------|------|
| `content-pipe.mjs` | **统一内容管线 CLI** — 从选题到发布的完整流程入口 | 每篇 | ✅ 核心 |
| `generate-platform-content.mjs` | 从 research bundle 生成各平台文章 | 每篇 | ✅ |
| `wechat_publisher.py` | 公众号草稿推送（wenyan-mcp） | 每篇 | ✅ |
| `native_pptx.py` | PPT生成（nmg-ppt管线） | 需要时 | ✅ |
| `qc-gate.mjs` | 质量门禁 — 自动检测产出类型并检查 | 每篇 | ✅ |
| `knowledge-index.mjs` | 内容发布后索引到知识库 | 每篇 | ✅ |

## 内容生产辅助

| 脚本 | 功能 | 状态 |
|------|------|------|
| `research-to-bundle.mjs` | 研究结果 → 标准化 Content Bundle JSON | ✅ |
| `web-research.mjs` | 研究数据引擎（MCP websearch） | ✅ |
| `ingest-research.mjs` | 研报/PDF/DOCX 自动消化 | ✅ |
| `generate_cover.py` | 公众号封面图自动生成 | ✅ |
| `topic-pool.mjs` | 选题池管理（持久化+优先级） | ✅ |
| `topic-sense.mjs` | 选题感知与自动化提醒 | ✅ |

## 网站&知识库

| 脚本 | 功能 | 状态 |
|------|------|------|
| `md-to-astro.mjs` | Bundle JSON → 个人网站 .astro 页面 | ✅ |
| `content-to-deck.mjs` | Bundle → deck.json → native_pptx.py 桥接 | ✅ |
| `wiki-update.mjs` | Karpathy LLM Wiki 集成管线 | ✅ |
| `generate-session-snapshot.py` | 会话快照 → `_session_state.md` | ✅ |
| `refresh-china-energy.sh` | 一键刷新中国能源数据 | ✅ |

## 辅助工具

| 脚本 | 功能 | 状态 |
|------|------|------|
| `weekly-report.mjs` | 超充周报自动化更新 | ✅ |

## 归档（不再使用）

见 `archive/README.md`

## 自动化发布脚本（人工发布，不维护浏览器自动化）

| 平台 | 方式 | 文件规范 |
|------|------|---------|
| 公众号 | wenyan-mcp 推送 | `公众号版.md` |
| 知乎 | 手动粘贴 | `*知乎版.md` |
| 头条 | 手动粘贴 | `*头条版.md` / `*头条版_可粘贴.md` |
| 网站 | md-to-astro.mjs | `网站深度版.md` |
| 短视频 | iPhone剪映 | 暂无文件规范 |
