#!/bin/bash
# ============================================================
#  auto-backup.sh — OpencodeWorkspace 自动周备份
#  由 launchd 每周触发，备份后发送 macOS 通知
# ============================================================
WORKSPACE="$HOME/OpencodeWorkspace"
LOG="$WORKSPACE/_rebuild/backup.log"

cd "$WORKSPACE" || { echo "❌ 无法进入 $WORKSPACE"; exit 1; }

echo "===== 周备份 $(date '+%Y-%m-%d %H:%M') =====" >> "$LOG"

# Git备份
git add -A >> "$LOG" 2>&1
git commit -m "周备份 $(date '+%Y-%m-%d')" >> "$LOG" 2>&1

if git push >> "$LOG" 2>&1; then
    RESULT="✅ 备份成功"
else
    RESULT="⚠️ 备份完成（推送失败，可手动 git push）"
fi

echo "$RESULT" >> "$LOG"
echo "" >> "$LOG"

# 发送 macOS 通知
osascript -e "display notification "$RESULT" with title "OpencodeWorkspace 周备份" subtitle "$(date '+%Y-%m-%d %H:%M')"" 2>/dev/null

echo "$RESULT"
