# WorkBuddy 配置说明 v3.1

> 已按此文件配置完成。最后更新：2026-06-14

---

## 配置完成状态

| 配置项 | 状态 | 说明 |
|:------|:-----|:-----|
| 文件监听器 | ✅ 已启动 | `bridge/state-watcher.mjs` 运行在 Mac 上 |
| Brain 文件读取 | ✅ 已配置 | 自动化会读取 brain/ 文件获取上下文 |
| 可视化→归档→通知 | ✅ 已配置 | 自动化规则已创建 |
| 企微通知 | ⏳ 待配置 | 需要连接 wecom 连接器 |
| 腾讯文档归档 | ⏳ 待配置 | 需要连接 tencent-docs 连接器 |

---

## 三步配置

### 第一步：启动文件监听器（核心）

WorkBuddy **不需要定时轮询**。共享工作区有一个 `state-watcher.mjs` 文件监听器，运行在你的 Mac 上（不是 WorkBuddy 沙箱内），它会实时检测 `state.json`、`brain/task-queue.json`、`brain/handoff/` 的变化并触发动作。

启动方式（已经在 `bridge/start-watcher.sh` 里）：
```bash
bash /Users/Admin/.workbuddy/shared-workspace/bridge/start-watcher.sh
```

监听器启动后，WorkBuddy 只需要在以下时机读取共享工作区：
- 收到企微通知（"新任务待处理"）
- 用户主动打开 WorkBuddy 时

### 第二步：读取脑文件获取上下文

当用户从 OpenCode 切到 WorkBuddy 时，**不要问用户"发生了什么"**，直接读取：

```
1. context/state.json → 当前状态
2. brain/handoff/ 最新文件 → OpenCode 留下的完整上下文包
3. brain/task-queue.json → 待处理任务列表
4. brain/decisions.json → 关键决策（定位、策略）
5. brain/user-preferences.json → 写作风格偏好
6. brain/context-log.json 最后10条 → 最近操作历史
```

### 第三步：WorkBuddy 专属自动化规则

#### 规则 1：检测到 handoff → 自动处理

```
触发条件:
  brain/handoff/ 有新文件 (from: opencode, to: workbuddy)
  OR pipeline.handoffPending === true

执行动作:
  1. 读取 handoff 文件 -> 获取上下文 + 任务列表
  2. 对每个 needsFromReceiver:
     - "可视化/图表" → 读文章/表格数据 → WorkBuddy Visualizer 生成图表
     - "归档" → 同步到腾讯文档
     - "通知" → 企微推送
  3. 更新 task-queue.json → 标记任务完成
  4. 写 log-session.mjs 记录操作
```

#### 规则 2：检测到阻塞 → 通知用户

```
触发条件:
  state.json → pipeline.blocked === true

执行动作:
  企微通知: "⚠️ 内容管线阻塞：{blockedReason}"
```

#### 规则 3：WorkBuddy 完成工作 → 写回 brain

```
完成可视化/归档后:
  1. 写 handoff: create-handoff.mjs --from workbuddy --to opencode ...
  2. 更新 task-queue.json 标记完成
  3. 写 context-log: log-session.mjs workbuddy ...
  4. 更新 state.json: sync-state.mjs workbuddy idle "可视化完成"
```

---

## 共享大脑文件索引

| 文件 | 用途 | 读写方 |
|:-----|:-----|:-------|
| `context/state.json` | 实时状态（phase/blocked/heartbeat） | OpenCode 写, WorkBuddy 读 |
| `brain/handoff/*.json` | 工具交接包（完整上下文） | OpenCode 写, WorkBuddy 读/处理 |
| `brain/task-queue.json` | 任务队列（谁需要做什么） | OpenCode 写, WorkBuddy 读/更新 |
| `brain/decisions.json` | 关键决策日志 | 双方读/写 |
| `brain/user-preferences.json` | 用户偏好（风格/数据源） | 双方读（OpenCode 写） |
| `brain/context-log.json` | 统一会话日志 | 双方追加 |
| `signals/workbuddy/*` | 轻量通知 → WorkBuddy | OpenCode 写 |
| `signals/opencode/*` | 轻量通知 → OpenCode | WorkBuddy 写 |

---

## 关键原则

1. **不需要用户重新解释** — 所有上下文在 brain/ 中，直接读取
2. **交接包代替对话** — 工作段结束时写一个 handoff JSON，比口述 5 分钟更精确
3. **任务队列消除等待** — 异步干活，各自完成后检查队列
4. **决策日志避免反复确认** — "定位是 PE/VC 不是二级炒股" 这种决策记一次就行
