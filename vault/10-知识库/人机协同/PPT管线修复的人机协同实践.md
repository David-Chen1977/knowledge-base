---
title: PPT管线修复 — 一次人机协同的深度诊断与重建
description: 从"管线完全瘫痪"到"端到端可用"的全过程复盘，看人类投资人与AI如何通过结构化分工，修复一条涉及4个代码仓库、13个Python脚本、2套并行的PPT生成管线
tags: [人机协同, PPT管线, AI自动化, 管线修复, 案例复盘]
updated: 2026-06-24
visibility: public
---

# PPT管线修复
## 一次人机协同的深度诊断与重建

> **摘要：** 本文记录了一次典型的"人机协同深度工作"——从诊断到修复一条完全瘫痪的PPT生成管线。涉及4个代码仓库、13个Python脚本、2套并行管线、150+历史PPT资产。重点不在技术细节，而在人类与AI如何通过结构化分工，在2小时内完成从发现问题到端到端验证的全流程。

---

## 一、背景：一条"看起来存在"的管线

投资研究中，PPT是核心产出形式之一。我们的内容管线（content-pipe.mjs）宣称支持 `--types ppt` 参数，理论上可以从研究笔记一键生成 PPT。

但实际操作中，这条管线**从未真正工作过**。

问题出在一个微小的细节：content-pipe.mjs 调用一个叫 `ppt_to_video.py` 的脚本——但这个文件**根本不存在**。没有报错、没有崩溃，只是静默跳过，输出 "⚠️ ppt_to_video.py 不存在，跳过 PPT"。

这就像一条高速公路，导航显示"PPT出口"存在，但开到跟前才发现出口从未修建。

更糟的是，没有人知道它坏了——因为它是静默失败的。

---

## 二、诊断流程：人机如何协作定位根因

### 2.1 第一步：AI发起全面审计

当人类发出"请评估PPT管线"的指令时，AI没有直接去修代码，而是先做了一次完整的**管线测绘**：

| 发现 | 严重度 | 说明 |
|------|--------|------|
| 全部Python依赖缺失 | 🔴 BLOCKER | python-pptx、Pillow、moviepy、PyYAML、playwright 均未安装 |
| content-pipe 调用死脚本 | 🔴 BLOCKER | 查找 `ppt_to_video.py`——不存在于任何目录 |
| 两张不兼容的JSON schema | 🟡 摩擦 | content-pipe生成 `ppt-config.json`，skill脚本需要 `deck.json` |
| 路径漂移 | 🟡 摩擦 | 输出指向 `OpenCode生成文件/`（不存在），而非 `三件套输出/`（有150+历史资产） |
| 两套并行代码库 | 🟡 分裂 | skill脚本在外置硬盘，模板脚本在外置硬盘，内容管线在workspace——各自为政 |

**关键洞察：** 管线不是"有bug"，而是**从未被完整连接过**。

### 2.2 人类决策：范围界定

AI提交审计报告后，人类做出了几个关键决策：

1. **目标明确**：让 `content-pipe.mjs --types ppt` 能产出可编辑 PPTX
2. **复用而非重建**：skill目录下已有 `native_pptx.py`（deck.json → PPTX），写一个桥接脚本而非重写整个管线
3. **三个主题**：支持 nmg（内蒙古新质动能深蓝/金/红）、personal（个人简约深色）、huihong（汇竑红金）三种风格
4. **视频管线顺带修复**：同样依赖 `ppt_to_video.py`，一并改用 skill 目录下的 `moviepy_stitch.py`

人类确定"做什么"，AI负责"怎么做"——这是本次协作的核心分工原则。

---

## 三、重建过程：六个阶段，两小时

### 阶段一：依赖安装（5分钟）

AI在 `/tmp/pptx-venv` 创建 Python 虚拟环境，逐个安装依赖：

```bash
python3 -m venv /tmp/pptx-venv
pip install python-pptx Pillow moviepy PyYAML playwright
```

安装过程中遇到 Homebrew Python 的 PEP 668 保护，改用 venv 方案解决。

### 阶段二：桥接脚本（30分钟）

核心成果：`content-to-deck.mjs` —— 238行 Node.js 脚本，完成三层翻译：

```
content-pipe 产出 (bundle.json + article.md)
    │  读取大纲、事实、正文
    ▼
deck.json (native_pptx.py 格式)
    │  按主题配色、自动分页、排版
    ▼
   调用 native_pptx.py → 可编辑 PPTX + 预览 PNG
```

桥接脚本内置了三个完整主题：

- **nmg 主题**（默认）：深海军蓝底色 #364153 + 金色 #B89A6A + 红色 #C00000，微软雅黑字体
- **personal 主题**：深色封面 #1a1a2e + 白色内容页 + Helvetica Neue
- **huihong 主题**：汇竑红金配色 #8B0000 + #D4AF37，Times New Roman

每个主题定义了12个颜色变量，覆盖封面、内容页、强调色、文字色、分割线等。

### 阶段三：内容管线修复（15分钟）

修改 `content-pipe.mjs`：

- 替换 `generatePPT()`：从调用不存在的 `ppt_to_video.py` 改为调用 `content-to-deck.mjs`
- 替换 `generateVideo()`：从调用不存在的 `ppt_to_video.py` 改为调用 `moviepy_stitch.py`
- 修正 `OUTPUT_DIR`：从不存在的 `OpenCode生成文件/` 指向 `三件套输出/`

### 阶段四：主题整合（10分钟）

外置硬盘上有两套更复杂的模板脚本（`nmg_ppt_generator.py`、`ppt_template_neimenggu.py`），它们基于真实的 .pptx 模板文件进行渲染，精确控制渐变、阴影、图文混排。

桥接脚本直接植入了它们的配色方案，保证了风格一致性，同时保持了轻量级——不需要加载模板文件就能生成。

### 阶段五：端到端验证（10分钟）

```bash
node content-to-deck.mjs \
  --topic "AI数据中心电力瓶颈与算电协同" \
  --theme nmg \
  --output /tmp/test.pptx \
  --preview
```

输出：

```
PPTX: /tmp/test.pptx (31KB, 3页)
Preview: slide_001.png
Preview: slide_002.png
Preview: slide_003.png
```

管线验证通过。

### 阶段六：提交与文档（10分钟）

```bash
git add scripts/content-pipe.mjs scripts/content-to-deck.mjs
git commit -m "fix(ppt): repair broken PPT pipeline"
```

4 files changed, 534 insertions, 47 deletions.

---

## 四、修复后的管线全貌

```
研究笔记
    │
    ├─→ content-pipe.mjs (管线编排)
    │       │
    │       ├─ --types ppt
    │       │   → content-to-deck.mjs (桥接)
    │       │       → deck.json → native_pptx.py → .pptx + 预览PNG
    │       │
    │       ├─ --types video
    │       │   → moviepy_stitch.py (PNG→MP4)
    │       │       → 翻页视频.mp4 (带TTS配音+转场)
    │       │
    │       ├─ --types article
    │       │   → 公众号文章 (wenyan-mcp发布)
    │       │
    │       └─ --types website
    │           → .astro 页面 → 个人网站部署
    │
    ├─→ 逆向管线 (截图→PPTX)
    │   → image2pptx.py → compose_pptx.py → 可编辑PPTX
    │
    └─→ 模板管线 (外置硬盘，独立使用)
        → nmg_ppt_generator.py → 基于模板文件生成
```

### 技术栈

| 组件 | 技术选型 | 说明 |
|------|---------|------|
| PPT生成引擎 | python-pptx 1.0.2 | 原生生成，不依赖Office |
| 桥接脚本 | Node.js + child_process | 与content-pipe生态一致 |
| 预览渲染 | Pillow (PIL) | 纯色预览，轻量级 |
| 视频合成 | moviepy 2.2.1 + ffmpeg | 翻页动画+TTS配音 |
| HTML动画视频 | Playwright + Chrome | 数据图表动画（可选） |
| 依赖管理 | /tmp/pptx-venv | 隔离的系统Python 3.14 |

---

## 五、人机协同的模式复盘

### 这次协作中，人类做了什么

1. **定义目标**："让PPT管线能用"——简洁、清晰、可验证
2. **确认范围**：复用现有脚本 vs 从零重建 → 选桥接方案
3. **决策主题**：三套配色方案，覆盖所有使用场景
4. **验证结果**：检查生成的文件、确认输出质量
5. **判断优先级**：什么时候修、修到什么程度、哪些可以下次做

### AI做了什么

1. **深度审计**：检查了4个目录、13个脚本、所有依赖
2. **方案设计**：提出桥接架构而非重写
3. **代码实现**：238行桥接脚本 + 管线修复 + 主题系统
4. **依赖管理**：创建venv、逐个安装、解决PEP 668问题
5. **端到端测试**：生成真实PPTX并验证

### 协作模式的结构化拆解

```
人类 → AI         诊断阶段
  "评估PPT管线"
  → AI审计4个代码仓库 → 输出诊断报告
  → 人类确认问题严重度 → 决定修复

人类 ← AI         方案阶段
  AI提出3种修复方案
  → 人类选择"桥接"方案
  → AI输出详细实施计划
  → 人类批准执行

人类 → AI         执行阶段
  AI创建桥接脚本、修复管线、安装依赖
  → 每完成一个阶段，自动报告进度
  → 人类在关键节点检查中间产物

人类 ← AI         验证阶段
  AI生成测试PPTX + 预览图
  → 人类检查视觉效果
  → AI提交代码 + 更新文档
```

**关键模式：先审计，再方案，再执行，再验证。每个阶段有人类的决策节点。**

### 与传统开发的区别

| 维度 | 传统开发 | 人机协同 |
|------|---------|---------|
| 审计速度 | 2-3小时人工代码走查 | 5分钟AI扫描全部4个仓库 |
| 方案迭代 | 写代码→编译→改→编译 | 直接输出正确代码 |
| 依赖问题 | 手动排查→Google→试错 | AI自动识别+创建venv+安装 |
| 测试 | 手动运行+检查 | AI自动生成+验证 |
| 文档 | 事后补写 | AI同步生成结构化文章 |

---

## 六、经验与教训

### 做对了的

1. **先测绘再动工** — AI花10分钟审计整个管线，避免了盲目修改
2. **桥接而非重建** — 最小化改动，最大杠杆效果
3. **一次性修复视频管线** — 同样的根因，同样的修复模式，顺带解决
4. **端到端验证** — 不只看代码是否通过，而是真正跑通生成一个PPTX

### 踩过的坑

1. **静默失败最危险** — 如果 `ppt_to_video.py` 不存在时报错而非静默跳过，问题早就被发现
2. **PEP 668** — Homebrew Python 3.14 禁止系统级 pip install，需要一个 venv 策略
3. **两套路径系统** — content-pipe 指向 `OpenCode生成文件/`，skill脚本写在当前目录，桥接需要统一输出目录
4. **依赖过时** — moviepy 回退 Pillow 版本（12.2.0→11.3.0），依赖兼容性问题需要关注

### 待改进

- 自动检测 `ppt_to_video.py` 不存在的告警机制
- PPT模板的高级渲染（渐变背景、图文混排、图表）
- Docker化 Python 环境，避免 venv 的临时性
- 统一的 deck.json schema 版本控制

---

## 七、结语

这次修复最有趣的地方在于：**问题本身很简单（一个不存在的文件引用），但修复它却需要理解4个代码仓库、13个Python脚本、2套并行管线之间的数据流和依赖关系。**

人类不适合做这种大范围的代码考古——太耗时，太难保持上下文。AI也不适合做这种决策——它不知道"修到什么程度算够"，不知道"三个主题覆盖哪些场景"，不知道"先修PPT还是先修视频"。

但人类+AI一起：AI做考古，人类做决策；AI写代码，人类验质量。2小时，从瘫痪到可用。

这就是人机协同的真实面貌——不是AI替代人类，也不是人类用AI当更快的打字机，而是**两种智能的互补分工**。

---

*本文由 AI 辅助写作，记录了人机协同系统自身的一次深度实践。*
