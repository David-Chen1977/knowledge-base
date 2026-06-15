#!/bin/bash
KB_DIR="/Users/Admin/OpencodeWorkspace/知识库"
LOG_FILE="$KB_DIR/.refresh_log.txt"
CMDS_FILE="$KB_DIR/refresh_commands.md"
STATUS_FILE="$KB_DIR/.data_refresh_status.json"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
log "=== 自动刷新 ==="

LAST_RUN=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "$LAST_RUN" > "$KB_DIR/.last_refresh"

# 生成AI执行清单
cat > "$CMDS_FILE" <<CMDEOF
# 刷新指令 · $(date '+%Y-%m-%d %H:%M')

上次刷新: ${LAST_RUN}

## 清晨轮 (9:00)
| 操作 | 工具 | 输出 |
|------|------|------|
| 宏观数据 | china-energy_get_national_stats | 更新赛道总览.md |
| TOP省份 | china-energy_get_province_stats | 更新赛道总览.md |
| 政策检查 | china-energy_search_policy 各赛道关键词 | 更新各赛道文件 |

## 晚间轮 (21:00)
| 操作 | 工具 | 输出 |
|------|------|------|
| 电力现货 | china-energy_get_spot_prices | 更新电力市场/赛道文件.md |
| TOP省份 | china-energy_get_province_stats | 更新赛道总览.md |
| 并网项目 | china-energy_get_queue_projects | 更新储能/产业链.md |

执行: 在OpenCode中说"刷新全部"
CMDEOF

# 写入状态
cat > "$STATUS_FILE" <<EOF
{
  "last_refresh": "$LAST_RUN",
  "next_scheduled": "$(date -j -v+12H -f "%Y-%m-%dT%H:%M:%SZ" "$LAST_RUN" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "$LAST_RUN")",
  "mode": "指令已生成, 等待AI对话执行"
}
EOF

# git保存
cd /Users/Admin/OpencodeWorkspace
git add 知识库/ 2>/dev/null
git diff --cached --quiet || git commit -m "auto-refresh: $(date '+%Y-%m-%d %H:%M')" --quiet 2>/dev/null

log "✅ $LAST_RUN"
