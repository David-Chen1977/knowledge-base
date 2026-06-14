#!/bin/bash
# ============================================================
#  双工具协同系统 v3 — 安装验证脚本
#  验证 OpenCode + WorkBuddy 的互联互通配置
#  新增: 共享大脑(brain/)、信号通知(signals/)、交接包(handoff/)
#  废弃: Hermes
# ============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  双工具协同系统 v2 — 安装验证${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

PASS=0
FAIL=0

check() {
    local name=$1
    local result=$2
    if [ "$result" -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $name"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} - $name"
        ((FAIL++))
    fi
}

GOOD=0
WARN=0
checkw() {
    local name=$1
    local result=$2
    if [ "$result" -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $name"
        ((GOOD++))
    else
        echo -e "${YELLOW}⚠️  WARN${NC} - $name（可选）"
        ((WARN++))
    fi
}

# ============================================================
# 1. 验证共享工作区核心结构
# ============================================================
echo -e "${YELLOW}[1/6] 验证共享工作区...${NC}"
SW="/Users/Admin/.workbuddy/shared-workspace"
check "共享工作区目录存在" $([ -d "$SW" ]; echo $?)

check "state.json 存在（核心状态文件）" $([ -f "$SW/context/state.json" ]; echo $?)
check "sync-state.mjs 存在（状态同步脚本）" $([ -f "$SW/scripts/sync-state.mjs" ]; echo $?)
checkw "旧 PROJECT_STATE.md 已标记废弃" $([ -f "$SW/context/PROJECT_STATE.md" ] && grep -q "废弃" "$SW/context/PROJECT_STATE.md"; echo $?)
checkw "旧 TOOL_STATUS.md 已标记废弃" $([ -f "$SW/context/TOOL_STATUS.md" ] && grep -q "废弃" "$SW/context/TOOL_STATUS.md"; echo $?)
checkw "旧 SHARED_CONTEXT.md 已标记废弃" $([ -f "$SW/context/SHARED_CONTEXT.md" ] && grep -q "废弃" "$SW/context/SHARED_CONTEXT.md"; echo $?)

# ============================================================
# 2. 验证 OpenCode 配置
# ============================================================
echo ""
echo -e "${YELLOW}[2/6] 验证 OpenCode...${NC}"
if command -v opencode &> /dev/null; then
    check "OpenCode 已安装" 0
    checkw "shared-workspace MCP 已配置" $(grep -q "shared-workspace" "/Users/Admin/.config/opencode/opencode.jsonc" 2>/dev/null; echo $?)
else
    check "OpenCode 已安装" 1
fi

# ============================================================
# 3. 验证 state.json 格式
# ============================================================
echo ""
echo -e "${YELLOW}[3/6] 验证 state.json 格式...${NC}"
if python3 -c "import json; json.load(open('$SW/context/state.json'))" 2>/dev/null; then
    check "state.json JSON 格式正确" 0
    # 检查必要字段
    python3 -c "
import json
s = json.load(open('$SW/context/state.json'))
assert 'openCode' in s, '缺少 openCode'
assert 'workBuddy' in s, '缺少 workBuddy'
assert 'pipeline' in s, '缺少 pipeline'
assert 'project' in s, '缺少 project'
assert 'operationLog' in s, '缺少 operationLog'
print('所有必要字段存在')
" && check "state.json 必要字段完整" 0 || check "state.json 必要字段完整" 1
else
    check "state.json JSON 格式正确" 1
fi

# ============================================================
# 4. 验证 sync-state.mjs 可用性
# ============================================================
echo ""
echo -e "${YELLOW}[4/6] 验证 sync-state.mjs...${NC}"
node "$SW/scripts/sync-state.mjs" opencode idle "验证测试" 2>&1 | grep -q "state.json 已同步"
if [ $? -eq 0 ]; then
    check "sync-state.mjs 可执行" 0
else
    check "sync-state.mjs 可执行" 1
fi

# ============================================================
# 5. 验证 MCP 文件系统服务器
# ============================================================
echo ""
echo -e "${YELLOW}[5/6] 验证 MCP 文件系统服务器...${NC}"
checkw "MCP filesystem 包可用" $(npx -y @modelcontextprotocol/server-filesystem --help &>/dev/null; echo $?)

# ============================================================
# 6. 验证工作流文档
# ============================================================
echo ""
echo -e "${YELLOW}[6/6] 验证工作流文档...${NC}"
WF="/Users/Admin/OpencodeWorkspace/人机协同/工作流"
checkw "三件套生产工作流" $([ -f "$WF/01_三件套生产工作流.md" ]; echo $?)
checkw "行业研究快速响应工作流" $([ -f "$WF/02_行业研究快速响应工作流.md" ]; echo $?)
checkw "心跳同步规范" $([ -f "$WF/03_双工具心跳同步规范.md" ]; echo $?)
checkw "交接点检查清单" $([ -f "$WF/04_双工具交接点检查清单.md" ]; echo $?)
checkw "管线健壮化策略" $([ -f "$WF/05_管线健壮化策略.md" ]; echo $?)
checkw "质量门禁集成策略" $([ -f "$WF/06_质量门禁集成策略.md" ]; echo $?)

# ============================================================
# 总结
# ============================================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  验证完成${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "  ${GREEN}✅ 通过${NC}：$PASS"
echo -e "  ${RED}❌ 失败${NC}：$FAIL"
echo -e "  ${YELLOW}⚠️  警告/可选${NC}：$WARN"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 双工具协同系统 v2 验证通过！${NC}"
    echo ""
    echo -e "下一步："
    echo -e "  1. WorkBuddy 配置定时任务（每5分钟读取 state.json）"
    echo -e "  2. WorkBuddy 配置 workbuddy-visualization-bridge.mjs"
    echo -e "  3. 开始第一次双工具协同生产测试"
else
    echo -e "${RED}⚠️  有 $FAIL 项失败，请修复后重新验证${NC}"
fi
