#!/bin/bash
# refresh-all.sh v4 — 知识库自动刷新（纯本地，无 WorkBuddy 依赖）
# v3→v4: 移除 WorkBuddy 路径引用, 脚本迁至本地 .scripts/
# ============================================================
export PATH="/Users/Admin/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

KB_DIR="/Users/Admin/OpencodeWorkspace/知识库"
LOG_FILE="$KB_DIR/.refresh_log.txt"
NODE="/Users/Admin/.local/bin/node"
REFRESH_SCRIPT="$KB_DIR/.scripts/refresh-kb.mjs"
FAILURE_FILE="$KB_DIR/.data_refresh_failure"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
log "=== 自动刷新 v4 ==="

if $NODE "$REFRESH_SCRIPT" >> "$LOG_FILE" 2>&1; then
  log "✅ 刷新成功"
  rm -f "$FAILURE_FILE"
else
  log "❌ 刷新失败"
  date '+%Y-%m-%d %H:%M:%S' > "$FAILURE_FILE"
  echo "refresh-kb.mjs failed. Check .refresh_log.txt" >> "$FAILURE_FILE"
fi

# 触发网站同步（如果有内容更新）
if [ -f "$KB_DIR/.scripts/sync-to-website.sh" ]; then
  bash "$KB_DIR/.scripts/sync-to-website.sh" >> "$LOG_FILE" 2>&1
fi
