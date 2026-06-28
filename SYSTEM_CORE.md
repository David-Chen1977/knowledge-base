# ⚠️ 开机必读 · SYSTEM CORE

> 此文件记录所有已经固化的优化和迭代。任何会话开始时**必须先读此文件**。
> 读完去读 `_session_state.md` + `vault/10-知识库/当前关注.md` 获取当前状态。

---

## 一、身份定位（不可更改）

- **你是谁（的用户）**：一级股权投资人（PE/VC），北大光华本硕，师从厉以宁、张维迎
- **赛道**：电力新能源 + AI 基础设施
- **内容管线**：每份深度报告扩展为"三件套"（公众号文章 + 网站文章 + PPT）
- **账号**：公众号「道雷」· AppID: `wx7ae4cfe0d680c0fe`
- **网站**：`https://chendaolei-website.pages.dev` · 源码在 `/Users/Admin/OpencodeWorkspace/personal-website/`

---

## 二、写作风格（已锁定 v3 · 2026-06-14 定型）

### 风格坐标
```
厉以宁（非均衡思维）+ 张维迎（逻辑二分法框架）+ 巴芒段（平实坦诚）
```

### 具体规则
| 维度 | 规则 |
|:-----|:------|
| **标题** | ≤15字。不概括全文、不拼凑两半句、不用夸大副词（疯狂/震惊/史诗）。制造好奇心缺口而非总结。 |
| **开篇** | 从具体观察或反常现象切入。**绝对禁止编造任何"我有一个朋友"类故事**。 |
| **结构** | 先用一个逻辑框架（二分法/三段论）立住，再用数据支撑，不堆数据。 |
| **语气** | 像在跟朋友聊天。有判断但不自大，敢于说"不确定""可能是错的"。 |
| **幽默** | 冷幽默：反常观察、类比反差、自嘲。不用谐音梗。 |
| **黑话禁止** | 赋能、抓手、闭环、颗粒度——出现就删。 |
| **结尾** | 有余味，不求互动。不写"点赞在看转发"。 |

---

## 三、知识架构（v4 · 2026-06-23 重构）

### 总体架构

```
┌─────────────────────────────────────────────────────────┐
│  第二大脑 (Obsidian Vault)                                │
│  ~/OpencodeWorkspace/vault/                              │
│                                                          │
│  全部个人所思所想，默认 private                             │
│  visibility:public 的文件 → 对外发布                       │
│                                                          │
│  10-知识库/   投资研究知识库（原 知识库/ 内容迁移至此）       │
│  00-每日/     Daily notes (新建)                          │
│  01-研究笔记/  研究笔记 (新建)                              │
│  02-投资思考/  投资决策记录 (新建)                          │
│  90-公开/     精选公开内容                                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │  sync-to-website.sh v4
                       │  → 仅同步 visibility:public 的文件
                       ▼
┌─────────────────────────────────────────────────────────┐
│  外部展示渠道（只读，不可反向写入 vault）                   │
│                                                          │
│  1. 知识库网站 (VitePress → Vercel)                       │
│     结构化知识库，源自 vault/ 中 public 文件                │
│                                                          │
│  2. 个人网站 (Astro → Cloudflare Pages)                   │
│     博客文章/个人品牌                                      │
│                                                          │
│  3. 公众号 (WeChat 通过 wenyan-mcp)                        │
│     深度文章推送                                           │
└─────────────────────────────────────────────────────────┘
```

### 私有/公开边界控制

```
每个 .md 文件头部必须包含:
---
visibility: public    # → 可同步到知识库网站
visibility: private   # → 仅在 vault 内，绝不对外
---

sync-to-website.sh v4 不再使用关键词黑名单，
完全基于 frontmatter 的 visibility 字段过滤。
默认缺失 visibility 的文件按 private 处理。
```

### 健康检查
```bash
知识库/.scripts/health-check.sh
# 检查 3 个仓库状态 + 构建状态 + 部署标记 + 日志时效 + 备份状态
```

### 自动运维架构 (v5 — 2026-06-28 重构)

```
统一编排器 (orchestrator.sh) — launchd 9:00 / 21:00
  │
  ├─ Step 1: refresh-kb.mjs v5
  │   ├─ 基线数据（自包含，无外部依赖）
  │   └─ 可选碳市场数据 (--populate-ets)
  │
  ├─ Step 2: sync-to-website.sh v5 (状态门: Step 1 成功才执行)
  │   └─ vault visibility:public → 知识库网站 → Vercel
  │
  └─ Step 3: auto-save.sh (无论前两步结果)
```

**关键变更** (2026-06-28):
- `refresh-kb.mjs` v5: 移除已删除 china-energy-mcp 硬编码 import，改用嵌入式基线数据
- `refresh-all.sh` v5: 添加 macOS Notification Center 失败告警 + 连续失败计数 + 状态门
- `sync-to-website.sh` v5: 启动时自动清理残留失败标记
- 新 `orchestrator.sh`: 统一编排器取代 2 个旧 launchd 任务（refresh + syncwebsite）
- `nmg-ppt` SKILL.md: 模板配置自包含，移除移动硬盘依赖

### 发布管线

#### 内容发布

发布方式：

1. **公众号** → 通过 `wenyan-mcp` 发布到草稿箱（凭据从 macOS Keychain 读取）
2. **网站** → `orchestrator.sh` 自动同步或手动 `deploy.sh`
3. **PPT** → `nmg-ppt` 管线（脚本在 `.opencode/skills/nmg-ppt/scripts/`）

#### 网站部署
```
cd /Users/Admin/OpencodeWorkspace/personal-website/
npm run build
git add . && git commit -m "feat: ..." && git push
```
或通过 deploy.sh 自动部署

---

## 附 A、PPT 模板（已定稿 · 禁止重建）

**汇竑资本/公司模板**：`nmg-ppt` 管线（脚本在 `/Users/Admin/.opencode/skills/nmg-ppt/`）
- 规格文档：`知识库/汇竑资本PPT模板规格.md`
- 质量检查：`知识库/PPT质量检查标准.md`
- 定稿时间：2026-06-14（用户最终确认）
- **禁止从头重建**。如需修改，在定稿脚本上增量编辑，修改后运行质量检查清单。

---

## 四、工具协同（2026-06-25 更新 — WorkBuddy 已退役）

> WorkBuddy 于 2026-06-22 正式退役。所有职责已由 OpenCode subagent 吸收。
> `brain/`、`context/`、`三件套输出/` 相关路径已全部清理。

### OpenCode 工具链
| 环节 | 工具 |
|:-----|:-----|
| 核心内容写作 | OpenCode |
| 数据查证 | OpenCode MCP (secedgar/yfinance/fred/prospector/china-ets/anysearch) |
| 配图 | ChatGPT / 手动上传 |
| 格式精修 | OpenCode subagent (deep/quick) |
| 网站部署 | `deploy.sh` → Cloudflare Pages |
| 公众号推送 | `wenyan-mcp` 发布到草稿箱 |
| PPT生成 | `nmg-ppt` 管线 |
| 归档 | OpenCode (knowledge-reflux) |

### 备份
```
/Volumes/移动硬盘/人机协同系统备份/
├── opencode/          (~/.opencode)      — 技能、规则
├── opencode-config/   (~/.config/opencode) — 配置数据
├── OpencodeWorkspace/ — 工作区源码（不含 node_modules/.git/build）
└── codex-proxy/       — 当前会话环境
上次备份: 2026-06-23
一键恢复: cp -a /Volumes/移动硬盘/人机协同系统备份/opencode/ ~/.opencode/
```

---

## 五、每次开机启动流程

```
第1步（必须）: 读取 SYSTEM_CORE.md                    ← 就是这个文件
第2步（必须）: 读取 _session_state.md                  → 上次会话快照
第3步（必须）: 读取 vault/10-知识库/当前关注.md          → 当前研究重点
第4步（建议）: 读取 内容输出/ 下的最新产出               → 最近做了什么
```

---

## 六、会话结束强制操作

```
□ 更新 _session_state.md（generate-session-snapshot.py）
□ ——以下为"进步循环"三步—— »

□ 第一步：回顾今天学到了什么
   - 打开了什么新认知？
   - 犯了什么错？怎么改的？
   - 什么方法效果好，值得复制？
□ 第二步：固化到系统
   - 新规则 → 在当前关注.md 中追加
   - 新流程 → 对应的工作流文档
□ 第三步：追加进步日志
   - 写入 进步日志（如已配置）
   - 一句话总结：今天比昨天好在哪里？
```

---

## 七、版本日志

| 日期 | 版本 | 变更 |
|:-----|:-----|:-----|
| 2026-06-11 | v1 | 人机协同启动，MCP 工具链搭建 |
| 2026-06-12 | v2 | 知识库建成，MOC交叉图 |
| 2026-06-13 | v2.1 | 三件套管线跑通，5套产出 |
| 2026-06-14 | **v3** | 🔥 写作风格定型（厉以宁+张维迎+巴芒段）|
| 2026-06-14 | v3.1 | 🔥 双工具闭环跑通（workflow-协议.md）|
| 2026-06-14 | v3.2 | 🔥 WeChat图片管线升级（wechat_inline_upload.py）|
| 2026-06-14 | v3.3 | 🔥 SYSTEM_CORE.md 固化系统建立 |
| 2026-06-14 | v3.4 | 🔥 "进步循环"三步机制建立（回顾→固化→日志） |
| 2026-06-14 | v3.5 | 🔥 内容表现跟踪体系（metrics.json + Web Analytics） |
| 2026-06-23 | v3.6 | 🔥 个人网站迁移本地 + 备份到移动硬盘 + .scripts/清理 + health-check 统一健康检查 |
| 2026-06-25 | **v3.7** | 🔥 R0 止损：删除 brain/、三件套输出/、WorkBuddy 虚假路径引用；重写 §四/§五/§六；删除 3 个尸体脚本 |
| 2026-06-28 | **v5** | 🔥 知识库刷新全面修复：refresh-kb.mjs v5 自包含基线数据；refresh-all.sh v5 告警+状态门；sync-to-website.sh v5 清理残留标记；新 orchestrator.sh 统一编排器取代2旧launchd；nmg-ppt SKILL.md 解除移动硬盘依赖；内容日历氢能重排 |

---

*此文件不可删除。每次迭代后更新版本日志。*
