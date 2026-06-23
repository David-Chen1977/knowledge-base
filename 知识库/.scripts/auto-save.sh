#!/bin/bash
# 知识库自动保存：检测变更→git commit
# 用法: ./auto-save.sh "更新描述"

cd /Users/Admin/OpencodeWorkspace
MSG="${1:-auto-save $(date '+%Y-%m-%d %H:%M')}"

if git diff --quiet 知识库/ && git diff --cached --quiet 知识库/; then
  echo "✓ 无变更，跳过"
  exit 0
fi

git add 知识库/
git commit -m "$MSG"
echo "✓ 已保存: $MSG"
