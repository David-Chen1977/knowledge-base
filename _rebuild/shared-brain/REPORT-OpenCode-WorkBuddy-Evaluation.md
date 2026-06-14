# OpenCode + WorkBuddy 双工具协同评估报告

生成时间：2026-06-14 00:45
评估人：WorkBuddy

---

## 一、核心能力对比

| 维度 | **OpenCode** | **WorkBuddy（我）** |
|------|--------------|---------------------|
| **定位** | 终端 Coding Agent | 桌面 AI 工作台 |
| **运行形态** | CLI/TUI（终端） | 桌面应用 + 小程序 |
| **核心强项** | 代码编写、重构、Debug | 多模态生成、中国生态集成、可视化 |
| **模型接入** | 75+ 模型（OpenAI/Anthropic/DeepSeek/本地 Ollama） | 内置模型（GPT 等）+ 可配置 |
| **中国生态** | ❌ 无 | ✅ 强（腾讯文档/企微/乐享/会议等 30+ 连接器） |
| **多模态生成** | ❌ 无 | ✅ 文生图/视频/3D 模型 |
| **可视化输出** | ❌ 无 | ✅ 内置 Visualizer（inline 图表/图示） |
| **MCP 支持** | ✅ 强（已配置 6 个 MCP Server） | ✅ 强（30+ 预配置连接器） |
| **持久记忆** | ⚠️ 有限（会话级） | ✅ 三层记忆（云/用户级/工作区） |
| **技能系统** | ✅ Agent Skills | ✅ Skill 系统（可创建/分享） |
| **自动化/定时** | ⚠️ 有限 | ✅ 内置 Automation 系统 |
| **离线/本地模型** | ✅ 强（Ollama 等） | ⚠️ 有限 |
| **上手门槛** | 中（需配置 API Key） | 低（桌面应用，开箱即用） |
| **价格** | ✅ 完全免费开源（MIT 协议） | 需订阅 |

---

## 二、协同可行性评估

### ✅ 高度可行（评分：9/10）

**核心理由：**

1. **能力互补性强**
   - OpenCode：纯代码任务（写代码、改代码、Debug）
   - WorkBuddy：非代码任务（文档、可视化、中国生态、多模态）

2. **MCP 协议互通**
   - 两者都支持 MCP 协议
   - 已配置 `shared-workspace` MCP Server（文件系统共享）

3. **工作流无缝衔接**
   - OpenCode 写代码 → WorkBuddy 生成文档/图表
   - WorkBuddy 设计架构 → OpenCode 实现代码

4. **无冲突**
   - OpenCode 运行在终端
   - WorkBuddy 运行在桌面
   - 两者互不干扰

---

## 三、协同价值分析

### 🎯 核心价值

| 场景 | OpenCode 负责 | WorkBuddy 负责 | 价值 |
|------|---------------|----------------|------|
| **项目开发** | 写代码、重构、Debug | 生成架构图、API 文档、测试用例 | 🔥 高 |
| **数据分析** | 数据清洗、特征工程 | 生成可视化图表、报告 | 🔥 高 |
| **中国业务** | - | 腾讯文档同步、企微通知 | 🔥 高 |
| **多模态内容** | - | 文生图/视频/3D 模型 | 🔥 高 |
| **自动化** | - | 定时任务、监控告警 | 中 |
| **离线工作** | 本地模型（Ollama） | - | 中 |

### 💡 独特优势

**vs. 单独使用 OpenCode：**
- ✅ 获得多模态生成能力（图片/视频/3D）
- ✅ 获得中国生态集成（腾讯文档/企微等）
- ✅ 获得可视化输出（图表/图示）
- ✅ 获得持久记忆（跨会话）

**vs. 单独使用 WorkBuddy：**
- ✅ 获得终端原生体验（TUI、vim 键绑定）
- ✅ 获得 75+ 模型选择（包括免费模型）
- ✅ 获得完全离线能力（本地模型）
- ✅ 获得开源自由（MIT 协议，可自建）

---

## 四、推荐分工方案

### 🏆 方案 A：OpenCode 为主 + WorkBuddy 为辅（推荐）

**适用场景：** 日常编码为主，偶尔需要文档/可视化/中国生态

**工作流：**
```
1. OpenCode 终端启动 → 写代码、改代码、Debug
2. 需要文档/图表时 → 切换 WorkBuddy → 生成文档/图表
3. 需要中国生态时 → 切换 WorkBuddy → 同步腾讯文档/企微通知
4. 需要多模态时 → 切换 WorkBuddy → 生成图片/视频/3D
```

**优点：**
- ✅ OpenCode 终端体验流畅
- ✅ WorkBuddy 补齐能力短板
- ✅ 两者通过共享工作区互通

**配置：**
- OpenCode：`opencode.jsonc` 已配置 `shared-workspace` MCP
- WorkBuddy：`.mcp.json` 已配置 `shared-workspace` MCP
- 共享工作区：`~/.workbuddy/shared-workspace/`

---

### 🥈 方案 B：WorkBuddy 为主 + OpenCode 为辅

**适用场景：** 日常需要多模态/中国生态，偶尔需要深度编码

**工作流：**
```
1. WorkBuddy 桌面启动 → 设计架构、生成文档、多模态内容
2. 需要深度编码时 → 切换 OpenCode → 写代码、重构、Debug
3. 代码写完后 → 切换 WorkBuddy → 生成测试用例、API 文档
```

**优点：**
- ✅ WorkBuddy 桌面体验友好
- ✅ OpenCode 补齐编码能力
- ✅ 两者通过共享工作区互通

**配置：**
- 同上

---

## 五、实操指南

### 🚀 快速开始（5 分钟）

**第 1 步：验证 OpenCode MCP 配置**

在终端运行：
```bash
opencode
```

然后输入：
```
/mcp list
```

应该能看到 `shared-workspace` 出现在列表中。

---

**第 2 步：验证共享工作区**

在 OpenCode 中输入：
```
请读取 ~/.workbuddy/shared-workspace/context/TOOL_STATUS.md，然后把自己的状态更新为"已验证"
```

---

**第 3 步：测试协同工作流**

**场景：开发一个 Python 项目**

1. **OpenCode 中：**
```
创建一个 FastAPI 项目，包含用户认证和 CRUD 接口
```

2. **WorkBuddy 中（我）：**
```
请读取 OpenCode 生成的项目代码，然后：
1. 生成项目架构图
2. 生成 API 文档（Markdown 格式）
3. 生成测试用例
```

3. **OpenCode 中：**
```
运行 WorkBuddy 生成的测试用例
```

---

### 📋 日常使用规范

**文件命名约定：**
- OpenCode 输出：`code-output-YYYYMMDD-HHMM.md`
- WorkBuddy 输出：`doc-output-YYYYMMDD-HHMM.md`
- 共享上下文：`SHARED_CONTEXT.md`

**状态更新规范：**
- OpenCode 每次完成重要任务后，更新 `TOOL_STATUS.md`
- WorkBuddy 每次完成重要任务后，更新 `TOOL_STATUS.md`

**MCP 配置规范：**
- OpenCode：`opencode.jsonc` → `mcp` 字段
- WorkBuddy：`.mcp.json` → `mcpServers` 字段

---

## 六、风险和注意事项

### ⚠️ 潜在风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **MCP Server 启动慢** | OpenCode 启动变慢 | 按需启用 MCP Server |
| **共享工作区文件冲突** | 两人同时写入同一文件 | 约定文件命名规范 |
| **模型成本** | WorkBuddy 需订阅 | OpenCode 用免费模型 |
| **学习成本** | 需要熟悉两个工具 | 先用方案 A（OpenCode 为主） |

### 💡 最佳实践

1. **明确分工**：代码任务用 OpenCode，非代码任务用 WorkBuddy
2. **共享上下文**：重要决策记录在 `SHARED_CONTEXT.md`
3. **状态同步**：每次完成任务后更新 `TOOL_STATUS.md`
4. **版本控制**：共享工作区加入 Git 管理

---

## 七、结论

### ✅ 推荐指数：9/10

**强烈推荐** OpenCode + WorkBuddy 双工具协同，理由：

1. **能力高度互补**：代码 + 非代码，终端 + 桌面
2. **技术可行**：MCP 协议互通，共享工作区已搭建
3. **成本可控**：OpenCode 免费，WorkBuddy 订阅性价比高
4. **无冲突**：两者运行形态不同，互不干扰

### 🎯 下一步行动

1. **立即开始**：按"快速开始"指南验证协同
2. **选择方案**：推荐方案 A（OpenCode 为主）
3. **实战测试**：用一个真实项目测试完整工作流
4. **优化配置**：根据使用情况调整 MCP 配置

---

## 八、附录：配置文件位置

| 工具 | 配置文件 | 说明 |
|------|---------|------|
| OpenCode | `~/.config/opencode/opencode.jsonc` | MCP、模型、插件配置 |
| WorkBuddy | `~/.workbuddy/.mcp.json` | MCP 连接器配置 |
| 共享工作区 | `~/.workbuddy/shared-workspace/` | 上下文、状态、脚本 |
| 共享上下文 | `~/.workbuddy/shared-workspace/context/` | 项目状态、工具状态 |

---

**报告完成。有任何问题欢迎继续交流！** 🚀
