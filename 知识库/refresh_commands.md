# 知识库刷新命令集

> 用法：在 AI 对话中说出以下任一指令即可触发对应的 MCP 数据拉取并更新知识库文件。
> MCP 工具由 AI 通过 function calling 调用，无需手动操作。

---

## 快速指令（一句话触发）

| 指令 | 覆盖文件 | 耗时 |
|------|---------|------|
| `刷新全部` | 全部 10 个数据化文件 | ~5-8min |
| `刷新赛道总览` | 电力新能源/赛道总览.md | ~1min |
| `刷新储能数据` | 电力新能源/储能/产业链.md | ~1min |
| `刷新光伏数据` | 电力新能源/光伏/产业链.md | ~1min |
| `刷新风电数据` | 电力新能源/风电/产业链.md | ~1min |
| `刷新智能电网数据` | 电力新能源/智能电网/新兴赛道.md | ~1min |
| `刷新碳市场数据` | 电力新能源/碳市场/赛道文件.md | ~30s |
| `刷新电力市场数据` | 电力新能源/电力市场/赛道文件.md | ~30s |
| `刷新数据中心能源` | 算电协同/数据中心+能源/赛道文件.md | ~30s |
| `刷新估值基准` | 一级市场估值基准.md | ~1min |

---

## 全量刷新命令序列

执行顺序（带依赖）：先宏观 → 再赛道 → 最后估值

### Phase 1: 宏观数据（赛道总览）

```markdown
1. china-energy_get_national_stats()
   → 更新赛道总览：中国风光装机、发电量、利用率

2. china-energy_get_province_stats()
   → 更新赛道总览：各省 TOP 排名数据

3. china-energy_get_spot_prices()
   → 更新赛道总览：全国现货电价分化数据

4. prospector-energy_get_queue_stats()
   → 更新赛道总览：美国并网队列概况（总容量、技术分布）
```

### Phase 2: 储能赛道

```markdown
5. china-energy_get_queue_projects(technology="储能")
   → 更新储能产业链：中国新型储能装机数据

6. prospector-energy_get_technology_costs(technology="Battery Storage")
   → 更新储能产业链：NREL 储能 LCOE、资本成本

7. prospector-energy_calculate_tax_credits(technology="Battery Storage", capacity_mw=100, state="CA")
   → 更新储能产业链：美国储能 ITC 示例计算

8. prospector-energy_get_investable_summary()
   → 更新储能产业链：美国储能可投资项目概况
```

### Phase 3: 光伏赛道

```markdown
9. china-energy_get_queue_projects(technology="光伏")
   → 更新光伏产业链：中国光伏装机明细

10. prospector-energy_get_technology_costs(technology="Solar")
    → 更新光伏产业链：NREL 光伏 LCOE、资本成本

11. prospector-energy_search_projects(type="Solar", region="CAISO", status="Active")
    → 更新光伏产业链：美国加州光伏项目动态
```

### Phase 4: 风电赛道

```markdown
12. china-energy_get_queue_projects(technology="风电")
    → 更新风电产业链：中国风电装机明细

13. prospector-energy_get_technology_costs(technology="Wind")
    → 更新风电产业链：NREL 风电 LCOE、资本成本

14. prospector-energy_search_projects(type="Wind", region="ERCOT", status="Active")
    → 更新风电产业链：美国德州风电项目动态
```

### Phase 5: 智能电网 / VPP

```markdown
15. china-energy_get_spot_market()
    → 更新智能电网/新兴赛道：各省现货市场建设进展

16. china-energy_get_spot_prices()
    → 更新智能电网/新兴赛道：各省现货电价最新数据

17. china-energy_search_policy(keyword="电力市场")
    → 更新智能电网/新兴赛道：最新电改政策
```

### Phase 6: 碳市场

```markdown
18. china-energy_search_policy(keyword="碳市场")
    → 更新碳市场/赛道文件：碳市政策进展
```

### Phase 7: 电力市场 / 电改2.0

```markdown
19. china-energy_get_spot_market()
    → 更新电力市场/赛道文件：现货市场建设进展

20. china-energy_get_spot_prices()
    → 更新电力市场/赛道文件：各省电价数据

21. china-energy_search_policy(keyword="电力市场")
    → 更新电力市场/赛道文件：最新电改政策
```

### Phase 8: 数据中心+能源

```markdown
22. 暂无 MCP 数据源直接覆盖，使用 websearch 搜索：
    - "数据中心 绿电直连 2026"
    - "算电协同 项目 进展"
    → 更新算电协同/数据中心+能源/赛道文件
```

### Phase 9: 估值基准

```markdown
23. prospector-energy_get_itc_summary()
    → 更新估值基准：ITC 抵免对项目 IRR 影响

24. prospector-energy_get_developer_stats()
    → 更新估值基准：美国开发商分级/完成率数据

25. prospector-energy_get_investable_summary()
    → 更新估值基准：可投资项目估值区间参考
```

---

## 各数据源 → 文件映射总表

### China Energy MCP

| 工具 | 用途 | 目标文件 |
|------|------|---------|
| `get_national_stats(category="装机")` | 中国风光装机统计 | 赛道总览 |
| `get_national_stats(category="发电")` | 中国风光发电量/利用率 | 赛道总览 |
| `get_province_stats()` | 各省装机排名 | 赛道总览 |
| `get_queue_projects(technology="风电")` | 中国风电并网数据 | 风电/产业链 |
| `get_queue_projects(technology="光伏")` | 中国光伏并网数据 | 光伏/产业链 |
| `get_queue_projects(technology="储能")` | 中国新型储能数据 | 储能/产业链 |
| `get_spot_market()` | 各省现货市场建设进展 | 智能电网/新兴赛道 |
| `get_spot_prices(province="广东")` | 各省现货电价 | 智能电网/新兴赛道、赛道总览 |
| `get_investment_ref(type="IRR")` | 项目 IRR 参考 | 估值基准 |
| `get_investment_ref(type="储能")` | 储能成本参考 | 储能/产业链 |
| `search_policy(keyword="新型储能")` | 最新储能政策 | 储能/产业链 |
| `search_policy(keyword="电力市场")` | 最新电改政策 | 智能电网/新兴赛道 |
| `search_policy(keyword="光伏并网")` | 最新光伏政策 | 光伏/产业链 |
| `search_policy(keyword="风电")` | 最新风电政策 | 风电/产业链 |

### Prospector Energy MCP

| 工具 | 用途 | 目标文件 |
|------|------|---------|
| `get_queue_stats()` | 美国并网队列总览 | 赛道总览 |
| `get_technology_costs(technology="Solar")` | 光伏 LCOE/资本成本 | 光伏/产业链 |
| `get_technology_costs(technology="Wind")` | 风电 LCOE/资本成本 | 风电/产业链 |
| `get_technology_costs(technology="Battery Storage")` | 储能 LCOE/资本成本 | 储能/产业链 |
| `get_technology_costs(technology="Natural Gas")` | 气电 LCOE（对标） | 赛道总览 |
| `search_projects(type="Solar", ...)` | 美国光伏项目搜索 | 光伏/产业链 |
| `search_projects(type="Wind", ...)` | 美国风电项目搜索 | 风电/产业链 |
| `search_projects(type="Battery Storage", ...)` | 美国储能项目搜索 | 储能/产业链 |
| `get_investable_summary()` | 可投资项目汇总 | 赛道总览、估值基准 |
| `get_itc_summary()` | ITC 抵免汇总 | 估值基准 |
| `get_investable_projects(...)` | 高评分项目详情 | 储能/产业链 |
| `get_developer_stats()` | 开发商分级统计 | 估值基准 |
| `get_milestone_summary()` | 项目里程碑统计 | 赛道总览 |
| `get_capacity_prices(iso="PJM")` | PJM 容量电价 | 估值基准 |
| `get_fuel_prices(fuel="Natural Gas")` | 天然气价格 | 赛道总览 |
| `get_lmp_zones()` | 可用 LMP 定价区列表 | 智能电网/新兴赛道 |
| `get_lmp_daily(iso="CAISO", days=30)` | CAISO 日前电价 | 智能电网/新兴赛道 |
| `get_rto_generation(region="PJM")` | PJM 发电结构 | 赛道总览 |
| `calculate_tax_credits(...)` | 项目 ITC/PTC 计算 | 估值基准 |
| `find_itc_deals(...)` | 高 ITC 项目机会 | 估值基准 |

---

## 增量刷新 vs 全量刷新

| 模式 | 触发方式 | 说明 |
|------|---------|------|
| **全量刷新** | `刷新全部` | 执行 Phase 1-6 全部 20 个步骤 |
| **增量刷新** | `刷新 [赛道名]` | 仅更新单个赛道的数据文件 |
| **单工具刷新** | 直接在对话中说具体命令 | 临时查询单条数据 |

---

## 数据新鲜度标记

刷新完成后，AI 会更新受影响的 `.md` 文件中如下标记：

```
**数据获取：** 2026-06-15  →  **数据获取：** {新日期}
```

并在 README.md 中同步更新 `数据源对接状态` 表格中的日期。

---

## 故障处理

| 场景 | 处理方式 |
|------|---------|
| MCP 工具超时 | 重试 1 次，跳过该步骤继续后续刷新 |
| 数据无变化 | 保留原数据，仅更新时间戳标记 |
| 工具不可用 | 在状态文件中标记 `status: "unavailable"`，跳过 |
| 部分数据缺失 | 写入 `数据待补充` 占位，不影响其他文件 |

---

*最后更新：2026-06-15 · 配套脚本：refresh_knowledge_base.sh*
