# OpenCode 集成配置指南

## 目标
让 OpenCode 能够读写 AI 三工具共享工作区，实现与 WorkBuddy 和 Hermes Agent 的信息互通。

---

## 步骤一：添加共享工作区 MCP 服务器

编辑 `~/.config/opencode/opencode.jsonc`，在 `mcp` 字段中添加：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/deepseek-v4-flash-free",
  "plugin": ["oh-my-openagent"],
  "mcp": {
    // ... 你已有的 MCP 服务器 ...
    "secedgar": { ... },
    "yfinance": { ... },
    "fred-mcp": { ... },
    "ppt-mcp": { ... },
    
    // ✅ 新增：共享工作区文件系统访问
    "shared-workspace": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/Users/Admin/.workbuddy/shared-workspace"],
      "enabled": true,
      "description": "AI三工具共享工作区"
    }
  }
}
```

---

## 步骤二：验证配置

重启 OpenCode，运行：
```bash
opencode chat
```

在对话中输入：
```
请列出 /Users/Admin/.workbuddy/shared-workspace/context/ 下的文件
```

如果 OpenCode 能列出 `PROJECT_STATE.md`、`TOOL_STATUS.md`、`SHARED_CONTEXT.md`，说明配置成功！

---

## 步骤三：设置上下文自动同步（可选）

在 OpenCode 的对话中使用以下系统提示词（或配置到 `oh-my-openagent.jsonc`）：

```
每次完成重要操作后，请更新共享工作区的上下文文件：
1. 读取 /Users/Admin/.workbuddy/shared-workspace/context/TOOL_STATUS.md
2. 更新 OpenCode 状态区块（最后心跳、正在处理、状态）
3. 读取 /Users/Admin/.workbuddy/shared-workspace/context/PROJECT_STATE.md
4. 在操作记录表格中追加一行（时间、工具=opencode、操作描述、相关文件）
```

---

## 使用技巧

### 从 OpenCode 触发 WorkBuddy 工作
在 OpenCode 对话中：
```
请将以下分析结果写入共享上下文，让 WorkBuddy 继续处理：
[你的分析内容]
```

### 从 OpenCode 读取 Hermes 的执行结果
```
请读取 /Users/Admin/.workbuddy/shared-workspace/context/SHARED_CONTEXT.md
查看 Hermes Agent 的最新输出
```

---

## 常见问题

**Q：OpenCode 无法启动 shared-workspace MCP 服务器？**
A：确保已安装 `@modelcontextprotocol/server-filesystem`：
```bash
npm install -g @modelcontextprotocol/server-filesystem
```

**Q：如何让 OpenCode 自动同步状态？**
A：配置 `oh-my-openagent.jsonc` 中的 `rules` 字段，加入自动同步指令。
