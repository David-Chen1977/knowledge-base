#!/bin/bash
# ============================================================
#  双工具上下文同步脚本 v2
#  用途：OpenCode / WorkBuddy 向 state.json 同步状态
#  废弃：Hermes Agent（网络限制）
# ============================================================

TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
TOOL=${1:-unknown}
TASK=${2:-""}
OUTPUT=${3:-""}

WORKSPACE="/Users/Admin/.workbuddy/shared-workspace"
SYNC_SCRIPT="$WORKSPACE/scripts/sync-state.mjs"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 双工具状态同步${NC}"
echo -e "${BLUE}   工具：$TOOL${NC}"
echo -e "${BLUE}   任务：$TASK${NC}"
echo -e "${BLUE}   时间：$TIMESTAMP${NC}"

case $TOOL in
    opencode|workbuddy|pipeline)
        node "$SYNC_SCRIPT" "$TOOL" idle "$TASK" "$OUTPUT"
        echo -e "${GREEN}✅ 同步完成${NC}"
        ;;
    read)
        echo -e "${GREEN}📖 state.json 当前状态：${NC}"
        cat "$WORKSPACE/context/state.json"
        ;;
    *)
        echo -e "${YELLOW}用法：$0 {opencode|workbuddy|pipeline|read} [任务描述] [产出说明]${NC}"
        echo -e "${YELLOW}示例：$0 opencode \"公众号文章完成\" \"草稿箱media_id: xxx\"${NC}"
        exit 1
        ;;
esac
