# 知识库运维脚本 · 架构总览 (2026-06-28)

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│               统一编排器 (orchestrator.sh)            │
│                                                      │
│  每天 9:00 / 21:00 (launchd 定时触发)                 │
│                                                      │
│  Step 1: 知识库数据刷新 (refresh-kb.mjs)               │
│    ├─ ✅ → Step 2                                     │
│    └─ ❌ → 通知 + 跳过 Step 2                          │
│                                                      │
│  Step 2: 网站同步 (sync-to-website.sh)                │
│    └─ 状态门：仅当 Step 1 成功                         │
│                                                      │
│  Step 3: 自动保存 (auto-save.sh)                      │
│    └─ 无论前两步结果, 都执行                           │
└─────────────────────────────────────────────────────┘
```

## 脚本索引

| 脚本 | 用途 | 触发方式 |
|------|------|---------|
| `orchestrator.sh` | 统一编排器：Step 1→2→3 状态门链 | launchd 9:00/21:00 |
| `refresh-kb.mjs` | 数据刷新引擎 v5（基线数据 + 可选碳市场） | 由 orchestrator 调用 |
| `sync-to-website.sh` | vault→网站同步 v5 | 由 orchestrator 调用 |
| `auto-save.sh` | git 自动保存 | launchd 每小时 |
| `health-check.sh` | 一键健康检查 | 手动 / 可配 launchd |

## 定时任务

### 当前运行的 launchd 任务

```bash
launchctl list | grep -E "sisyphus|knowledgebase"
```

| 任务 | 频率 | 说明 |
|------|------|------|
| `com.sisyphus.orchestrator` | 每天 9:00, 21:00 | 统一编排器（取代旧 refresh + sync） |
| `com.knowledgebase.autosave` | 每小时 | git 自动保存（独立运行） |
| `com.knowledgebase.inboxwatcher` | 持续 | 收件箱监听 |

### 已退役的任务

以下任务已被 `com.sisyphus.orchestrator` 取代：
- ~~`com.knowledgebase.refresh`~~ → 合并入 orchestrator Step 1
- ~~`com.knowledgebase.syncwebsite`~~ → 合并入 orchestrator Step 2

## 手动操作

### 运行完整编排

```bash
bash .scripts/orchestrator.sh full
```

### 仅刷新数据（不触发同步）

```bash
bash .scripts/orchestrator.sh refresh-only
```

### 仅同步网站（不刷新数据）

```bash
bash .scripts/orchestrator.sh sync-only
```

### 健康检查

```bash
bash .scripts/health-check.sh
```

### 在 OpenCode 对话中

- `刷新全部` — 通过 MCP 数据源全量刷新
- `刷新 [赛道名]` — 增量刷新单个赛道

## 日志文件

| 文件 | 内容 |
|------|------|
| `.orchestrator_log.txt` | 编排器运行日志（主日志） |
| `.refresh_log.txt` | 数据刷新引擎日志 |
| `.sync_log.txt` | 网站同步日志 |
| `.autosave_log.txt` | 自动保存日志 |

## 故障响应

编排器在以下情况会自动发送 macOS 通知：
- 数据刷新连续失败 3 次
- 编排器 Step 1 失败导致后续步骤跳过

手动排查：
```bash
tail -50 /Users/Admin/OpencodeWorkspace/知识库/.orchestrator_log.txt
bash .scripts/health-check.sh
```
