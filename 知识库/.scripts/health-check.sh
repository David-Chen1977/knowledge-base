#!/bin/bash
# ============================================================
# health-check.sh — 人机协同系统一键健康检查 v1
# 检查三个仓库 + 构建状态 + 部署日志
# 用法: ./health-check.sh              # 标准检查
#       ./health-check.sh --verbose    # 详细信息
#       ./health-check.sh --ci         # 机器可读(exit code only)
# ============================================================

set -euo pipefail

KB_DIR="/Users/Admin/OpencodeWorkspace/知识库"
SITE_DIR="/Users/Admin/OpencodeWorkspace/知识库网站"
PERSONAL_DIR="/Users/Admin/OpencodeWorkspace/personal-website"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass=0
fail=0
warn=0

check() {
  local label="$1" status="$2" msg="${3:-}"
  if [ "$status" = "PASS" ]; then
    echo -e "  ${GREEN}✅ PASS${NC}  $label"
    pass=$((pass + 1))
  elif [ "$status" = "WARN" ]; then
    echo -e "  ${YELLOW}⚠️  WARN${NC}  $label: $msg"
    warn=$((warn + 1))
  else
    echo -e "  ${RED}❌ FAIL${NC}  $label: $msg"
    fail=$((fail + 1))
  fi
}

echo ""
echo "══════════════════════════════════════════════"
echo "  人机协同系统 · 健康检查"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════════"
echo ""

# ── 1. 仓库检查 ──
echo "━━━ 1/6  仓库状态 ━━━"

check_repo() {
  local name="$1" dir="$2" subpath="${3:-}"
  cd "$dir"
  if [ -n "$subpath" ]; then
    status=$(git status --short -- "$subpath" 2>/dev/null | wc -l | tr -d ' ')
  else
    status=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
  fi
  upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
  if [ -n "$upstream" ]; then
    behind=$(git log --oneline ..@{u} 2>/dev/null | wc -l | tr -d ' ')
    ahead=$(git log --oneline @{u}.. 2>/dev/null | wc -l | tr -d ' ')
  else
    behind=0; ahead=0
  fi
  if [ "$status" = "0" ] && [ "$behind" = "0" ]; then
    check "$name" "PASS"
  elif [ "$status" != "0" ]; then
    check "$name" "FAIL" "$status 个未提交变更"
  fi
  if [ "$behind" != "0" ]; then
    check "$name 落后远程" "WARN" "$behind 个提交未拉取"
  fi
}

check_repo "知识库" "/Users/Admin/OpencodeWorkspace" "知识库/"
check_repo "知识库网站" "$SITE_DIR" ""
check_repo "personal-website" "$PERSONAL_DIR" ""

# ── 2. 构建检查 ──
echo ""
echo "━━━ 2/6  构建状态 ━━━"

# 知识库网站
if [ -f "$SITE_DIR/package.json" ]; then
  if [ -d "$SITE_DIR/node_modules" ]; then
    check "知识库网站 node_modules" "PASS"
  else
    check "知识库网站 node_modules" "FAIL" "未安装依赖"
  fi
fi

# 个人网站
if [ -f "$PERSONAL_DIR/package.json" ]; then
  if [ -d "$PERSONAL_DIR/node_modules" ]; then
    # 快速检查关键包
    if [ -f "$PERSONAL_DIR/node_modules/.bin/astro" ]; then
      check "个人网站 node_modules" "PASS"
    else
      check "个人网站 node_modules" "WARN" "存在但 astro 未就绪"
    fi
  else
    check "个人网站 node_modules" "FAIL" "未安装依赖"
  fi
fi

# ── 3. 部署失败标记 ──
echo ""
echo "━━━ 3/6  部署失败标记 ━━━"

for marker in ".build_failure" ".deploy_failure" ".data_refresh_failure"; do
  if [ -f "$KB_DIR/$marker" ]; then
    check "$marker" "FAIL" "$(cat "$KB_DIR/$marker" | head -1)"
  else
    check "$marker" "PASS"
  fi
done

# ── 4. 日志时效性 ──
echo ""
echo "━━━ 4/6  日志最近更新 ━━━"

now=$(date +%s)
for logf in ".sync_log.txt" ".refresh_log.txt" ".deploy_log.txt"; do
  f="$KB_DIR/$logf"
  if [ -f "$f" ]; then
    age=$(( (now - $(stat -f %m "$f")) / 3600 ))
    last=$(tail -1 "$f" 2>/dev/null | sed 's/^\[//' | cut -d']' -f1)
    if [ "$age" -le 24 ]; then
      check "$logf" "PASS" "${age}h 前更新"
    elif [ "$age" -le 72 ]; then
      check "$logf" "WARN" "${age}h 前更新"
    else
      check "$logf" "WARN" "${age}h 前更新（可能已停）"
    fi
  else
    check "$logf" "WARN" "文件不存在"
  fi
done

# ── 5. 移动硬盘备份状态 ──
echo ""
echo "━━━ 5/6  备份状态 ━━━"

BACKUP_PATH="/Volumes/移动硬盘/人机协同系统备份"
if [ -d "$BACKUP_PATH" ]; then
  backup_time=$(stat -f "%Sm" "$BACKUP_PATH" 2>/dev/null)
  backup_size=$(du -sh "$BACKUP_PATH" 2>/dev/null | cut -f1)
  check "移动硬盘备份" "PASS" "$backup_size — $backup_time"
else
  check "移动硬盘备份" "WARN" "未找到备份目录"
fi

# ── 6. 人机协同系统关键文件 ──
echo ""
echo "━━━ 6/6  关键文件完整性 ━━━"

for f in "$KB_DIR/.scripts/deploy.sh" "$KB_DIR/.scripts/sync-to-website.sh" \
         "$KB_DIR/.scripts/refresh-all.sh" "$KB_DIR/.scripts/health-check.sh" \
         "/Users/Admin/OpencodeWorkspace/SYSTEM_CORE.md"; do
  if [ -f "$f" ]; then
    check "$(basename "$f")" "PASS"
  else
    check "$(basename "$f")" "FAIL" "文件缺失"
  fi
done

# ── 汇总 ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  结果: ${GREEN}$pass PASS${NC} / ${YELLOW}$warn WARN${NC} / ${RED}$fail FAIL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $fail
