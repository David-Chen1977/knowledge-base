#!/bin/bash
# ============================================================
#  auto-backup.sh — OpencodeWorkspace 自动周备份
#  由 launchd 每周一 9:00 自动触发
#  如需手动运行: bash ~/OpencodeWorkspace/_rebuild/auto-backup.sh
# ============================================================
WORKSPACE="$HOME/OpencodeWorkspace"
LOG="$WORKSPACE/_rebuild/backup.log"
REMOTE_OK=$(cd "$WORKSPACE" && git remote -v 2>/dev/null | head -1)

cd "$WORKSPACE" || { echo "❌ 无法进入 $WORKSPACE"; exit 1; }

echo "===== 周备份 $(date '+%Y-%m-%d %H:%M') =====" >> "$LOG"

# Git备份
git add -A >> "$LOG" 2>&1
git commit -m "周备份 $(date '+%Y-%m-%d')" >> "$LOG" 2>&1

# 仅在配置了远程仓库时推送
if [ -n "$REMOTE_OK" ]; then
    if git push >> "$LOG" 2>&1; then
        RESULT="✅ 已备份并推送到远程仓库"
    else
        RESULT="⚠️ 本地已备份，远程推送失败（检查网络或认证）"
    fi
else
    RESULT="💡 本地已备份，未配置远程仓库（仅本地安全）"
fi

echo "$RESULT" >> "$LOG"
echo "" >> "$LOG"

# 发送 macOS 通知
osascript -e "display notification \"$RESULT\" with title \"OpencodeWorkspace 周备份\" subtitle \"$(date '+%Y-%m-%d %H:%M')\"" 2>/dev/null

echo "$RESULT"
