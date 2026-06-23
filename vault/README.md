# 🧠 第二大脑 · Obsidian Vault

> 人机协同系统的私有知识中枢。**默认所有内容为 private，显式标记为 public 的内容才会对外发布。**

## 目录结构

```
vault/
├── .obsidian/              ← Obsidian 配置（已就绪）
├── _scripts/                ← vault 运维脚本
│   └── apply-visibility.mjs ← visibility 标签管理工具
│
├── 00-每日/                 ← Daily notes
├── 01-研究笔记/              ← 研究笔记
├── 02-投资思考/              ← 投资思考与决策记录
├── 03-项目管理/              ← 项目文档
├── 04-随笔/                 ← 随笔/杂记
│
├── 10-知识库/               ← 投资研究知识库（原 知识库/ 内容）
│   ├── 电力新能源/
│   ├── 算电协同/
│   ├── AI/
│   ├── 复盘/
│   ├── 思考流/
│   ├── 人机协同/
│   ├── 元宝桥接/
│   ├── 内容日历/
│   └── 视频笔记/
│
└── 90-公开/                 ← 精选公开内容（可直接发布到网站）
```

## Visibility 规则

每个 `.md` 文件必须在 frontmatter 中包含 `visibility` 字段：

```yaml
---
title: 文件名
visibility: public    # ← 公开，会同步到知识库网站
# 或
visibility: private   # ← 私有，仅在 vault 中可见
---
```

**默认安全原则**：未标记 visibility 的文件 → 视为 `private`。

## 内容流转

```
vault/ (私有)                   知识库网站 (公开)
      │                              │
      │  visibility:public 的文件     │
      ├──────────────────────────────► VitePress → Vercel
      │                              │
      │  90-公開/ 下的文件            │
      │  (精选后手动放入)             │
      └──────────────────────────────► 直接发布
```

## 维护命令

```bash
# 检查所有文件的 visibility 状态
node _scripts/apply-visibility.mjs --check

# 为所有文件补充 visibility 字段
node _scripts/apply-visibility.mjs

# 健康检查
cd /Users/Admin/OpencodeWorkspace/知识库 && bash .scripts/health-check.sh
```

## 备份

人机协同系统（含本 vault）已备份到：
`/Volumes/移动硬盘/人机协同系统备份/OpencodeWorkspace/`
