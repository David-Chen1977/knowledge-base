# Hermes Agent 集成配置指南

## 目标
让 Hermes Agent 能够读写 AI 三工具共享工作区，实现与 WorkBuddy 和 OpenCode 的信息互通。

---

## 步骤一：添加共享工作区 MCP 服务器

在终端运行：
```bash
hermes mcp add shared-workspace \
  --command npx \
  --args "-y,@modelcontextprotocol/server-filesystem,/Users/Admin/.workbuddy/shared-workspace"
```

验证配置：
```bash
hermes mcp list
```

应该看到：
```
shared-workspace   command: npx -y @modelcontextprotocol/server-filesystem /Users/Admin/.workbuddy/shared-workspace
```

---

## 步骤二：配置 Hermes 自动同步状态

编辑 `~/.hermes/config.yaml`，添加 `system_prompt` 或 `custom_prompt`：

```yaml
# 在 existing config 中添加：
custom_prompt: |
  你是 Hermes Agent，一个长期运行的 AI 智能体。
  
  重要：你参与一个"AI三工具协同系统"，需要与其他两个工具共享信息：
  - WorkBuddy（桌面 AI 助手）
  - OpenCode（终端编程助手）
  
  每次完成重要操作后，请：
  1. 读取 /Users/Admin/.workbuddy/shared-workspace/context/TOOL_STATUS.md
  2. 更新 "Hermes Agent 状态" 区块
  3. 读取 /Users/Admin/.workbuddy/shared-workspace/context/SHARED_CONTEXT.md
  4. 将你的工作结果写入 "Hermes → WorkBuddy" 或 "Hermes → OpenCode" 区块
```

---

## 步骤三：验证配置

启动 Hermes：
```bash
hermes chat
```

在对话中输入：
```
请列出共享工作区的上下文文件，并读取 PROJECT_STATE.md
```

如果 Hermes 能读取到文件内容，说明配置成功！

---

## 使用技巧

### 让 Hermes 长期运行并定期同步
```bash
# 在 VPS 或后台运行 Hermes
hermes chat --continue &

# 配置 cron 任务自动同步状态
hermes cron add "0 * * * *" "读取共享工作区状态，更新我的状态区块"
```

### 从 Hermes 触发 WorkBuddy 处理
在 Hermes 对话中：
```
请将以下监控结果写入共享上下文，让 WorkBuddy 处理：
[监控结果]
```

### 让 Hermes 读取 OpenCode 的代码输出
```
请读取 /Users/Admin/.workbuddy/shared-workspace/context/SHARED_CONTEXT.md
查看 OpenCode 的最新代码变更
```

---

## 高级配置：让 Hermes 通过 WhatsApp/Telegram 同步

如果配置了消息平台集成，可以让 Hermes 通过消息平台通知你共享工作区的状态变化：

```bash
# 配置 WhatsApp 集成
hermes whatsapp setup

# 在 cron 任务中添加通知
hermes cron add "0 9 * * *" "检查共享工作区，如果有待处理任务，通过 WhatsApp 通知我"
```

---

## 常见问题

**Q：Hermes 报错"MCP server shared-workspace not found"？**
A：确保 `npx` 能访问 `@modelcontextprotocol/server-filesystem`：
```bash
npx -y @modelcontextprotocol/server-filesystem --help
```

**Q：如何让 Hermes 在后台长期运行？**
A：使用 `tmux` 或 `screen`：
```bash
tmux new -s hermes
hermes chat --continue
# 按 Ctrl+B 然后按 D 离开 tmux 会话
```

**Q：Hermes 的状态文件在哪里？**
A：会话记录在 `~/.hermes/sessions/`，可通过文件系统桥接让其他工具读取。
