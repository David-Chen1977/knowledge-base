#!/bin/bash
# ============================================================
# 政策/新闻监控脚本
# 用途: 定时检查关键政策更新，生成简报
# 触发: launchd (每日) 或 手动
# 注意: 实际MCP调用需在OpenCode对话中执行
#       此脚本作为状态追踪和简报生成入口
# ============================================================

KB_DIR="/Users/Admin/OpencodeWorkspace/知识库"
MONITOR_DIR="$KB_DIR/.监控"
mkdir -p "$MONITOR_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

log "📡 政策监控轮询开始"

# 更新监控状态文件（供OpenCode下次对话时读取）
cat > "$MONITOR_DIR/待检查关键词.json" <<EOF
{
  "checked_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "keywords": [
    {"keyword": "新型储能", "赛道": "储能"},
    {"keyword": "电力市场", "赛道": "电力市场"},
    {"keyword": "碳市场", "赛道": "碳市场"},
    {"keyword": "光伏并网", "赛道": "光伏"},
    {"keyword": "风电", "赛道": "风电"},
    {"keyword": "数据中心 绿电", "赛道": "数据中心+能源"},
    {"keyword": "氢能", "赛道": "氢能"},
    {"keyword": "虚拟电厂", "赛道": "智能电网"},
    {"keyword": "算电协同", "赛道": "算电协同"}
  ],
  "note": "下次对话时，AI 读取此文件，用 china-energy_search_policy 逐个检查更新"
}
EOF

log "✅ 监控状态已更新 | 下次对话时AI将检查 $MONITOR_DIR/待检查关键词.json"

# 检查是否需要生成简报（如果自上次简报后有新的待深化问题回答）
# 这部分由OpenCode对话驱动

log "📡 政策监控轮询完成"
