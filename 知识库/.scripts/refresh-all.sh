#!/bin/bash
# refresh-all.sh v5 — 知识库自动刷新 + macOS 通知告警
# v5: 新增 macOS Notification Center 失败告警 + 连续失败计数 + 状态门
# ============================================================
export PATH="/Users/Admin/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

KB_DIR="/Users/Admin/OpencodeWorkspace/知识库"
LOG_FILE="$KB_DIR/.refresh_log.txt"
NODE="/Users/Admin/.local/bin/node"
REFRESH_SCRIPT="$KB_DIR/.scripts/refresh-kb.mjs"
FAILURE_FILE="$KB_DIR/.data_refresh_failure"
FAILURE_COUNT_FILE="$KB_DIR/.data_refresh_fail_count"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

notify() {
  local title="$1" msg="$2"
  # macOS Notification Center
  osascript -e "display notification \"$msg\" with title \"$title\" sound name \"Basso\"" 2>/dev/null
  # Also log to console
  log "🔔 $title: $msg"
}

log "=== 自动刷新 v5 ==="

# ── 状态门：如果上次刷新失败且未修复，先确认数据源是否恢复 ──
if [ -f "$FAILURE_FILE" ]; then
  last_fail=$(cat "$FAILURE_FILE" | head -1)
  # 先尝试 --check 模式验证
  if $NODE "$REFRESH_SCRIPT" --check >> "$LOG_FILE" 2>&1; then
    log "⚠️ 上次刷新失败 ($last_fail)，但当前健康检查通过，重试刷新"
  else
    log "⚠️ 上次刷新失败 ($last_fail)，健康检查仍未通过，跳过本轮"
    # 连续失败计数
    count=0
    [ -f "$FAILURE_COUNT_FILE" ] && count=$(cat "$FAILURE_COUNT_FILE")
    count=$((count + 1))
    echo "$count" > "$FAILURE_COUNT_FILE"
    # 首次失败和每3次失败通知一次
    if [ "$count" -le 2 ] || [ $((count % 3)) -eq 0 ]; then
      notify "知识库刷新持续失败" "已连续失败 ${count} 次 (上次: ${last_fail})"
    fi
    exit 1
  fi
fi

# ── 执行刷新 ──
if $NODE "$REFRESH_SCRIPT" >> "$LOG_FILE" 2>&1; then
  log "✅ 刷新成功"
  rm -f "$FAILURE_FILE" "$FAILURE_COUNT_FILE" 2>/dev/null
else
  log "❌ 刷新失败"
  date '+%Y-%m-%d %H:%M:%S' > "$FAILURE_FILE"
  echo "refresh-kb.mjs failed. Check .refresh_log.txt" >> "$FAILURE_FILE"

  # 计数+通知
  count=1
  [ -f "$FAILURE_COUNT_FILE" ] && count=$(($(cat "$FAILURE_COUNT_FILE") + 1))
  echo "$count" > "$FAILURE_COUNT_FILE"
  notify "知识库刷新失败" "第 ${count} 次失败 — 请检查 refresh-kb.mjs"
  exit 1
fi

# ── 状态门：仅当刷新成功后才触发网站同步 ──
if [ -f "$KB_DIR/.scripts/sync-to-website.sh" ]; then
  log "▶ 触发网站同步..."
  if bash "$KB_DIR/.scripts/sync-to-website.sh" >> "$LOG_FILE" 2>&1; then
    log "✅ 网站同步完成"
  else
    log "⚠️ 网站同步失败（不会阻断）"
  fi
fi

log "✅ 全流程完成"
