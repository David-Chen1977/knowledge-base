import{_ as a,o as n,c as p,a2 as t}from"./chunks/framework.DnrXFDHb.js";const k=JSON.parse('{"title":"智算中心节能用能体系 · 深度分析","description":"","frontmatter":{"updated":"2026-06-23T00:00:00.000Z","visibility":"public"},"headers":[],"relativePath":"算电协同/节能用能体系深度分析.md","filePath":"算电协同/节能用能体系深度分析.md","lastUpdated":1781535932000}'),l={name:"算电协同/节能用能体系深度分析.md"};function i(e,s,d,h,c,r){return n(),p("div",null,[...s[0]||(s[0]=[t(`<h1 id="智算中心节能用能体系-·-深度分析" tabindex="-1">智算中心节能用能体系 · 深度分析 <a class="header-anchor" href="#智算中心节能用能体系-·-深度分析" aria-label="Permalink to &quot;智算中心节能用能体系 · 深度分析&quot;">​</a></h1><p><strong>分析日期：</strong> 2026-06-12 | <strong>版本：</strong> v1.0 <strong>分析视角：</strong> PE/VC 一级股权投资 + 产业开发 <strong>关联文件：</strong> <code>MOC-赛道交叉图.md</code> <code>算电协同/赛道总览.md</code> <code>算电协同/投资逻辑.md</code></p><hr><h2 id="摘要" tabindex="-1">摘要 <a class="header-anchor" href="#摘要" aria-label="Permalink to &quot;摘要&quot;">​</a></h2><p>智算中心节能用能体系正从&quot;成本中心&quot;转变为&quot;竞争力核心&quot;。2026年，三大结构性变化同时发生：</p><ol><li><strong>政策强制</strong>：国家枢纽节点新建数据中心绿电占比≥80%，PUE&lt;1.25 成为硬约束</li><li><strong>技术拐点</strong>：NVIDIA Rubin 系列 100% 全液冷，液冷从可选变为标配</li><li><strong>商业闭环</strong>：数据中心参与电力现货市场首单落地（2026年5月，广东），&quot;算随电调&quot;模式验证</li></ol><p>以下从五个维度展开深度分析。</p><hr><h2 id="一、节能用能体系-·-系统架构" tabindex="-1">一、节能用能体系 · 系统架构 <a class="header-anchor" href="#一、节能用能体系-·-系统架构" aria-label="Permalink to &quot;一、节能用能体系 · 系统架构&quot;">​</a></h2><h3 id="_1-1-三层架构模型" tabindex="-1">1.1 三层架构模型 <a class="header-anchor" href="#_1-1-三层架构模型" aria-label="Permalink to &quot;1.1 三层架构模型&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>┌─────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│              第一层：IT 设备级能效（芯片→服务器）              │</span></span>
<span class="line"><span>│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │</span></span>
<span class="line"><span>│  │ 低功耗    │  │ 液冷散热  │  │ 智能      │  │ 算力     │   │</span></span>
<span class="line"><span>│  │ AI芯片    │  │ (冷板/浸没)│  │ 功耗管理  │  │ 调度软件 │   │</span></span>
<span class="line"><span>│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │</span></span>
<span class="line"><span>│  核心目标：每瓦特产出最大 Tokens                             │</span></span>
<span class="line"><span>├─────────────────────────────────────────────────────────────┤</span></span>
<span class="line"><span>│              第二层：设施级能效（供电→制冷→建筑）              │</span></span>
<span class="line"><span>│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │</span></span>
<span class="line"><span>│  │ 高效      │  │ 储能系统  │  │  AI 制冷  │  │ 余热     │   │</span></span>
<span class="line"><span>│  │ UPS/配电  │  │ (备电+调峰)│  │  优化     │  │ 回收     │   │</span></span>
<span class="line"><span>│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │</span></span>
<span class="line"><span>│  核心目标：PUE &lt; 1.2，降低 overhead 能耗                      │</span></span>
<span class="line"><span>├─────────────────────────────────────────────────────────────┤</span></span>
<span class="line"><span>│              第三层：系统级能效（源网荷储一体化）                │</span></span>
<span class="line"><span>│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │</span></span>
<span class="line"><span>│  │ 绿电直供  │  │ VPP 聚合  │  │ 电力现货  │  │ 碳管理   │   │</span></span>
<span class="line"><span>│  │ (PPA/专线)│  │ 需求响应  │  │  交易     │  │ 资产化   │   │</span></span>
<span class="line"><span>│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │</span></span>
<span class="line"><span>│  核心目标：综合用电成本降低 20-40% + 绿电占比 &gt;80%            │</span></span>
<span class="line"><span>└─────────────────────────────────────────────────────────────┘</span></span></code></pre></div><h3 id="_1-2-关键能效指标" tabindex="-1">1.2 关键能效指标 <a class="header-anchor" href="#_1-2-关键能效指标" aria-label="Permalink to &quot;1.2 关键能效指标&quot;">​</a></h3><table tabindex="0"><thead><tr><th>指标</th><th>行业平均</th><th>先进水平</th><th>极致水平</th><th>对 IRR 影响</th></tr></thead><tbody><tr><td>PUE</td><td>1.5-1.6</td><td>1.2-1.3</td><td>&lt;1.1（液冷）</td><td>PUE 每降 0.1 → 电费降 6-8%</td></tr><tr><td>绿电占比</td><td>20-30%</td><td>50-60%</td><td>&gt;80%（政策强制）</td><td>绿电比火电便宜 0.1-0.3 元/kWh</td></tr><tr><td>液冷渗透率</td><td>15-20%</td><td>50%+（新建）</td><td>100%（新建）</td><td>液冷比风冷省电 30-50%</td></tr><tr><td>负载利用率</td><td>30-50%</td><td>60-70%</td><td>80%+（智能调度）</td><td>利用率提升→单位算力成本下降</td></tr><tr><td>参与需求响应</td><td>试点</td><td>常态化</td><td>主力调节资源</td><td>年收益 = 容量费 + 电量费</td></tr></tbody></table><h3 id="_1-3-节能用能体系设计原则" tabindex="-1">1.3 节能用能体系设计原则 <a class="header-anchor" href="#_1-3-节能用能体系设计原则" aria-label="Permalink to &quot;1.3 节能用能体系设计原则&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>原则一：系统最优 &gt; 单点最优</span></span>
<span class="line"><span>  芯片节能 + 液冷散热 + 绿电直供 + 储能调峰 + AI调度 = 整体最优</span></span>
<span class="line"><span>  不能只盯着 PUE，要看综合度电算力产出（Tokens/kWh）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>原则二：算力负载是最大的可调资源</span></span>
<span class="line"><span>  训练任务可中断/可迁移 → 天然柔性负荷</span></span>
<span class="line"><span>  通过&quot;算随电调&quot;参与电力市场 → 从成本变收益</span></span>
<span class="line"><span></span></span>
<span class="line"><span>原则三：绿电直供 + 储能是基础设施</span></span>
<span class="line"><span>  没有绿电，PUE 再低也过不了政策关</span></span>
<span class="line"><span>  没有储能，需求响应和电力交易做不起来</span></span></code></pre></div><hr><h2 id="二、产业链全景与价值分布" tabindex="-1">二、产业链全景与价值分布 <a class="header-anchor" href="#二、产业链全景与价值分布" aria-label="Permalink to &quot;二、产业链全景与价值分布&quot;">​</a></h2><h3 id="_2-1-产业链拆解-7个环节" tabindex="-1">2.1 产业链拆解（7个环节） <a class="header-anchor" href="#_2-1-产业链拆解-7个环节" aria-label="Permalink to &quot;2.1 产业链拆解（7个环节）&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>环节 1                 环节 2                 环节 3                 环节 4</span></span>
<span class="line"><span>┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐</span></span>
<span class="line"><span>│ AI 低功耗芯片 │  →   │ 液冷散热系统  │  →   │ 高效供电配电  │  →   │ 储能系统     │</span></span>
<span class="line"><span>│ 推理 ASIC    │      │ 冷板式(主流)  │      │ 高压直挂 HVDC│      │ LFP 电池柜   │</span></span>
<span class="line"><span>│ 存算一体     │      │ 浸没式(下一代) │      │ 高效 UPS     │      │ 液流电池     │</span></span>
<span class="line"><span>│ 光子计算(远期)│      │ CDU/管路/冷板 │      │ 智能配电柜   │      │ (长时储能)   │</span></span>
<span class="line"><span>│              │      │ 冷却液(氟化液) │      │ 固态变压器   │      │              │</span></span>
<span class="line"><span>│ 国产替代窗口  │      │ 国产化率 &gt;60%  │      │ 高压直挂是    │      │ 备电 + 调峰  │</span></span>
<span class="line"><span>│ 流片生态瓶颈  │      │ 冷板竞争激烈   │      │ 创新方向      │      │ 双用途       │</span></span>
<span class="line"><span>└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘</span></span>
<span class="line"><span>       ↓                     ↓                     ↓                     ↓</span></span>
<span class="line"><span>┌───────────────────────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                              环节 5：智算中心集成运营                           │</span></span>
<span class="line"><span>│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │</span></span>
<span class="line"><span>│  │ 传统 IDC     │  │ 源网荷储一体化 │  │ 分布式算力仓  │  │ 算力租赁/    │       │</span></span>
<span class="line"><span>│  │ 运营商       │  │ (自建新能源)   │  │ (边缘部署)    │  │ 算力调度     │       │</span></span>
<span class="line"><span>│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘       │</span></span>
<span class="line"><span>└───────────────────────────────────────────────────────────────────────────────┘</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>┌───────────────────────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                    环节 6：能效优化服务（轻资产/平台）                         │</span></span>
<span class="line"><span>│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │</span></span>
<span class="line"><span>│  │ AI 制冷优化  │  │ VPP 聚合      │  │ 电力交易 AI  │  │ 能碳管理     │       │</span></span>
<span class="line"><span>│  │ (Phaidra 等) │  │ 需求响应平台  │  │ 报价策略     │  │ SaaS        │       │</span></span>
<span class="line"><span>│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘       │</span></span>
<span class="line"><span>└───────────────────────────────────────────────────────────────────────────────┘</span></span>
<span class="line"><span>       ↓</span></span>
<span class="line"><span>┌───────────────────────────────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                    环节 7：下游（算力消费方）                                   │</span></span>
<span class="line"><span>│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │</span></span>
<span class="line"><span>│  │ AI 大模型    │  │ 云服务商      │  │ 政企客户      │  │ AI 应用      │       │</span></span>
<span class="line"><span>│  │ 训练/推理    │  │ (阿里/字节)   │  │ (金融/政府)   │  │ 创业公司     │       │</span></span>
<span class="line"><span>│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘       │</span></span>
<span class="line"><span>└───────────────────────────────────────────────────────────────────────────────┘</span></span></code></pre></div><h3 id="_2-2-价值分布与利润池" tabindex="-1">2.2 价值分布与利润池 <a class="header-anchor" href="#_2-2-价值分布与利润池" aria-label="Permalink to &quot;2.2 价值分布与利润池&quot;">​</a></h3><table tabindex="0"><thead><tr><th>环节</th><th>商业模式</th><th>毛利率</th><th>资本密度</th><th>可规模化</th><th>PE/VC 适合度</th></tr></thead><tbody><tr><td>① AI 低功耗芯片</td><td>芯片销售</td><td>50-60%</td><td>极高</td><td>中（流片瓶颈）</td><td>⭐⭐⭐</td></tr><tr><td>② 液冷散热系统</td><td>设备+方案</td><td>25-40%</td><td>中</td><td>高</td><td>⭐⭐⭐</td></tr><tr><td>③ 高效供电配电</td><td>设备销售</td><td>20-30%</td><td>中</td><td>高</td><td>⭐⭐</td></tr><tr><td>④ 储能系统</td><td>设备+运维</td><td>15-25%</td><td>高</td><td>高</td><td>⭐⭐</td></tr><tr><td>⑤ 智算中心运营</td><td>机柜租赁/算力服务</td><td>30-50%</td><td>极高</td><td>中</td><td>⭐⭐⭐</td></tr><tr><td>⑥ <strong>能效优化服务</strong></td><td>SaaS/分成</td><td><strong>60-80%</strong></td><td>低</td><td><strong>极高</strong></td><td>⭐⭐⭐⭐⭐</td></tr><tr><td>⑦ 下游算力消费</td><td>模型/云服务</td><td>40-70%</td><td>中</td><td>高</td><td>⭐⭐⭐⭐</td></tr></tbody></table><p><strong>核心判断：价值最高的环节在⑥（能效优化服务），其次是⑦（下游应用），最重的在⑤（运营）。</strong></p><h3 id="_2-3-关键细分赛道价值评估" tabindex="-1">2.3 关键细分赛道价值评估 <a class="header-anchor" href="#_2-3-关键细分赛道价值评估" aria-label="Permalink to &quot;2.3 关键细分赛道价值评估&quot;">​</a></h3><table tabindex="0"><thead><tr><th>细分方向</th><th>市场规模 2026E</th><th>CAGR</th><th>竞争格局</th><th>进入壁垒</th><th>投资评级</th></tr></thead><tbody><tr><td>液冷散热（整体）</td><td>50-80亿 RMB</td><td>45%+</td><td>英维克/曙光数创/高澜 三龙头</td><td>客户验证</td><td>⭐⭐⭐</td></tr><tr><td>浸没式液冷</td><td>10-20亿</td><td>60%+</td><td>早期，多家竞跑</td><td>技术+安全</td><td>⭐⭐⭐⭐</td></tr><tr><td>AI 制冷优化平台（Phaidra 模式）</td><td>2-5亿</td><td>80%+</td><td>全球蓝海，国内空白</td><td>算法+数据</td><td>⭐⭐⭐⭐⭐</td></tr><tr><td>VPP 聚合数据中心</td><td>5-10亿</td><td>60%+</td><td>电享/浙达/瓦特</td><td>客户关系</td><td>⭐⭐⭐⭐⭐</td></tr><tr><td>电力交易 AI 报价</td><td>2-5亿</td><td>70%+</td><td>清大科越/瓦特</td><td>算法+牌照</td><td>⭐⭐⭐⭐⭐</td></tr><tr><td>算力调度平台</td><td>10-20亿</td><td>50%+</td><td>算力互联/星链</td><td>网络效应</td><td>⭐⭐⭐⭐</td></tr><tr><td>数据中心储能（备电+调峰）</td><td>20-30亿</td><td>40%+</td><td>双登/华为/阳光</td><td>资质+安全</td><td>⭐⭐⭐</td></tr><tr><td>绿电 PPA 交易服务</td><td>1-3亿</td><td>100%+</td><td>中网联合等</td><td>牌照+资源</td><td>⭐⭐⭐⭐</td></tr><tr><td>能碳管理 SaaS</td><td>3-5亿</td><td>50%+</td><td>碳阻迹/妙盈</td><td>合规驱动</td><td>⭐⭐⭐</td></tr></tbody></table><hr><h2 id="三、商业模式设计" tabindex="-1">三、商业模式设计 <a class="header-anchor" href="#三、商业模式设计" aria-label="Permalink to &quot;三、商业模式设计&quot;">​</a></h2><h3 id="_3-1-五种可行的商业模式" tabindex="-1">3.1 五种可行的商业模式 <a class="header-anchor" href="#_3-1-五种可行的商业模式" aria-label="Permalink to &quot;3.1 五种可行的商业模式&quot;">​</a></h3><h4 id="模式-a-源网荷储一体化-重资产型" tabindex="-1">模式 A：源网荷储一体化（重资产型） <a class="header-anchor" href="#模式-a-源网荷储一体化-重资产型" aria-label="Permalink to &quot;模式 A：源网荷储一体化（重资产型）&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>逻辑：自建风光+储能+数据中心 = 自平衡微电网</span></span>
<span class="line"><span>收益来源：节省电费 + 绿电消纳收益 + 碳资产</span></span>
<span class="line"><span>代表案例：乌兰察布中金数据（45MW/180MWh, 年省8.48亿kWh绿电）</span></span>
<span class="line"><span>适用：大型项目 (&gt;100MW 算力)、有资源整合能力的企业</span></span>
<span class="line"><span></span></span>
<span class="line"><span>财务模型：</span></span>
<span class="line"><span>  总投资：10-30亿 RMB（含新能源+储能+数据中心）</span></span>
<span class="line"><span>  收入：机柜租赁 + 节省电费 + 碳交易</span></span>
<span class="line"><span>  IRR 估算：6-10%（取决于当地电价和绿电资源）</span></span>
<span class="line"><span>  回收期：6-10 年</span></span>
<span class="line"><span>  风险：重资产、政策变化、绿电出力波动</span></span></code></pre></div><h4 id="模式-b-分布式算力仓-绿电直供-中资产型" tabindex="-1">模式 B：分布式算力仓 + 绿电直供（中资产型） <a class="header-anchor" href="#模式-b-分布式算力仓-绿电直供-中资产型" aria-label="Permalink to &quot;模式 B：分布式算力仓 + 绿电直供（中资产型）&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>逻辑：在绿电富集区部署模块化算力仓，就近消纳弃风弃光</span></span>
<span class="line"><span>收益来源：算力租赁 + 绿电价差 + 需求响应</span></span>
<span class="line"><span>代表案例：汇竑资本 × 寰晟电力 × 恒密算力（内蒙/毕节）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>财务模型：</span></span>
<span class="line"><span>  单仓投资：5000万-2亿 RMB（含硬件+配电+液冷）</span></span>
<span class="line"><span>  收入：GPU 租赁收入 2-5元/卡时</span></span>
<span class="line"><span>  绿电价差收益：比东部便宜 0.3-0.5 元/kWh</span></span>
<span class="line"><span>  IRR 估算：12-18%</span></span>
<span class="line"><span>  回收期：4-6 年</span></span>
<span class="line"><span>  优势：模块化可复制，选址灵活</span></span>
<span class="line"><span>  风险：GPU 折旧快、网络延迟限制场景</span></span></code></pre></div><h4 id="模式-c-能效优化-saas-轻资产平台型" tabindex="-1">模式 C：能效优化 SaaS（轻资产平台型） <a class="header-anchor" href="#模式-c-能效优化-saas-轻资产平台型" aria-label="Permalink to &quot;模式 C：能效优化 SaaS（轻资产平台型）&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>逻辑：AI 优化数据中心制冷/用电/交易，按节省电费分成</span></span>
<span class="line"><span>收益来源：SaaS 订阅费 / 节能效果分成 / 电力交易佣金</span></span>
<span class="line"><span>代表公司：海外 Phaidra（已为 Google 降低 30% 制冷能耗）</span></span>
<span class="line"><span>                     国内空白市场</span></span>
<span class="line"><span></span></span>
<span class="line"><span>财务模型：</span></span>
<span class="line"><span>  定价：按管理算力规模收费，或按节省电费 20-30% 分成</span></span>
<span class="line"><span>  单客户 ARPU：50-200万/年（中型智算中心）</span></span>
<span class="line"><span>  毛利率：60-80%</span></span>
<span class="line"><span>  IRR 估算：30%+（纯软件）</span></span>
<span class="line"><span>  优势：轻资产、高毛利、网络效应</span></span>
<span class="line"><span>  壁垒：算法精度 ≥90%、客户信任、跨平台适配</span></span></code></pre></div><h4 id="模式-d-vpp-聚合-电力交易-平台型" tabindex="-1">模式 D：VPP 聚合 + 电力交易（平台型） <a class="header-anchor" href="#模式-d-vpp-聚合-电力交易-平台型" aria-label="Permalink to &quot;模式 D：VPP 聚合 + 电力交易（平台型）&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>逻辑：聚合多个数据中心负荷，统一参与电力市场</span></span>
<span class="line"><span>收益来源：需求响应补贴 + 现货市场价差 + 调频服务费</span></span>
<span class="line"><span>最新里程碑：2026年5月广东联通/移动数据中心首单VPP现货交易</span></span>
<span class="line"><span></span></span>
<span class="line"><span>财务模型：</span></span>
<span class="line"><span>  聚合规模门槛：&gt;10MW 可调容量</span></span>
<span class="line"><span>  单 MW 年收益：10-30万（需求响应 + 辅助服务）</span></span>
<span class="line"><span>  聚合 100MW → 年营收 1000-3000万</span></span>
<span class="line"><span>  毛利率：40-60%</span></span>
<span class="line"><span>  IRR 估算：20-30%</span></span>
<span class="line"><span>  壁垒：客户资源 &gt; 技术（电网关系是核心）</span></span>
<span class="line"><span>  风险：政策变动、客户流失</span></span></code></pre></div><h4 id="模式-e-存量数据中心节能改造-服务型" tabindex="-1">模式 E：存量数据中心节能改造（服务型） <a class="header-anchor" href="#模式-e-存量数据中心节能改造-服务型" aria-label="Permalink to &quot;模式 E：存量数据中心节能改造（服务型）&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>逻辑：对&quot;老旧小散&quot;数据中心做液冷改造 + 能效优化</span></span>
<span class="line"><span>收益来源：EPC 工程 + 节能效果分成</span></span>
<span class="line"><span>政策驱动：国家数据局明确要求推进存量改造</span></span>
<span class="line"><span></span></span>
<span class="line"><span>财务模型：</span></span>
<span class="line"><span>  单项目改造投资：500-5000万（取决于规模）</span></span>
<span class="line"><span>  节能效果：PUE 1.5 → 1.2，省电 20-25%</span></span>
<span class="line"><span>  回收期：2-4 年</span></span>
<span class="line"><span>  IRR 估算：15-25%</span></span>
<span class="line"><span>  优势：政策强推、需求确定性强</span></span>
<span class="line"><span>  壁垒：改造方案的安全性和可靠性验证</span></span></code></pre></div><h3 id="_3-2-模式对比与选择" tabindex="-1">3.2 模式对比与选择 <a class="header-anchor" href="#_3-2-模式对比与选择" aria-label="Permalink to &quot;3.2 模式对比与选择&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>             轻资产 ←──────────→ 重资产</span></span>
<span class="line"><span>             </span></span>
<span class="line"><span>  高毛利    模式 C              模式 A</span></span>
<span class="line"><span>  低门槛    (能效SaaS)          (源网荷储)</span></span>
<span class="line"><span>             ↑                   ↑</span></span>
<span class="line"><span>             最适合 PE/VC         适合产业资本</span></span>
<span class="line"><span>             </span></span>
<span class="line"><span>  中毛利    模式 D              模式 B</span></span>
<span class="line"><span>  中门槛    (VPP聚合)           (分布式算力仓)</span></span>
<span class="line"><span>             ↑                   ↑</span></span>
<span class="line"><span>             目前窗口期           汇竑模式验证中</span></span>
<span class="line"><span>             </span></span>
<span class="line"><span>  低毛利    模式 E               -</span></span>
<span class="line"><span>  高门槛    (改造服务)           </span></span>
<span class="line"><span>             政策驱动型            -</span></span></code></pre></div><p><strong>对 PE/VC 的建议排序：</strong> C &gt; D &gt; B &gt; E &gt; A</p><hr><h2 id="四、投资价值评估框架" tabindex="-1">四、投资价值评估框架 <a class="header-anchor" href="#四、投资价值评估框架" aria-label="Permalink to &quot;四、投资价值评估框架&quot;">​</a></h2><h3 id="_4-1-赛道成熟度判断" tabindex="-1">4.1 赛道成熟度判断 <a class="header-anchor" href="#_4-1-赛道成熟度判断" aria-label="Permalink to &quot;4.1 赛道成熟度判断&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>                  萌芽期         成长期         成熟期</span></span>
<span class="line"><span>                  2024          2025-2027      2028+</span></span>
<span class="line"><span>                      │             │             │</span></span>
<span class="line"><span>  液冷散热             │████████████████████████    │ 冷板成熟</span></span>
<span class="line"><span>  浸没式液冷           │████████                      │ 早期</span></span>
<span class="line"><span>  AI制冷优化           │███                           │ 全球空白</span></span>
<span class="line"><span>  VPP聚合数据中心      │████████                      │ 首单验证</span></span>
<span class="line"><span>  电力交易AI           │███████████                   │ 窗口期</span></span>
<span class="line"><span>  源网荷储一体化        │██████████                    │ 示范期</span></span>
<span class="line"><span>  绿电直供             │████████████                  │ 政策强制</span></span></code></pre></div><p><strong>核心判断：当前（2026年6月）处于早期成长期，未来 12-18 个月是窗口期。</strong></p><h3 id="_4-2-投资标的价值评估框架" tabindex="-1">4.2 投资标的价值评估框架 <a class="header-anchor" href="#_4-2-投资标的价值评估框架" aria-label="Permalink to &quot;4.2 投资标的价值评估框架&quot;">​</a></h3><div class="language-markdown vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">## DD 评估矩阵（5 个维度 × 5 分制）</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### 维度 1：技术壁垒（权重 25%）</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 专利/IP 数量与质量</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 是否可被大厂复制（BAT/华为 会不会自己做）</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 数据飞轮效应（使用越多→模型越准→壁垒越高？）</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 跨平台兼容性（只能适配一种 GPU 还是一切 GPU？）</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### 维度 2：商业模式（权重 25%）</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 收入模式：项目制 vs SaaS 订阅 vs 效果分成</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 客户粘性：替换成本高不高？</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 可规模化：从第 1 个客户到第 100 个客户的难度</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 毛利率：&gt;50% 加分，&lt;30% 减分</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### 维度 3：市场时机（权重 20%）</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 是否处于政策爆发前夜</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 有无标杆案例验证 PMF</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 竞争格局：蓝海 vs 红海</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 壁垒随时间递增还是递减</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### 维度 4：团队（权重 20%）</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 有没有既懂电力又懂 AI 的复合人才？</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 有没有电网/数据中心行业资源？</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 有没有大厂/创业经历？</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">### 维度 5：退出路径（权重 10%）</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 能否独立 IPO？（科创板？）</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 被收购可能性：能源公司？科技公司？运营商？</span></span>
<span class="line"><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">-</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> 并购估值倍数参考</span></span></code></pre></div><h3 id="_4-3-当前市场估值参考-更新版" tabindex="-1">4.3 当前市场估值参考（更新版） <a class="header-anchor" href="#_4-3-当前市场估值参考-更新版" aria-label="Permalink to &quot;4.3 当前市场估值参考（更新版）&quot;">​</a></h3><table tabindex="0"><thead><tr><th>细分方向</th><th>阶段</th><th>估值范围</th><th>估值逻辑</th><th>对比海外</th></tr></thead><tbody><tr><td>AI 制冷优化 SaaS</td><td>种子-A</td><td>3000万-1.5亿</td><td>技术团队 + 概念验证</td><td>Phaidra 估值 &gt;5亿 USD</td></tr><tr><td>VPP 聚合平台</td><td>A-B</td><td>1-5亿</td><td>聚合资源量 + 交易能力</td><td>无直接对标</td></tr><tr><td>电力交易 AI</td><td>A-B</td><td>1-3亿</td><td>策略夏普比率 + 交易量</td><td>可比 less</td></tr><tr><td>液冷方案（冷板）</td><td>B-C</td><td>5-20亿</td><td>客户数 + 收入规模</td><td>CoolIT 估值 ~10亿 USD</td></tr><tr><td>液冷方案（浸没式）</td><td>A-B</td><td>1-5亿</td><td>技术里程碑</td><td>多家海外</td></tr><tr><td>算力调度平台</td><td>A-B</td><td>2-8亿</td><td>签约算力规模</td><td>无直接对标</td></tr><tr><td>分布式算力仓运营</td><td>A-B</td><td>2-10亿</td><td>GPU 规模 + 利用率</td><td>CoreWeave 估值 &gt;100亿 USD</td></tr></tbody></table><h3 id="_4-4-关键风险" tabindex="-1">4.4 关键风险 <a class="header-anchor" href="#_4-4-关键风险" aria-label="Permalink to &quot;4.4 关键风险&quot;">​</a></h3><table tabindex="0"><thead><tr><th>风险类型</th><th>具体风险</th><th>概率</th><th>影响</th><th>缓释方式</th></tr></thead><tbody><tr><td>政策风险</td><td>电改 2.0 进度不及预期</td><td>中</td><td>高</td><td>选择政策确定性强省份（广东/浙江/江苏）</td></tr><tr><td>技术风险</td><td>液冷技术路线未收敛</td><td>中</td><td>中</td><td>投冷板（确定性强），不赌浸没式</td></tr><tr><td>竞争风险</td><td>BAT/华为 自研能效方案</td><td>高</td><td>高</td><td>选 BAT 不会做的（电力交易/改造服务）</td></tr><tr><td>市场风险</td><td>数据中心建设放缓</td><td>低</td><td>高</td><td>聚焦存量改造+分布式</td></tr><tr><td>产业链风险</td><td>GPU 缺货限制算力中心建设</td><td>中-高</td><td>中</td><td>关注国产芯片替代窗口</td></tr></tbody></table><hr><h2 id="五、开发策略-·-投资策略-·-运营策略" tabindex="-1">五、开发策略 · 投资策略 · 运营策略 <a class="header-anchor" href="#五、开发策略-·-投资策略-·-运营策略" aria-label="Permalink to &quot;五、开发策略 · 投资策略 · 运营策略&quot;">​</a></h2><h3 id="_5-1-开发策略-如何建智算中心" tabindex="-1">5.1 开发策略（如何建智算中心） <a class="header-anchor" href="#_5-1-开发策略-如何建智算中心" aria-label="Permalink to &quot;5.1 开发策略（如何建智算中心）&quot;">​</a></h3><h4 id="选址原则-按优先级排序" tabindex="-1">选址原则（按优先级排序） <a class="header-anchor" href="#选址原则-按优先级排序" aria-label="Permalink to &quot;选址原则（按优先级排序）&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>P0: 靠近绿电（内蒙/宁夏/甘肃/新疆）→ 电价 0.2-0.3 元/kWh</span></span>
<span class="line"><span>P1: 靠近客户（一线城市周边）→ 时延敏感型推理</span></span>
<span class="line"><span>P2: 气候冷凉（自然冷却）→ 降低制冷能耗</span></span>
<span class="line"><span>P3: 政策支持（能耗指标+补贴）→ 射阳/广州已有案例</span></span>
<span class="line"><span>P4: 存量机房改造 → 审批快、周期短</span></span></code></pre></div><h4 id="用能体系开发路线" tabindex="-1">用能体系开发路线 <a class="header-anchor" href="#用能体系开发路线" aria-label="Permalink to &quot;用能体系开发路线&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>短期（0-6个月）：</span></span>
<span class="line"><span>  - 液冷改造（冷板式，PUE 1.5→1.2）</span></span>
<span class="line"><span>  - 安装储能（备电+调峰双用途）</span></span>
<span class="line"><span>  - 接入 VPP 平台（跑通需求响应收益）</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>中期（6-18个月）：</span></span>
<span class="line"><span>  - 绿电 PPA 合同签订（锁定低价绿电）</span></span>
<span class="line"><span>  - AI 制冷优化系统部署（目标 PUE &lt; 1.15）</span></span>
<span class="line"><span>  - 参与电力现货市场（AI 报价策略）</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>长期（18-36个月）：</span></span>
<span class="line"><span>  - 源网荷储一体化（自建风光储）</span></span>
<span class="line"><span>  - 余热回收（供热/供冷城市管网）</span></span>
<span class="line"><span>  - 算电碳协同（碳资产交易）</span></span></code></pre></div><h3 id="_5-2-投资策略-如何投" tabindex="-1">5.2 投资策略（如何投） <a class="header-anchor" href="#_5-2-投资策略-如何投" aria-label="Permalink to &quot;5.2 投资策略（如何投）&quot;">​</a></h3><h4 id="组合配置建议" tabindex="-1">组合配置建议 <a class="header-anchor" href="#组合配置建议" aria-label="Permalink to &quot;组合配置建议&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>┌────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│  投资组合：1亿 RMB（示意）                          │</span></span>
<span class="line"><span>│                                                    │</span></span>
<span class="line"><span>│  P0 (40%)：能效优化 SaaS + VPP 聚合平台             │</span></span>
<span class="line"><span>│   ├─ AI 制冷优化平台（类似 Phaidra）：2000万        │</span></span>
<span class="line"><span>│   └─ VPP 聚合数据中心平台：2000万                   │</span></span>
<span class="line"><span>│                                                    │</span></span>
<span class="line"><span>│  P1 (30%)：电力交易 AI + 算力调度平台               │</span></span>
<span class="line"><span>│   ├─ 电力交易 AI 报价：1500万                        │</span></span>
<span class="line"><span>│   └─ 算力调度平台：1500万                           │</span></span>
<span class="line"><span>│                                                    │</span></span>
<span class="line"><span>│  P2 (20%)：液冷方案（浸没式）+ 分布式算力仓           │</span></span>
<span class="line"><span>│   ├─ 浸没式液冷技术：1000万                         │</span></span>
<span class="line"><span>│   └─ 分布式算力仓运营（参股）：1000万                │</span></span>
<span class="line"><span>│                                                    │</span></span>
<span class="line"><span>│  P3 (10%)：早期布局（光子计算/固态电池）             │</span></span>
<span class="line"><span>│   └─ 极早期技术：1000万                             │</span></span>
<span class="line"><span>└────────────────────────────────────────────────────┘</span></span></code></pre></div><h4 id="筛选标准" tabindex="-1">筛选标准 <a class="header-anchor" href="#筛选标准" aria-label="Permalink to &quot;筛选标准&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>必须满足的条件（硬性门槛）：</span></span>
<span class="line"><span>  □ 已有至少 1 个付费客户（非试点合同）</span></span>
<span class="line"><span>  □ 团队有电力 + AI 复合背景</span></span>
<span class="line"><span>  □ 毛利率 &gt;50%（软件）或 &gt;25%（硬件）</span></span>
<span class="line"><span>  □ 替换成本高/客户粘性强</span></span>
<span class="line"><span></span></span>
<span class="line"><span>加分项（不为必须，但多一个多一分）：</span></span>
<span class="line"><span>  + 有电网/数据中心行业资源</span></span>
<span class="line"><span>  + 数据飞轮效应明显</span></span>
<span class="line"><span>  + 电力交易牌照或接入资质</span></span>
<span class="line"><span>  + 国产替代（信创）概念</span></span>
<span class="line"><span>  + 已有海外对标成功案例</span></span></code></pre></div><h3 id="_5-3-运营策略-如何管" tabindex="-1">5.3 运营策略（如何管） <a class="header-anchor" href="#_5-3-运营策略-如何管" aria-label="Permalink to &quot;5.3 运营策略（如何管）&quot;">​</a></h3><h4 id="能效-kpi-体系" tabindex="-1">能效 KPI 体系 <a class="header-anchor" href="#能效-kpi-体系" aria-label="Permalink to &quot;能效 KPI 体系&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>核心指标（月报）：</span></span>
<span class="line"><span>  - PUE（目标 &lt; 1.2）</span></span>
<span class="line"><span>  - 绿电占比（目标 &gt; 80%）</span></span>
<span class="line"><span>  - 单位算力能耗（kWh/PFLOPS）</span></span>
<span class="line"><span>  - 需求响应月收益（万元/MW）</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>过程指标（周报）：</span></span>
<span class="line"><span>  - 液冷系统效率（CDU 进出口温差）</span></span>
<span class="line"><span>  - AI 制冷优化执行率</span></span>
<span class="line"><span>  - 储能系统充放电效率</span></span>
<span class="line"><span>  - VPP 中标率 + 执行率</span></span>
<span class="line"><span></span></span>
<span class="line"><span>财务指标（月报）：</span></span>
<span class="line"><span>  - 综合度电成本（元/kWh）</span></span>
<span class="line"><span>  - 算力收入 / 总电费（倍率）</span></span>
<span class="line"><span>  - 碳资产收益（万元/月）</span></span></code></pre></div><h4 id="运营流程" tabindex="-1">运营流程 <a class="header-anchor" href="#运营流程" aria-label="Permalink to &quot;运营流程&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>每日：</span></span>
<span class="line"><span>  AI 制冷系统自动优化 → 无需人工干预</span></span>
<span class="line"><span></span></span>
<span class="line"><span>每周：</span></span>
<span class="line"><span>  VPP 申报（容量+报价）</span></span>
<span class="line"><span>  储能充放电策略调整</span></span>
<span class="line"><span></span></span>
<span class="line"><span>每月：</span></span>
<span class="line"><span>  能效 KPI 复盘</span></span>
<span class="line"><span>  电力市场收益对账</span></span>
<span class="line"><span>  运维巡检（液冷系统漏液检测）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>每季：</span></span>
<span class="line"><span>  绿电 PPA 合同重谈</span></span>
<span class="line"><span>  碳资产盘点</span></span>
<span class="line"><span>  算力调度策略优化</span></span></code></pre></div><h4 id="退出预案" tabindex="-1">退出预案 <a class="header-anchor" href="#退出预案" aria-label="Permalink to &quot;退出预案&quot;">​</a></h4><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>经营正常：</span></span>
<span class="line"><span>  - 持有运营，争取机柜出租率 &gt;85%</span></span>
<span class="line"><span>  - 参与电力市场获取超额收益</span></span>
<span class="line"><span>  - 碳资产交易补充利润</span></span>
<span class="line"><span></span></span>
<span class="line"><span>需要退出：</span></span>
<span class="line"><span>  退出路径 A：出售给 IDC 运营商（万国/秦淮/数据港）</span></span>
<span class="line"><span>           估值：3-6x EBITDA</span></span>
<span class="line"><span>  退出路径 B：出售给能源公司（国电投/华能/中电科）</span></span>
<span class="line"><span>           估值：5-8x EBITDA（协同溢价）</span></span>
<span class="line"><span>  退出路径 C：REITs 化（持有型资产）</span></span>
<span class="line"><span>           适合稳定运营 3 年以上的项目</span></span></code></pre></div><hr><h2 id="六、关键结论与行动建议" tabindex="-1">六、关键结论与行动建议 <a class="header-anchor" href="#六、关键结论与行动建议" aria-label="Permalink to &quot;六、关键结论与行动建议&quot;">​</a></h2><h3 id="_6-1-三句话判断" tabindex="-1">6.1 三句话判断 <a class="header-anchor" href="#_6-1-三句话判断" aria-label="Permalink to &quot;6.1 三句话判断&quot;">​</a></h3><blockquote><p><strong>第一句：&quot;双 80&quot;是硬约束不是口号——绿电占比 80% + PUE 1.25，决定了谁的节能体系好谁才能获批新建。</strong></p></blockquote><blockquote><p><strong>第二句：2026年5月广东数据中心 VPP 现货交易首单是一个&quot;按钮时刻&quot;——证伪了&quot;数据中心不能参与电力市场&quot;的假设，打开了千亿级市场。</strong></p></blockquote><blockquote><p><strong>第三句：最性感的投资不是盖数据中心（重资产低回报），而是帮数据中心省电和赚钱（轻资产高壁垒）。</strong></p></blockquote><h3 id="_6-2-对你-汇竑资本-的具体建议" tabindex="-1">6.2 对你（汇竑资本）的具体建议 <a class="header-anchor" href="#_6-2-对你-汇竑资本-的具体建议" aria-label="Permalink to &quot;6.2 对你（汇竑资本）的具体建议&quot;">​</a></h3><table tabindex="0"><thead><tr><th>时间</th><th>行动</th><th>理由</th></tr></thead><tbody><tr><td><strong>本周</strong></td><td>跟进中网联合的电改进展，确认内蒙古项目电力市场准入条件</td><td>内蒙项目落地的关键前提</td></tr><tr><td><strong>本月</strong></td><td>调研国内 AI 制冷优化 SaaS 公司（或无）→ 考虑是否内部孵化的可能</td><td>国内市场空白，第一波红利</td></tr><tr><td><strong>本月</strong></td><td>确认分布式算力仓（寰晟方案）的能耗指标获取路径</td><td>毕节项目推进关键节点</td></tr><tr><td><strong>Q3</strong></td><td>拜访已参与 VPP 现货的数据中心（韶关联通/广州移动）了解实际收益</td><td>验证模式 D 的财务模型</td></tr><tr><td><strong>Q3</strong></td><td>探索与上海电力设计院合作存量数据中心改造方案（广东旧改项目）</td><td>模式 E 落地</td></tr><tr><td><strong>Q4</strong></td><td>评估是否投资/孵化一个能效优化 SaaS 公司</td><td>轻资产、高壁垒</td></tr></tbody></table><h3 id="_6-3-需要你提供的决策" tabindex="-1">6.3 需要你提供的决策 <a class="header-anchor" href="#_6-3-需要你提供的决策" aria-label="Permalink to &quot;6.3 需要你提供的决策&quot;">​</a></h3><ol><li><strong>内蒙项目</strong>：采用自建源网荷储（重资产 IRR 6-10%）还是绿电 PPA（轻资产但电价锁定难度高）？</li><li><strong>分布式算力仓</strong>：先做内蒙集中式（快）还是毕节分布式（慢但验证新模式）？</li><li><strong>能效优化平台</strong>：外部投资还是内部孵化？（中网联合团队有能力做电力交易 AI，但制冷优化是完全不同的技术栈）</li></ol><hr><p><em>创建：2026-06-12 | 基于知识库现有材料 + 最新行业数据交叉分析</em></p>`,82)])])}const g=a(l,[["render",i]]);export{k as __pageData,g as default};
