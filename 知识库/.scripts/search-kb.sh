#!/bin/bash
# 知识库全文搜索入口 — 零依赖，纯 grep
# 用法: ./search-kb.sh "关键词"      基本搜索
#       ./search-kb.sh -i "关键词"   忽略大小写
#       ./search-kb.sh -c "词"       仅计数

KB_DIR="/Users/Admin/OpencodeWorkspace/知识库"
CASE=""
COUNT=""
while getopts "ic" opt; do
  case $opt in i) CASE="-i" ;; c) COUNT="-c" ;; *) exit 1 ;; esac
done
shift $((OPTIND-1))
QUERY="$*"
[ -z "$QUERY" ] && { echo "用法: search-kb.sh [-i] [-c] <词>"; echo "示例: search-kb.sh 数据中心 绿电"; exit 0; }
echo "🔍 搜索: $QUERY (KB: $KB_DIR)"
grep $CASE $COUNT -rn --include='*.md' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.scripts "$QUERY" "$KB_DIR" 2>/dev/null | head -60
echo "--- 完成 ---"
