#!/bin/bash
# orchestrator.sh v1 — 统一编排器：知识库刷新 + 网站同步 + 自动保存
#
# 替代 4 个独立 launchd 任务为 1 个编排器 + 1 个健康检查
# 状态门：仅当前一步成功后执行下一步
# ============================================================

set -euo pipefail

export PATH="/Users/Admin/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# ── 配置 ──
KB_DIR="/Users/Admin/OpencodeWorkspace/知识库"
WORKSPACE="/Users/Admin/OpencodeWorkspace"
NODE="/Users/Admin/.local/bin/node"
REFRESH_SCRIPT="$KB_DIR/.scripts/refresh-kb.mjs"
SYNC_SCRIPT="$KB_DIR/.scripts/sync-to-website.sh"
AUTOSAVE_SCRIPT="$KB_DIR/.scripts/auto-save.sh"

LOG_FILE="$KB_DIR/.orchestrator_log.txt"
STATE_FILE="$KB_DIR/.orchestrator_state.json"

notify() {
  local title="$1" msg="$2"
  osascript -e "display notification \"$msg\" with title \"$title\" sound name \"Basso\"" 2>/dev/null
}

log() {
  local ts
  ts=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$ts] $1" | tee -a "$LOG_FILE"
}

save_state() {
  local step="$1" status="$2" msg="${3:-}"
  jq -n \
    --arg step "$step" \
    --arg status "$status" \
    --arg msg "$msg" \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{step: $step, status: $status, message: $msg, timestamp: $ts}' \
    > "$STATE_FILE"
}

# ── 参数解析 ──
MODE="${1:-full}"  # full | refresh-only | sync-only | health-check

case "$MODE" in
  health-check)
    log "🔍 健康检查模式"
    "$KB_DIR/.scripts/health-check.sh"
    exit $?
    ;;
esac

log "═══════════════════════════════════════════"
log "  统一编排器 v1 — $(date '+%Y-%m-%d %H:%M:%S')"
log "  模式: $MODE"
log "═══════════════════════════════════════════"

OVERALL_FAILED=false

# ═══════════════════════════════════════════════
# Step 1: 知识库数据刷新
# ═══════════════════════════════════════════════
if [ "$MODE" = "full" ] || [ "$MODE" = "refresh-only" ]; then
  log ""
  log "━━━ Step 1/3: 知识库数据刷新 ━━━"

  if $NODE "$REFRESH_SCRIPT" >> "$LOG_FILE" 2>&1; then
    log "  ✅ 刷新成功"
    save_state "refresh" "success"
  else
    log "  ❌ 刷新失败"
    save_state "refresh" "failed" "知识库刷新失败，请检查 refresh-kb.mjs"
    notify "编排器: 知识库刷新失败" "Step 1/3 失败，后续步骤已跳过"
    OVERALL_FAILED=true

    # 如果仅刷新模式失败，退出
    if [ "$MODE" = "refresh-only" ]; then
      exit 1
    fi
  fi
fi

# ═══════════════════════════════════════════════
# Step 2: 网站同步 (仅当刷新成功)
# ═══════════════════════════════════════════════
if [ "$MODE" = "full" ] || [ "$MODE" = "sync-only" ]; then
  # 状态门：full 模式下 Step 1 失败则跳过
  if [ "$MODE" = "full" ] && [ "$OVERALL_FAILED" = true ]; then
    log ""
    log "━━━ Step 2: 网站同步 (⏭️ 跳过 — 前一步失败) ━━━"
  else
    log ""
    log "━━━ Step 2/3: 网站同步 ━━━"

    if [ -f "$SYNC_SCRIPT" ]; then
      if bash "$SYNC_SCRIPT" >> "$LOG_FILE" 2>&1; then
        log "  ✅ 同步完成"
        save_state "sync" "success"
      else
        log "  ⚠️ 同步异常（非阻断）"
        save_state "sync" "warning" "网站同步异常"
      fi
    else
      log "  ⚠️ 同步脚本不存在: $SYNC_SCRIPT"
      save_state "sync" "skipped" "同步脚本缺失"
    fi
  fi
fi

# ═══════════════════════════════════════════════
# Step 3: 自动保存 (无论前面结果)
# ═══════════════════════════════════════════════
if [ "$MODE" = "full" ]; then
  log ""
  log "━━━ Step 3/3: 自动保存 ━━━"

  if bash "$AUTOSAVE_SCRIPT" "orchestrator: 批量更新 $(date '+%Y-%m-%d %H:%M')" >> "$LOG_FILE" 2>&1; then
    log "  ✅ 自动保存完成"
    save_state "autosave" "success"
  else
    log "  ⚠️ 自动保存异常（非阻断）"
    save_state "autosave" "warning"
  fi
fi

# ═══════════════════════════════════════════════
# 汇总
# ═══════════════════════════════════════════════
log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$OVERALL_FAILED" = true ]; then
  log "  结果: ❌ 部分步骤失败 (请查看日志)"
  log "  $LOG_FILE"
  exit 1
else
  log "  结果: ✅ 全流程完成"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi
