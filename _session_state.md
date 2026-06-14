# 🧠 会话状态快照

> 每次完成重要工作段时自动更新。下次回来告诉我"继续"，我会：
> **1. 先读 SYSTEM_CORE.md → 2. 再读 brain/decisions.json → 3. 接上上下文**
>
> 🆕 **双工具共享大脑 v3** — 切换工具时无需重新解释。OpenCode 和 WorkBuddy 共用 `~/.workbuddy/shared-workspace/brain/` 中的上下文。
>
> ⚠️ **所有优化和迭代已固化到 SYSTEM_CORE.md + brain/decisions.json，不会退化。**

---

## 📌 当前项目

- **主赛道：** 电力新能源 + AI 赛道 · PE/VC 一级股权投资
- **公众号/IP：** 道雷 · 三件套内容管线（公众号+网站+PPT）
- **工作空间：** `/Users/Admin/OpencodeWorkspace/`
- **个人网站：** `https://chendaolei-website.pages.dev`
- **网站源码：** `/Volumes/移动硬盘/personal-website/`（Astro + Cloudflare Pages）
- **公众号API：** `scripts/wechat_publisher.py` · AppID: `wx7ae4cfe0d680c0fe`

---

## 📋 当前状态

| 任务 | 状态 | 备注 |
|------|:----:|------|
| 三件套 01 深挖三个投资方向 | ✅ 全部完成 | 公众号草稿箱 + 网站已上线 + PPT v2 |
| 三件套 02 液冷赛道PE投资视角 | ✅ 全部完成 | 公众号草稿箱 + 网站已上线 + PPT v2 |
| 三件套 03 算电协同公司深度对比 | ✅ 全部完成 | 公众号草稿箱 + 网站已上线 + PPT v2 |
| 三件套 04 冷却液材料PE报告 | ✅ 完成 | `三件套输出/04_冷却液材料赛道PE投资视角_完整报告.md` |
| 三件套 05 AIDC绿电一体化PE报告 | ✅ 完成 | `三件套输出/05_AIDC绿电一体化PE投资视角_完整报告.md` |
| 投资人行动清单 (3份) | ✅ 完成 | `三件套输出/` 各 `*_投资人行动清单.md` |
| 跨赛道对比指南 | ✅ 完成 | `三件套输出/跨赛道对比_投资配置指南.md` |
| 发布行动指南SOP (最终版) | ✅ 完成 | `三件套输出/发布行动指南.md` — 自动执行 |
| qwen2.5:14b 本地模型 | ✅ 就绪 | 9.0GB, 推理测试通过 |

---

## 🧩 本期（2026-06-14）完成工作

### Track 1: 公众号发布
- 3篇 公众号文章全部推到草稿箱（封面图自动生成+上传）
- 需去后台预览后手动发布

### Track 2: 网站部署
- 3篇 `.astro` 页面通过 `md-to-astro.mjs` 自动生成
- `articles.ts` 注册 + `npm run build` 成功（140页）
- `git push` 到 `origin/main` → Cloudflare Pages 自动部署
- 上线URL:
  - `chendaolei-website.pages.dev/blog/ai-infrastructure-three-investment-tracks`
  - `chendaolei-website.pages.dev/blog/liquid-cooling-pe-investment-map`
  - `chendaolei-website.pages.dev/blog/aidc-two-strong-comparison`

### Track 3: 两篇新PE报告
- `04_冷却液材料赛道PE投资视角_完整报告.md` — 189行，覆盖市场/竞争/技术/投资逻辑
- `05_AIDC绿电一体化PE投资视角_完整报告.md` — 188行，覆盖商业模式/可比公司/投资图谱

### 工具改进
- `md-to-astro.mjs`: 新增代码块（```）渲染支持

---

## 🧭 关键决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 06-14 | 三路并行执行（公众号+网站+PE报告） | 三条线无依赖，并行最优 |
| 06-14 | 用脚本生成公众号封面图 | 微信API需要thumb_media_id，封面为必填字段 |
| 06-14 | 修改md-to-astro.mjs支持代码块 | 网站文章含ASCII art和代码格式 |
| 06-14 | 网站使用articles.ts注册而非blog.astro内联 | 现有系统统一用articles.ts管理文章列表 |
| 06-13 | 公众号AppSecret更新 | 原密钥过期，报40125 invalid appsecret |

---

## 📝 写作风格迭代（2026-06-14 · 里程碑）

### 用户首次风格反馈 → 已执行

| 反馈 | 已更新 |
|:-----|:-------|
| 标题6分，冗长 | `brain/user-preferences.json` + `写作风格参考.md v2.0` — 标题≤18字，不概括不拼凑不夸大 |
| 巴菲特/芒格/段永平风格 | `写作风格参考.md` 新增对标人物语言特征拆解（第七章） |
| 不装逼、平实坦诚 | 新增"要做/不要做"用词清单 + 自嘲/坦诚准则 |
| 带幽默感 | 冷幽默方式：反常观察、类比反差 |
| ❌ **禁止编造经历** | 虚构的"朋友"故事已全部删除。以后只用真实数据+逻辑推演+坦诚不确定 |

### 文章状态

- `04_冷却液材料赛道PE投资视角_公众号文章.md` ✅ 已按新风格重写
- 公众号草稿箱尚未推送（等待确认）

## ⏭ 下一步建议

---

## 🔑 关键文件索引

### 本期产出（`/Users/Admin/三件套输出/`）

| 文件 | 说明 |
|------|------|
| `01/02/03_*_公众号文章.md` | 3篇公众号发布稿（草稿箱已推送） |
| `01/02/03_*_网站文章.md` | 3篇网站深度文章（已上线） |
| `01/02/03_*_投资人行动清单.md` | 3份PE行动清单 |
| `04_冷却液材料赛道PE投资视角_完整报告.md` | 冷却液材料PE报告（新） |
| `05_AIDC绿电一体化PE投资视角_完整报告.md` | AIDC绿电PE报告（新） |
| `跨赛道对比_投资配置指南.md` | 三赛道评分+资产配置建议 |
| `发布行动指南.md` | 发布SOP命令参考 |
| `gen_pptx_v2.py` | V2 PPT生成器（带图表） |
| `cover_1/2/3.jpg` | 公众号封面图 |

### 工具管线

| 位置 | 用途 |
|------|------|
| `scripts/wechat_publisher.py` + `.env` | 公众号API推送至草稿箱 |
| `/Volumes/移动硬盘/personal-website/` | Astro网站源码（Cloudflare Pages） |
| `scripts/md-to-astro.mjs` | Markdown → .astro页面转换 |

---

---

## 🤖 自动化触发规则（AI 无需确认直接执行）

| 用户说 | 自动执行 |
|--------|---------|
| "发布公众号" + 文件名 | 生成封面 → `wechat_publisher.py` 推送草稿箱 |
| "部署网站" | `cd /Volumes/移动硬盘/personal-website && git add . && git commit -m "feat: deploy" && git push` |
| "全部发布" / "全部发" | 公众号 + 网站同步执行 |
| "三篇都发" | 循环 01/02/03 公众号文章 |

**不再询问** — 这些操作 SOP 在 `三件套输出/发布行动指南.md`，按指南自动执行。

## 🔄 自动心跳同步

每次完成重要任务后，自动调用以下命令更新 `state.json`：
```bash
node /Users/Admin/.workbuddy/shared-workspace/scripts/sync-state.mjs opencode idle "任务完成" "产出摘要"
```

state.json 路径：`/Users/Admin/.workbuddy/shared-workspace/context/state.json`
WorkBuddy 通过 state-watcher.mjs 实时感知 OpenCode 状态变化。

---

## 🧠 共享大脑 v3 使用规范

### 会话开始时（OpenCode 启动流程）

收到"继续"指令后，按此顺序加载：

```bash
# ⚠️ 第0步（必须）: 读 SYSTEM_CORE.md — 所有固化的优化和迭代
read SYSTEM_CORE.md

# 第1步（必须）: 读取 state.json → 当前管线状态
read ~/.workbuddy/shared-workspace/context/state.json

# 第2步（必须）: 读取 brain/decisions.json → 关键决策（定位、策略、所有已固化规则）
read ~/.workbuddy/shared-workspace/brain/decisions.json

# 第3步（必须）: 读取 brain/user-preferences.json → 用户偏好（写作风格、数据源）
read ~/.workbuddy/shared-workspace/brain/user-preferences.json

# 第4步（建议）: 读取 brain/handoff/ 最新文件 → WorkBuddy 完成的交接
ls -t ~/.workbuddy/shared-workspace/brain/handoff/

# 第5步（建议）: 读取 brain/context-log.json 最后 5 条 → 最近操作
tail -5 ~/.workbuddy/shared-workspace/brain/context-log.json
```

### 会话结束时（OpenCode 关闭流程）

```bash
# 1. 更新 state.json
node .workbuddy/shared-workspace/scripts/sync-state.mjs opencode idle "冷却液材料三件套完成" "公众号+网站+PPT"

# 2. 如有交接 → 创建 handoff 包
node .workbuddy/shared-workspace/brain/create-handoff.mjs \
  --from opencode --to workbuddy \
  --topic "冷却液材料" \
  --summary "三件套全部完成，需要可视化+归档" \
  --task "生成市场规模柱状图" \
  --task "归档到腾讯文档"

# 3. 如有任务需 WorkBuddy 执行 → 加入 task-queue
# （queue 添加通过 create-handoff.mjs 自动完成）

# 4. 记录会话日志
node .workbuddy/shared-workspace/brain/log-session.mjs opencode \
  "ses_xxx" "三件套生产" "冷却液材料 公众号+网站+PPT"
```

### 从 WorkBuddy 切回 OpenCode 时

WorkBuddy 会写 handoff 和 task-queue。OpenCode 启动时执行"会话开始时"的流程即可自动接上。

**不需要用户重新解释上下文。**

---

## 📡 信号通知（Signals）

除了脑文件，还有信号文件用于轻量级通知：

| 信号文件 | 用途 |
|:---------|:-----|
| `signals/workbuddy/` | OpenCode 放文件 → WorkBuddy 检测到后处理 |
| `signals/opencode/` | WorkBuddy 放文件 → OpenCode 启动时读取 |

信号文件名格式：`{timestamp}_{action}.signal`
内容：JSON 格式的通知内容。

*最后更新：2026-06-14 | 更新人：Sisyphus*
