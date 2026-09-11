---
title: 人机协同系统构建实录 — 从零搭建投资研究AI管线
description: 如何用 OpenCode + WorkBuddy + whisper.cpp + 10个MCP服务，搭建覆盖 iPhone/Mac/微信/语音的全链路投资研究协作系统
tags: [人机协同, AI自动化, 系统架构, 投资研究]
updated: 2026-06-23
visibility: public
---


# 人机协同系统构建实录
## 从零搭建投资研究AI管线

> **摘要：** 本文记录了作者用 OpenCode + WorkBuddy + whisper.cpp + 10个MCP数据服务，搭建覆盖 iPhone→Mac、微信文件、语音录音、浏览器剪藏的全链路投资研究协作系统的完整过程。系统上线后实现 5 个守护进程自动运行，日处理数十条跨设备输入，自动完成归类→归档→发布。

---

## 一、为什么要搭这套系统

作为 PE/VC 一级市场投资人，日常有大量信息输入需要处理：

- 微信里的行业报告、会议纪要
- 浏览器/公众号看到的深度分析
- iPhone 上随时记录的灵感
- 会议录音需要转文字
- 需要定期刷新储能/光伏/AI等赛道的公开数据

以前这些信息分散在微信收藏、iCloud 备忘录、浏览器书签里，需要用的时候找不到，更谈不上结构化整理。

**目标很明确：** 打造一个"输入即归档"的系统，所有信息进入统一知识库，自动分类到对应赛道，需要时 AI 能直接调取。

---

## 二、系统架构

```
iPhone 快捷指令 → iCloud Drive
微信文件        → WeChat Downloads
语音录音        → inbox/audio/
浏览器          → HTTP Bridge :8899
         │
         ▼
    inbox-watcher / wechat-watcher / voice-processor
         │
         ├── 文字类 (.md/.txt/.pdf/.docx/.xlsx)
         │   → 关键词分类 → 知识库归档
         │
         ├── 图片类 (.jpg/.png)
         │   → inbox/images/ (对话中OCR)
         │
         ├── 音频类 (.mp3/.m4a/.silk)
         │   → whisper.cpp 转录 → 知识库归档
         │
         └── 其他文件
             → inbox/files/ (不丢失)
```

### 核心组件

| 组件 | 数量 | 说明 |
|------|------|------|
| MCP 数据服务 | 10 个 | SEC EDGAR, yfinance, FRED, Prospector Energy, China Energy, 文颜, PPT, 等 |
| 守护进程 | 5 个 | unified bridge, inbox-watcher, wechat-watcher, voice-processor, http-bridge |
| 桥接脚本 | 30+ 个 | event-bus, state-manager, pipeline-auto, notify, queue, 等 |
| 自定义技能 | 12 个 | 行业分析, 协议审查, 公众号写作, PPT生成, 安全审计, 等 |
| 自动化规则 | 4 条 crontab | 健康检查(4h), 系统清理(周三/六), 日历推进(4h), 知识库同步(9am) |

---

## 三、关键里程碑

### Sprint 1：系统基础修复（Day 1）

接手时系统有 12 个问题：

| 问题 | 严重度 | 解决方案 |
|------|--------|---------|
| launchd 守护进程 exit=1 不自愈 | 🔴 | 重写 plist: KeepAlive=true + PATH/Home 环境变量 |
| 仅1个服务在运行 | 🔴 | 新增 http-bridge + voice-processor + wechat-watcher 守护 |
| WeChat 凭据明文存储 | 🔴 | 迁移到 macOS Keychain |
| state.json 2天未同步 | 🔴 | 状态管理器增加自动刷新 + 健康检查告警 |
| 73个 traces + 97个 snapshots 不清理 | 🟡 | system-cleanup.mjs + crontab |
| GBrain 在 /tmp 重启丢失 | 🟡 | 迁移到持久化目录 |
| 无统一健康视图 | 🟡 | system-health.mjs 一键检查 |

### Sprint 2：iPhone 管线打通（Day 1）

核心突破：生成并部署了 **"保存到知识库"iOS 快捷指令**。

```
iPhone 分享 → "保存到知识库" → iCloud Drive
  → inbox-watcher 检测 → 关键词归类
  → 知识库归档 → ServerChan 推送通知
```

**测试结果：** 从 iPhone 发送"储能 宁德时代"测试消息 → 10秒内 Mac 端自动归类到储能赛道。

### Sprint 3：文件格式扩展（Day 1）

inbox-watcher 原来只支持 `.md/.txt`，扩展后：

| 格式 | 方案 | 效果 |
|------|------|------|
| `.pdf` | Python pdfminer 文本提取 | 自动提取+归类 |
| `.docx` | macOS 内置 textutil | 零依赖 |
| `.xlsx` | Python openpyxl | 提取所有单元格 |
| `.rtf`/`.html` | macOS textutil | 兼容处理 |
| `.jpg`/`.png` | 存 inbox/images/ | 对话中 AI OCR |

### Sprint 4：语音引擎（Day 2）

macOS 上部署 **whisper.cpp v1.8.7**，M3 芯片 Metal 加速：

- 中文模型 ggml-tiny (74MB) → 即时可用
- ggml-small (465MB) → 后台下载中，精度更高
- 微信语音 `.silk` 格式 → silk-v3-decoder 转码后转录
- 测试：生成中文语音 → whisper 转录 → 知识库归档 → 全程 <30秒

### Sprint 5：微信管线（Day 2）

wechat-watcher 上线，直接监听 WeChat 下载目录：

- 文件自动分类（文本/图片/文档）
- 学而思期末试卷、英语复习题 → 自动过滤（不进入知识库）
- "算力芯片行业报告" → 自动归类到 AI 赛道
- "寰晟高压直挂超充站手册" → 自动归类到 算电协同

---

## 四、数据闭环

每天的自动化流程：

```
09:00  知识库数据刷新
       → refresh-kb.mjs 调用 China Energy 数据源
       → 写入 4 个赛道文件 → git commit
       → 触发 sync-to-website.sh → VitePress 构建 → Vercel 部署

12:00/16:00/20:00  健康检查
       → system-health.mjs --alert
       → 检查 5 个守护进程 + state.json 新鲜度 + 磁盘空间
       → 异常时 ServerChan 推送 iPhone

03:00 (周三/六)  系统清理
       → system-cleanup.mjs
       → 清理旧 traces/snapshots + SQLite VACUUM
```

---

## 五、关键配置

### 守护进程管理

所有服务通过 launchd 管理，KeepAlive=true 自动恢复：

```xml
<key>KeepAlive</key>
<true/>
<key>EnvironmentVariables</key>
<dict>
    <key>PATH</key>
    <string>/Users/Admin/.local/bin:/opt/homebrew/bin:...</string>
</dict>
```

### 凭据安全

所有敏感信息存在 macOS Keychain：

```bash
# .zshrc 中从 Keychain 加载
export WECHAT_APP_ID="$(security find-generic-password \
  -a 'opencode-human-collab' -s 'wechat-app-id' -w)"
```

### iPhone 快捷指令

只需一个 "存储文件" 动作，保存到 iCloud Drive 的 `workbuddy-inbox/` 目录。

---

## 六、成果与数据

| 指标 | 数值 |
|------|------|
| 守护进程 | 5 个，100% 自愈 |
| 输入渠道 | 4 个（iPhone/微信/语音/浏览器） |
| 支持文件格式 | 15+ 种 |
| 知识库赛道 | 8 个（储能/光伏/风电/氢能/电力/AI/算电协同/基金） |
| 自动过滤 | ✅ 期末试卷、英语复习题等不相关文件 |
| 通知推送 | 每次输入处理后 ServerChan 推送到 iPhone |
| 网站发布 | 自动构建 VitePress → 部署 Vercel |
| 代码清理 | Hermes 废弃系统删除，释放 693MB |

---

## 七、经验与教训

### 做对了的

1. **渐进式架构** — 先从最痛的点开始（iPhone→Mac 传输），再逐步扩展格式和渠道
2. **事件驱动** — event-bus + state-manager 替代文件轮询，大幅降低延迟
3. **macOS 内置工具优先** — `textutil` 处理 .docx 零依赖，`say` 生成测试音频
4. **黑白名单设计** — 关键词正向匹配赛道 + 文件名反向过滤不相关内容

### 踩过的坑

1. **launchd 的环境隔离** — 脚本在 launchd 下 PATH 是空的，必须显式设置
2. **.shortcut 文件格式** — 程序生成的 plist 不兼容 iOS Shortcuts，最终让用户在 iPhone 上手创
3. **Hermes 删除副作用** — Node.js 符号链接断裂，需要重建
4. **下载超时** — Hugging Face 模型下载太慢，改用 Python urllib 单线程反而更稳定

### 待改进

- whisper 模型从 tiny 升级到 small → 中文精度提升
- 微信语音消息自动转码（silk→wav） → 已安装解码器，待完整集成
- 知识图谱构建 → 实体关系自动提取
- 多用户协作 → 权限管理

---

## 八、技术栈

```
AI Agent:   OpenCode + WorkBuddy (Tencent)
语音引擎:   whisper.cpp v1.8.7 (Metal on M3)
文件处理:   pdfminer + openpyxl + textutil
iOS集成:   快捷指令 + iCloud Drive + ServerChan
消息推送:   ServerChan → 微信
网站框架:   VitePress + Vercel
代码管理:   git + launchd + crontab
凭据管理:   macOS Keychain
```

---

*本文由 AI 辅助写作，全部代码和配置可在我的 GitHub 找到。*
