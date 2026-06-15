#!/bin/bash
# ==============================================================================
# 知识库数据刷新脚本 — Knowledge Base Refresh Runbook
# ==============================================================================
# 用途: 记录刷新时间戳、生成状态报告、指引 AI 执行实际 MCP 数据拉取
# 注意: MCP 工具不可直接从 shell 调用，本脚本为 runbook/planning 自动化辅助
# ==============================================================================

set -e

# --- 路径定义 ---
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
LAST_REFRESH_FILE="${BASE_DIR}/.last_refresh"
STATUS_FILE="${BASE_DIR}/.data_refresh_status.json"
LOG_FILE="${BASE_DIR}/.refresh_log.txt"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# --- 1. 打印 Header ---
echo "=============================================="
echo "=== 知识库数据刷新 ${TIMESTAMP} ==="
echo "=============================================="
echo ""

# --- 2. 记录刷新时间戳 ---
echo "${TIMESTAMP}" > "${LAST_REFRESH_FILE}"
echo "✅ 时间戳已记录 → ${LAST_REFRESH_FILE}"
echo ""

# --- 3. 生成状态 JSON ---
cat > "${STATUS_FILE}" << JSONEOF
{
  "last_refresh": "${TIMESTAMP}",
  "data_sources": {
    "china_energy": {
      "status": "available",
      "tools": [
        "get_national_stats",
        "get_province_stats",
        "get_queue_projects",
        "get_spot_market",
        "get_spot_prices",
        "get_investment_ref",
        "search_policy"
      ]
    },
    "prospector_energy": {
      "status": "available",
      "free_tools": [
        "get_queue_stats",
        "get_developer_stats",
        "get_investable_summary",
        "get_itc_summary",
        "get_milestone_summary",
        "get_lmp_zones"
      ]
    }
  },
  "enriched_files": [
    "电力新能源/赛道总览.md",
    "电力新能源/储能/产业链.md",
    "电力新能源/光伏/产业链.md",
    "电力新能源/风电/产业链.md",
    "电力新能源/智能电网/新兴赛道.md",
    "一级市场估值基准.md"
  ],
  "refresh_instructions": "Run 'refresh_commands.md::全量刷新' in AI conversation to execute actual MCP data pulls"
}
JSONEOF
echo "✅ 状态文件已生成 → ${STATUS_FILE}"
echo ""

# --- 4. 写入日志 ---
{
  echo "[${TIMESTAMP}] 知识库刷新 Runbook 执行"
  echo "[${TIMESTAMP}] 状态文件写入: ${STATUS_FILE}"
  echo "[${TIMESTAMP}] 刷新指令: 请参考 refresh_commands.md 在 AI 对话中执行"
} >> "${LOG_FILE}"
echo "✅ 日志已追加 → ${LOG_FILE}"
echo ""

# --- 5. 打印数据拉取指令（Runbook） ---
echo "=============================================="
echo "  📋 下一步：执行实际 MCP 数据拉取"
echo "=============================================="
echo ""
echo "MCP 工具不能直接从 shell 调用。请在 AI 对话中说："
echo ""
echo "  \"刷新全部\""
echo ""
echo "或指定部分刷新："
echo "  \"刷新赛道总览\""
echo "  \"刷新储能数据\""
echo "  \"刷新光伏数据\""
echo "  \"刷新风电数据\""
echo "  \"刷新智能电网数据\""
echo "  \"刷新估值基准\""
echo ""
echo "详细命令映射见 → refresh_commands.md"
echo ""

# --- 6. 显示数据源概览 ---
echo "=============================================="
echo "  📊 当前数据源状态"
echo "=============================================="
echo ""
echo "  China Energy MCP    | ✅ 可用 | 7 个工具 | 中国电力数据"
echo "  Prospector Energy   | ✅ 可用 | 30+ 工具 | 美国能源数据"
echo "  NREL ATB (via PE)   | ✅ 可用 | 技术成本/LCOE 数据"
echo "  secedgar MCP        | ⏳ 可用 | SEC 财报数据（待扩展）"
echo "  yfinance MCP        | ⏳ 可用 | 股票行情数据（待扩展）"
echo ""
echo "=============================================="
echo "  刷新完成：${TIMESTAMP}"
echo "=============================================="
