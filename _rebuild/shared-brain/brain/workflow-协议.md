# 双工具分工闭环协议

> 约定：OpenCode 负责核心内容生产，WorkBuddy 负责辅助精修

---

## 一、分工边界

### 谁做什么

| 环节 | 负责工具 | 说明 |
|:-----|:---------|:-----|
| **选题决策** | 用户 | 定方向、定角度 |
| **核心内容写作** | **OpenCode** | 研究报告、公众号文章、网站文章的第一稿 |
| **数据查证** | **OpenCode** | MCP 工具拉取 SEC/能源局/行情数据 |
| **网站部署** | **OpenCode** | md-to-astro → git push |
| **公众号草稿箱推送** | **OpenCode** | wechat_publisher.py |
| **PPT生成** | **OpenCode** | Python pptx 脚本 |

| **配图生成** | **WorkBuddy** | 封面图 + 正文图（文生图） |
| **格式精修** | **WorkBuddy** | 排版、标点、Markdown 规范 |
| **SEO优化** | **WorkBuddy** | 标题优化、摘要提炼、关键词 |
| **腾讯文档归档** | **WorkBuddy** | 内容资产备份 |
| **企微通知** | **WorkBuddy** | 发布通知 |

### 交付物流转

```
OpenCode 完成 → 写入 shared-workspace/ 产出目录
              → 更新 state.json (phase=publish)
              → 写 brain/handoff/ 交接包（含对 WorkBuddy 的任务要求）
              → state-watcher 检测到变化 → WorkBuddy 自动处理
```

---

## 二、交接包规范

OpenCode 写 handoff 时，`needsFromReceiver` 字段使用标准标签：

| 标签 | 含义 |
|:-----|:-----|
| `[配图]` | 根据提示词或文章内容生成配图 |
| `[精修]` | 格式/排版/语言润色 |
| `[归档]` | 同步到腾讯文档备份 |
| `[通知]` | 企微推送发布消息 |
| `[视频]` | 提取核心观点生成短视频脚本 |

---

## 三、首次闭环测试

### OpenCode 已交付

- `05_AIDC绿电一体化PE投资视角_公众号文章.md` — 核心文章完成
- `05_AIDC绿电一体化_图片提示词.md` — 3张配图提示词已写好（纵向三连图）
- 风格体系已更新至 brain/user-preferences.json v3

### 需 WorkBuddy 处理

1. **[配图]** 根据 `三件套输出/05_AIDC绿电一体化_图片提示词.md` 生成配图
2. **[精修]** 通读文章，检查格式和排版，提出修改建议（如有）
3. **[归档]** 将最终文章和配图归档到腾讯文档

### 完成后回传

WorkBuddy 完成后写 handoff 回 OpenCode，告知：
- 配图是否生成成功、效果如何
- 是否有修改建议
- 归档完成状态

OpenCode 再接续进行公众号草稿箱推送和网站部署。
