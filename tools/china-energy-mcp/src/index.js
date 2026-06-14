#!/usr/bin/env node
/**
 * china-energy-mcp - 中国能源并网数据 MCP Server
 * 
 * 为 AI Agent 提供中国新能源并网数据、政策、电价等信息的查询能力。
 * 数据来源：国家能源局、中电联、全国新能源消纳监测预警中心、北极星电力网等公开数据
 * 
 * 工具列表：
 * - get_queue_projects    - 查询各省新能源并网项目数据
 * - get_province_stats    - 查询各省新能源统计数据
 * - get_spot_market       - 查询电力现货市场建设进展
 * - get_spot_prices       - 查询各省现货电价
 * - search_policy         - 搜索最新能源政策
 * - get_national_stats    - 查询全国可再生能源统计
 * - get_investment_ref    - 查询投资参考数据 (IRR/成本等)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as DATA from "./sources/data.js";

// ---------- 辅助函数 ----------

function filterByProvince(data, province) {
  if (!province || province === "全部" || province === "") return data;
  const result = {};
  for (const [key, val] of Object.entries(data)) {
    if (key.includes(province)) result[key] = val;
  }
  return Object.keys(result).length > 0 ? result : { [province]: data[province] || `未找到省份: ${province}` };
}

function formatTable(obj, title) {
  let result = `## ${title}\n\n`;
  result += "| 省份/类别 | 数据 |\n|----------|------|\n";
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "object") {
      result += `| **${key}** | ${Object.entries(val).map(([k, v]) => `${k}: ${v}`).join("; ")} |\n`;
    } else {
      result += `| ${key} | ${val} |\n`;
    }
  }
  return result;
}

// ---------- Web Fetch 工具 ----------

async function fetchWebContent(url) {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ChinaEnergyMCP/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return null;
    const text = await resp.text();
    return text.substring(0, 8000); // 截断长内容
  } catch {
    return null;
  }
}

async function searchBaihePolicy(keyword) {
  // 搜索国家能源局公开政策
  const url = `https://www.nea.gov.cn/search?q=${encodeURIComponent(keyword)}`;
  return await fetchWebContent(url);
}

// ---------- 工具处理函数 ----------

async function handleGetQueueProjects(args) {
  const province = args?.province || "";
  const technology = args?.technology || "";
  const data = filterByProvince(DATA.PROVINCE_INSTALLED_CAPACITY, province);
  
  let result = "## 各省新能源累计装机容量\n\n";
  result += "数据来源：国家能源局 2025年可再生能源发展情况\n\n";
  result += "| 省份 | 风电(万千瓦) | 光伏(万千瓦) | 储能(万千瓦) |\n";
  result += "|------|------------|------------|------------|\n";
  
  for (const [prov, vals] of Object.entries(data)) {
    if (typeof vals === "object") {
      result += `| ${prov} | ${vals["风电"] || "-"} | ${vals["光伏"] || "-"} | ${vals["储能"] || "-"} |\n`;
    }
  }
  
  // 添加利用率数据
  if (!province || DATA.PROVINCE_UTILIZATION[province]) {
    const utilData = province ? { [province]: DATA.PROVINCE_UTILIZATION[province] } : DATA.PROVINCE_UTILIZATION;
    result += "\n## 新能源利用率\n\n";
    result += "| 省份 | 风电利用率 | 光伏利用率 |\n";
    result += "|------|-----------|-----------|\n";
    for (const [prov, vals] of Object.entries(utilData)) {
      result += `| ${prov} | ${vals["风电"] || "-"} | ${vals["光伏"] || "-"} |\n`;
    }
  }

  result += "\n> 💡 提示：可用 `get_province_stats` 查看各省详细数据，用 `get_spot_market` 查看现货市场进展";
  
  return { content: [{ type: "text", text: result }] };
}

async function handleGetProvinceStats(args) {
  const province = args?.province || "";
  
  let result = "## 各省新能源数据统计\n\n";
  result += "数据来源：国家能源局、全国新能源消纳监测预警中心\n\n";

  const provinces = province
    ? [province]
    : Object.keys(DATA.PROVINCE_INSTALLED_CAPACITY).slice(0, 16);

  for (const prov of provinces) {
    const cap = DATA.PROVINCE_INSTALLED_CAPACITY[prov];
    const util = DATA.PROVINCE_UTILIZATION[prov];
    const spot = DATA.SPOT_MARKET_STATUS[prov];
    const potential = DATA.PROVINCE_POTENTIAL[prov];

    if (!cap) {
      result += `### ${prov}\n暂无数据\n\n`;
      continue;
    }

    result += `### ${prov}\n\n`;
    result += `| 指标 | 数据 |\n|------|------|\n`;
    result += `| 风电装机 | ${cap["风电"]} 万千瓦 |\n`;
    result += `| 光伏装机 | ${cap["光伏"]} 万千瓦 |\n`;
    result += `| 储能装机 | ${cap["储能"]} 万千瓦 |\n`;
    if (util) {
      result += `| 风电利用率 | ${util["风电"]} |\n`;
      result += `| 光伏利用率 | ${util["光伏"]} |\n`;
    }
    if (spot) {
      result += `| 现货市场 | ${spot.status} |\n`;
    }
    if (potential) {
      result += `| 风电利用小时 | ${potential.wind_full_load} |\n`;
      result += `| 光伏利用小时 | ${potential.pv_full_load} |\n`;
      result += `| 资源优势 | ${potential["优势"]} |\n`;
    }
    result += "\n";
  }

  result += "> 💡 提示：可用 `get_queue_projects` 查询全国总览，用 `get_spot_prices` 查询最新电价";
  
  return { content: [{ type: "text", text: result }] };
}

async function handleGetSpotMarket(args) {
  const province = args?.province || "";
  const data = filterByProvince(DATA.SPOT_MARKET_STATUS, province);
  
  let result = "## 电力现货市场建设进展\n\n";
  result += "数据来源：发改委394号文、各省电力交易中心 (2026年6月)\n\n";
  result += "| 省份 | 状态 | 启动时间 | 类型 |\n";
  result += "|------|------|---------|------|\n";
  
  for (const [prov, vals] of Object.entries(data)) {
    if (typeof vals === "object") {
      result += `| ${prov} | ${vals.status} | ${vals.startDate} | ${vals.type} |\n`;
    }
  }

  result += "\n### 2026年目标\n\n";
  result += "- 全国一半以上省份现货市场正式运行\n";
  result += "- 南方区域及安徽、陕西、福建、辽宁、河北南网转正\n";
  result += "- 辅助服务市场加速推进（爬坡、转动惯量等新品种）\n";
  result += "- 中长期交易逐步取消固定分时电价\n";

  result += "\n> 💡 提示：可用 `get_spot_prices` 查询各省最新现货电价";
  
  return { content: [{ type: "text", text: result }] };
}

async function handleGetSpotPrices(args) {
  const province = args?.province || "";
  const data = filterByProvince(DATA.SPOT_PRICES, province);
  
  let result = "## 各省现货电价参考\n\n";
  result += "数据来源：电力市场交易运行分析报告 (2026年4月均价)\n\n";
  result += "| 省份 | 均价(元/MWh) | 环比变化 | 特点 |\n";
  result += "|------|------------|---------|------|\n";
  
  for (const [prov, vals] of Object.entries(data)) {
    if (typeof vals === "object") {
      result += `| ${prov} | ${vals.price} | ${vals.change} | ${vals.trend} |\n`;
    }
  }

  result += "\n> ⚠️ 注意：现货电价随供需实时波动，上述数据为月度均价参考。\n";
  result += "> 建议结合 `get_spot_market` 查看市场建设进展。";
  
  return { content: [{ type: "text", text: result }] };
}

async function handleSearchPolicy(args) {
  const keyword = args?.keyword || "";
  const days = args?.days || 30;
  
  if (!keyword) {
    return { content: [{ type: "text", text: "请提供搜索关键词，如：keyword='新型储能', days=30" }] };
  }

  // 构建搜索查询
  const searchQuery = `site:nea.gov.cn OR site:ndrc.gov.cn OR site:bjx.com.cn ${keyword} ${days}天`;
  
  // 尝试获取北极星电力网搜索结果
  const bjxUrl = `https://search.bjx.com.cn/?keyword=${encodeURIComponent(keyword)}`;
  const bjxContent = await fetchWebContent(bjxUrl);

  let result = `## 能源政策搜索: "${keyword}"\n\n`;
  result += `搜索范围：近${days}天\n\n`;
  
  if (bjxContent && bjxContent.length > 200) {
    // 提取标题链接 (简化版)
    const titles = bjxContent.match(/<a[^>]*>([^<]+)<\/a>/gi) || [];
    result += "### 北极星电力网 搜索结果\n\n";
    let count = 0;
    for (const t of titles.slice(0, 10)) {
      const text = t.replace(/<[^>]*>/g, "").trim();
      if (text.length > 5 && !text.includes("搜索") && !text.includes("首页")) {
        result += `- ${text}\n`;
        count++;
      }
    }
    if (count === 0) result += "（未找到相关结果，建议换个关键词）\n";
  } else {
    result += "> 实时搜索暂不可用。以下为知识库中相关条目：\n\n";
    
    // 回退：用知识库数据
    const policyKeywords = {
      "新型储能": "2025年《新型储能制造业高质量发展行动方案》",
      "电力市场": "394号文《全面加快电力现货市场建设工作的通知》",
      "新能源上网电价": "136号文《深化新能源上网电价市场化改革》",
      "碳市场": "碳市场扩围至钢铁/水泥/电解铝",
      "绿电": "发改委《促进可再生能源绿色电力市场高质量发展》",
      "并网": "国家能源局可再生能源发电项目建档立卡",
      "算电协同": "内蒙古\"人工智能+\"行动方案支持数据中心负荷绿电直连",
      "电网": "六张网规划 - 特高压/配电网/智能电网",
    };

    for (const [kw, policy] of Object.entries(policyKeywords)) {
      if (keyword.includes(kw) || kw.includes(keyword)) {
        result += `- **${kw}**：${policy}\n`;
      }
    }
  }

  result += "\n> 💡 建议：可用更精确的关键词重新搜索，如“新型储能 政策 2026”";
  
  return { content: [{ type: "text", text: result }] };
}

async function handleGetNationalStats(args) {
  const category = args?.category || "";
  
  let result = "## 全国可再生能源统计\n\n";
  result += "数据来源：国家能源局、中电联 (2025年)\n\n";
  
  if (category === "装机") {
    result += "| 指标 | 数据 |\n|------|------|\n";
    result += `| 风电累计装机 | ${DATA.NATIONAL_STATS["风电累计装机"]} |\n`;
    result += `| 光伏累计装机 | ${DATA.NATIONAL_STATS["光伏累计装机"]} |\n`;
    result += `| 新型储能累计装机 | ${DATA.NATIONAL_STATS["新型储能累计装机"]} |\n`;
    result += `| 2025年新增风电 | ${DATA.NATIONAL_STATS["2025年新增风电"]} |\n`;
    result += `| 2025年新增光伏 | ${DATA.NATIONAL_STATS["2025年新增光伏"]} |\n`;
  } else if (category === "发电") {
    result += "| 指标 | 数据 |\n|------|------|\n";
    result += `| 风电年发电量 | ${DATA.NATIONAL_STATS["风电年发电量"]} |\n`;
    result += `| 光伏年发电量 | ${DATA.NATIONAL_STATS["光伏年发电量"]} |\n`;
    result += `| 可再生能源发电量占比 | ${DATA.NATIONAL_STATS["可再生能源发电量占比"]} |\n`;
    result += `| 全社会用电量 | ${DATA.NATIONAL_STATS["全社会用电量"]} |\n`;
    result += `| 数据中心用电量 | ${DATA.NATIONAL_STATS["数据中心用电量"]} |\n`;
  } else {
    for (const [key, val] of Object.entries(DATA.NATIONAL_STATS)) {
      result += `- **${key}**：${val}\n`;
    }
  }

  result += "\n> 💡 提示：可用 `get_queue_projects` 查看各省数据，用 `get_investment_ref` 查看投资参考";
  
  return { content: [{ type: "text", text: result }] };
}

async function handleGetInvestmentRef(args) {
  const type = args?.type || "";
  
  let result = "## 新能源投资参考数据\n\n";
  
  if (!type || type === "IRR" || type === "收益") {
    result += "### 各类项目IRR参考\n\n";
    result += "| 项目类型 | 资本金IRR |\n";
    result += "|---------|----------|\n";
    for (const [proj, irr] of Object.entries(DATA.PROJECT_IRR)) {
      result += `| ${proj} | ${irr} |\n`;
    }
  }
  
  if (!type || type === "储能" || type === "storage") {
    result += "\n### 储能系统成本参考\n\n";
    result += "| 技术路线 | 系统成本 | 循环寿命 | 状态 |\n";
    result += "|---------|---------|---------|------|\n";
    for (const [tech, vals] of Object.entries(DATA.STORAGE_COST)) {
      result += `| ${tech} | ${vals.systemCost} | ${vals.cycleLife} | ${vals.status} |\n`;
    }
  }

  if (!type || type === "省份" || type === "province") {
    result += "\n### 各省开发潜力\n\n";
    result += "| 省份 | 风电利用小时 | 光伏利用小时 | 优势 |\n";
    result += "|------|------------|------------|------|\n";
    for (const [prov, vals] of Object.entries(DATA.PROVINCE_POTENTIAL)) {
      result += `| ${prov} | ${vals.wind_full_load} | ${vals.pv_full_load} | ${vals["优势"]} |\n`;
    }
  }

  result += "\n> ⚠️ 以上数据为市场参考，实际收益因项目条件、融资结构、电价政策差异较大。";
  
  return { content: [{ type: "text", text: result }] };
}

// ---------- MCP Server ----------

const server = new Server(
  { name: "china-energy-mcp", version: "1.0.0" },
  { capabilities: { resources: {}, tools: {} } }
);

// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_queue_projects",
      description: "查询各省新能源并网项目数据（风电/光伏/储能累计装机容量、利用率）。支持按省份筛选。",
      inputSchema: {
        type: "object",
        properties: {
          province: {
            type: "string",
            description: "省份名称，如'内蒙古'、'广东'。不填则返回全国数据",
          },
          technology: {
            type: "string",
            description: "技术类型：风电/光伏/储能。不填则返回全部",
          },
        },
      },
    },
    {
      name: "get_province_stats",
      description: "查询指定省份的新能源综合数据（装机、利用率、现货市场状态、开发潜力等）。支持按省份筛选。",
      inputSchema: {
        type: "object",
        properties: {
          province: {
            type: "string",
            description: "省份名称，如'内蒙古'。不填则返回TOP省份总览",
          },
        },
      },
    },
    {
      name: "get_spot_market",
      description: "查询电力现货市场建设进展。了解各省电力市场化改革阶段。",
      inputSchema: {
        type: "object",
        properties: {
          province: {
            type: "string",
            description: "省份名称筛选",
          },
        },
      },
    },
    {
      name: "get_spot_prices",
      description: "查询各省电力现货市场最新均价。了解区域电价分化趋势。",
      inputSchema: {
        type: "object",
        properties: {
          province: {
            type: "string",
            description: "省份名称筛选",
          },
        },
      },
    },
    {
      name: "search_policy",
      description: "搜索中国能源领域最新政策文件。支持关键词搜索。注意：实时搜索可能因网络限制不可用，会降级到知识库查询。",
      inputSchema: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "搜索关键词，如'新型储能'、'电力市场'、'光伏并网'",
          },
          days: {
            type: "number",
            description: "搜索范围：近几天的政策（默认30天）",
          },
        },
        required: ["keyword"],
      },
    },
    {
      name: "get_national_stats",
      description: "查询全国可再生能源宏观统计数据（装机、发电量、利用率等）。支持按类别筛选。",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "分类筛选：装机/发电。不填返回全部",
          },
        },
      },
    },
    {
      name: "get_investment_ref",
      description: "查询新能源投资参考数据（项目IRR、储能成本、各省开发潜力）。",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "数据类型：IRR/储能/省份。不填返回全部",
          },
        },
      },
    },
  ],
}));

// 工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_queue_projects":
        return await handleGetQueueProjects(args);
      case "get_province_stats":
        return await handleGetProvinceStats(args);
      case "get_spot_market":
        return await handleGetSpotMarket(args);
      case "get_spot_prices":
        return await handleGetSpotPrices(args);
      case "search_policy":
        return await handleSearchPolicy(args);
      case "get_national_stats":
        return await handleGetNationalStats(args);
      case "get_investment_ref":
        return await handleGetInvestmentRef(args);
      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `错误: ${error.message}` }],
      isError: true,
    };
  }
});

// 启动
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("china-energy-mcp started");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
