# Inbox 处理规范

> 微信内容通过 WorkBuddy 小程序转发后，按本规范保存到对应目录，由 AI 自动或按指令处理。

---

## 目录结构

```
inbox/
├── text/          # 文字消息（想法、转发文本、对话摘录）
├── images/        # 图片（截图、照片、图表）
├── files/         # 文件（PDF、Word、Excel 等）
├── video_links/   # 视频号链接（文字形式，需额外处理）
└── processed/     # 处理完成的文件（归档用）
```

---

## 文件命名规范

### 文字消息
`YYYYMMDD_HHMMSS_文字来源_摘要.txt`

示例：`20260614_123045_微信想法_绿电投资灵感.txt`

### 图片
`YYYYMMDD_HHMMSS_图片描述.png/.jpg`

示例：`20260614_123512_公众号配图灵感.jpg`

### 视频号链接
`YYYYMMDD_HHMMSS_视频标题.txt`（内容为负链接）

---

## 处理流程

### 自动检测（推荐）
1. AI 启动时检查 `inbox/` 各子目录
2. 发现新文件 → 读取内容
3. 判断内容类型 → 路由到对应处理逻辑
4. 处理完成 → 移动到 `processed/`（或删除）

### 手动触发
用户说："处理 inbox 里的新内容" → AI 执行上述流程

---

## 内容处理逻辑

| 内容类型 | 处理逻辑 |
|---------|---------|
| **文字想法** | 整理成文章草稿 → 存 `context/ideas/` |
| **公众号文章链接** | 抓取正文 → 生成摘要 + 配图建议 → 存 `context/articles/` |
| **图片** | 识别内容 → 判断用途（配图灵感/数据图表/其他）→ 分类存储 |
| **视频号链接** | 下载视频（如可行）→ 提取文案 → 生成改编方案 |
| **文件（PDF/Word）** | 提取关键信息 → 生成摘要 → 存 `context/materials/` |

---

## 小程序开发要求

WorkBuddy 小程序需要支持：

1. **接收微信消息**（文字/图片/文件）
2. **保存到对应目录**（按上述命名规范）
3. **触发 AI 处理**（可选：自动或手动）

### 小程序保存示例（伪代码）

```javascript
// 用户转发文字消息到小程序
function onMessageReceived(msg) {
  const timestamp = formatDate(new Date(), 'YYYYMMDD_HHMMSS');
  const filename = `${timestamp}_微信消息_${msg.content.substring(0, 20)}.txt`;
  
  // 保存到共享工作区
  saveToSharedWorkspace(`inbox/text/${filename}`, msg.content);
  
  // 可选：触发 AI 处理
  triggerAIProcessing();
}
```

---

## 版本记录

- 2026-06-14：初版，支持文字 + 图片 + 文件 + 视频号链接
