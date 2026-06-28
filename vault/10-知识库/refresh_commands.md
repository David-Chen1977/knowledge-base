---
updated: 2026-06-25
visibility: private
---

# 刷新指令 · AnySearch 替代 china-energy-mcp

> ⚠️ china-energy-mcp 已下线，由 **AnySearch** + **china-ets** 替代
>
> 查询模板文档见: `scripts/refresh-china-energy.md`
> 脚本: `bash scripts/refresh-china-energy.sh`

## 快速刷新

在 OpenCode 对话中说以下任意指令即可：

| 你说 | 执行 |
|------|------|
| `刷新全部` | AnySearch batch_search 并行查询 7 个维度 |
| `刷新现货电价` | AnySearch 查各省日前/实时电价 |
| `刷新装机数据` | AnySearch 查风电/光伏/储能装机 |
| `刷新碳市场` | china-ets MCP 查 CEA/CCER 精确行情 |
| `刷新政策动态` | AnySearch 查最新能源政策 |
| `刷新绿电数据` | AnySearch 查绿电交易/算电协同 |

## 数据源对照

| 旧函数 (china-energy-mcp) | 替代方案 | 状态 |
|--------------------------|---------|------|
| `china-energy_get_spot_prices` | AnySearch → 搜索 "电力现货市场 电价 各省" | ✅ |
| `china-energy_get_national_stats` | AnySearch → 搜索 "风电 光伏 装机 统计数据" | ✅ |
| `china-energy_get_province_stats` | AnySearch → 搜索 "各省 可再生能源 装机" | ✅ |
| `china-energy_search_policy(keyword)` | AnySearch → 搜索 "能源 政策 {keyword} 2026" | ✅ |
| `china-energy_get_queue_projects` | AnySearch → 搜索 "并网 新能源 项目 列表" | ✅ |
| `china-energy_get_market_data` | AnySearch → 搜索 "绿电 交易 市场 数据" | ✅ |
| **碳市场数据** | **china-ets MCP** → `get_market_summary` / `query_trading_data` | ✅ **更精确** |

## 执行流程

```
你在对话中说 "刷新全部"
  ↓
OpenCode 调用 anysearch MCP 的 batch_search (7个并行查询)
  ↓
AnySearch 返回结构化结果
  ↓
提取数据 → 格式化 Markdown 表格 → 更新知识库文件
  ↓
完成 ✅
```

## 更新的 MCP 配置 (2026-06-25)

| MCP | 用途 | 已启用 |
|-----|------|--------|
| secedgar | SEC 财报（美股） | ✅ |
| yfinance | 行情 + 财务数据 | ✅ |
| fred-mcp | 宏观指标 | ✅ |
| ppt-mcp | PPT 生成 | ✅ |
| prospector-energy | 美国能源项目 | ✅ |
| shared-workspace | WorkBuddy 同步 | ✅ |
| wenyan-mcp | 公众号发布 | ✅ |
| anysearch | 统一搜索（替代 china-energy） | ✅ |
| **china-ets** | **中国碳市场 CEA/CCER（新增）** | ✅ |
| agentmemory | AI 跨会话记忆 | ✅ |
| ~~china-energy~~ | ~~已下线~~ | ❌ |
