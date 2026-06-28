#!/bin/bash
# =============================================================================
# refresh-china-energy.sh — 一键刷新中国能源数据（AnySearch 真实查询）
# =============================================================================
# 用法:
#   bash refresh-china-energy.sh              # 全量刷新
#   bash refresh-china-energy.sh 电价           # 仅刷现货电价
#   bash refresh-china-energy.sh 装机 碳价       # 刷装机 + 碳价
#   bash refresh-china-energy.sh --help        # 查看帮助
#
# 数据源: AnySearch (https://api.anysearch.com/mcp)
# 输出:   stdout / 可选追加到知识库文件
# =============================================================================

set -euo pipefail

ANYSEARCH_URL="${ANYSEARCH_URL:-https://api.anysearch.com/mcp}"

call_search() {
  local query="$1"
  local payload
  payload=$(cat <<EOF
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search","arguments":{"query":"$query"}}}
EOF
)
  curl -s --max-time 30 --noproxy "*" -X POST "$ANYSEARCH_URL" \
    -H "Content-Type: application/json" \
    -d "$payload" | python3 -c "
import sys, json
data = json.load(sys.stdin)
content = data.get('result', {}).get('content', [])
for c in content:
    if c.get('type') == 'text':
        print(c['text'][:3000])  # 取前 3000 字符
" 2>/dev/null || echo "  ⚠️  查询失败: $query" >&2
}

# ── 查询函数 ──

spot_prices() {
  echo "### 💰 各省电力现货市场"
  echo ""
  call_search "2026年6月 各省电力现货市场 日前均价 实时均价 广东 山西 山东 蒙西 陕西 甘肃"
  echo ""
  call_search "2026年 电力现货市场 负电价 省份 数据"
  echo ""
}

capacity() {
  echo "### 🌱 风电/光伏/储能装机"
  echo ""
  call_search "2026年 中国 风电 光伏 新增装机 各省 数据 国家能源局"
  echo ""
  call_search "2026年 中国 新型储能 装机 各省 排名"
  echo ""
}

carbon() {
  echo "### 🏭 碳市场"
  echo ""
  call_search "全国碳排放权交易市场 CEA 碳价 2026年6月 最新价格"
  echo ""
  echo "*注：精确历史行情请用 china-ets MCP 查询*"
  echo ""
}

policy() {
  echo "### 📋 能源政策动态"
  echo ""
  call_search "国家能源局 2026年 最新政策 可再生能源 电力市场 电改"
  echo ""
}

green_power() {
  echo "### 🔋 绿电交易 & 算电协同"
  echo ""
  call_search "绿电交易 2026年 规模 均价 省份 数据中心 PPA"
  echo ""
}

all() {
  spot_prices
  echo "---"
  capacity
  echo "---"
  carbon
  echo "---"
  policy
  echo "---"
  green_power
}

# ── 主入口 ──

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo "用法: bash refresh-china-energy.sh [主题...]"
  echo ""
  echo "可用主题: 电价 装机 碳价 政策 绿电 全部"
  echo ""
  echo "示例:"
  echo "  bash refresh-china-energy.sh 全部        # 全量刷新"
  echo "  bash refresh-china-energy.sh 电价 碳价    # 仅刷电价+碳价"
  echo "  bash refresh-china-energy.sh 装机         # 仅刷装机"
  exit 0
fi

echo "# 🔄 中国能源数据刷新 $(date '+%Y-%m-%d %H:%M')"
echo ""

if [ $# -eq 0 ]; then
  all
else
  for topic in "$@"; do
    case "$topic" in
      电价) spot_prices ;;
      装机) capacity ;;
      碳价) carbon ;;
      政策) policy ;;
      绿电) green_power ;;
      全部|*) all ;;
    esac
    echo "---"
  done
fi

echo ""
echo "> 刷新完成 $(date '+%H:%M:%S') | AnySearch"
