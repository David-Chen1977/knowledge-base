# Inbox 内容处理技能

## 触发方式

用户说以下任一即可触发：
- "处理 inbox 新内容"
- "微信里有新内容"
- "看看小程序发了什么"

---

## 处理流程

### 1. 扫描 inbox

```bash
ls -lt /Users/Admin/.workbuddy/shared-workspace/inbox/text/
ls -lt /Users/Admin/.workbuddy/shared-workspace/inbox/images/
ls -lt /Users/Admin/.workbuddy/shared-workspace/inbox/files/
ls -lt /Users/Admin/.workbuddy/shared-workspace/inbox/video_links/
```

### 2. 按类型处理

#### 文字消息（`inbox/text/`）
1. 读取 `.txt` 文件内容
2. 判断内容类型：
   - **投资灵感/想法** → 整理成文章大纲，存 `shared-workspace/context/ideas/`
   - **公众号文章草稿** → 优化后存 `shared-workspace/context/articles/`
   - **任务指令** → 直接执行
3. 处理完后移动到 `inbox/processed/`

#### 图片（`inbox/images/`）
1. 读取图片（使用 Read 工具，支持 PNG/JPG）
2. 判断图片类型：
   - **配图灵感** → 记录风格特征，用于后续配图生成
   - **数据图表** → 提取数据，生成分析报告
   - **截图/文档** → OCR 提取文字，按文字消息处理
3. 处理完后移动到 `inbox/processed/`

#### 文件（`inbox/files/`）
1. 读取文件（PDF/Word/Excel）
2. 提取关键信息
3. 生成摘要，存 `shared-workspace/context/materials/`
4. 处理完后移动到 `inbox/processed/`

#### 视频号链接（`inbox/video_links/`）
1. 读取 `.txt` 文件，获取视频号链接
2. 尝试下载视频（使用 `yt-dlp` 或类似工具）
3. 如果下载成功：
   - 提取文案（ASR 或视频描述）
   - 生成改编方案
   - 存 `shared-workspace/context/video_scripts/`
4. 如果下载失败：
   - 记录链接，等待用户手动提供视频文件
5. 处理完后移动到 `inbox/processed/`

### 3. 生成处理报告

处理完成后，生成简要报告：

```markdown
## Inbox 处理报告（YYYY-MM-DD HH:MM）

### 处理结果

| 文件 | 类型 | 处理方式 | 输出位置 |
|------|------|----------|----------|
| 20260614_123045_微信想法.txt | 文字 | 整理成文章大纲 | context/ideas/绿电投资灵感.md |
| 20260614_123512_配图灵感.jpg | 图片 | 记录风格特征 | memory/2026-06-14.md |

### 待处理

- [ ] 视频号链接下载失败，需手动提供视频文件
```

### 4. 写 handoff（如有 OpenCode 需要处理的内容）

如果处理过程中生成了需要 OpenCode 进一步处理的内容（如 PPT 生成、代码实现），写 handoff 到 `shared-workspace/brain/handoff/`。

---

## 示例对话

**用户**："处理 inbox 新内容"

**AI**：
1. 扫描 inbox/ 发现 2 个新文件
2. 读取 `20260614_123045_微信想法.txt`，内容是："今天想到绿电一体化可以分两种生意模式..."
3. 判断为"投资灵感"，整理成文章大纲
4. 读取 `20260614_123512_配图灵感.jpg`，识别为"深色科技风配图"
5. 生成处理报告
6. 展示给用户

---

## 注意事项

- 处理前先展示文件列表，让用户确认是否需要全部处理
- 如果 inbox/ 为空，告知用户"暂无新内容"
- 处理失败时记录原因，不要静默忽略
- 移动文件到 `processed/` 前，确认处理已完成
