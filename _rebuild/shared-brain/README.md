# 🤖 AI 双工具协同系统 v2

> WorkBuddy × OpenCode 互联互通 · 废弃 Hermes（网络限制）

---

## 🎯 架构

```
WorkBuddy (大脑)          OpenCode (双手)
    │                          │
    │   state.json (状态总线)   │
    └──────────┬───────────────┘
               │
      shared-workspace/
      ├── context/state.json    ← 唯一状态文件（替代旧3个MD）
      ├── context/*.md          ← 研究产出
      ├── scripts/sync-state.mjs ← 状态同步脚本
      ├── scripts/verify-setup.sh ← 验证脚本
      └── bridge/mcp-bridge-config.json
```

## state.json 状态机

```
opencode.status:  idle → working → idle
                                  → blocked (需人工介入)
workbuddy.status: idle → working → idle

pipeline.phase:   idle → research → writing → review → publish → idle
                                           → blocked (依赖sync-state.mjs)
```

## 使用方式

### OpenCode 完成任务后：
```bash
node /Users/Admin/.workbuddy/shared-workspace/scripts/sync-state.mjs opencode idle "三件套04完成" "公众号+网站+PPT"
```

### WorkBuddy 定时轮询：
配置 WorkBuddy Automation，每 5 分钟读取 `state.json`。
当 `openCode.status === "idle" && pipeline.phase === "publish"` 时：
1. 读取产出 → 生成可视化图表
2. 同步腾讯文档归档
3. 企微通知

---

*Hermes 因网络限制 + qwen2.5:7b 32K 上下文不足，已于 2026-06-14 废弃*
