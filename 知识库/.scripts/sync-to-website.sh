#!/bin/bash
# ============================================================
# 知识库→公开网站 自动同步脚本 v2
# 同步公开内容到 VitePress 网站目录
# ============================================================

KB="/Users/Admin/OpencodeWorkspace/知识库"
SITE="/Users/Admin/OpencodeWorkspace/知识库网站/docs"
LOG_FILE="$KB/.sync_log.txt"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
log "=== 知识库→网站 同步开始 ==="

CORE_FILES=(
  "MOC-赛道交叉图.md"
  "电力新能源/赛道总览.md"
  "电力新能源/关键术语表.md"
  "电力新能源/储能/产业链.md"
  "电力新能源/光伏/产业链.md"
  "电力新能源/风电/产业链.md"
  "电力新能源/氢能/产业链.md"
  "电力新能源/智能电网/新兴赛道.md"
  "电力新能源/碳市场/赛道文件.md"
  "电力新能源/电力市场/赛道文件.md"
  "算电协同/赛道总览.md"
  "算电协同/投资逻辑.md"
  "算电协同/数据中心+能源/赛道文件.md"
  "算电协同/节能用能体系深度分析.md"
  "AI/赛道总览.md"
  "AI/关键术语表.md"
  "AI/基础层/芯片与算力.md"
  "AI/模型层/大模型赛道.md"
  "AI/应用层/AI应用赛道.md"
)

RESEARCH_GLOBS=(
  "算电协同/_回流_*.md"
  "算电协同/_深化_*.md"
  "电力新能源/储能/_回流_*.md"
  "电力新能源/氢能/_回流_*.md"
  "AI/_回流_*.md"
)

PRIVATE_KW=("一级标的库" "估值基准" "变现商业模式" "汇竑资本" "写作风格参考" "文章质量标准" "质量检查标准")

sync=0
skip=0

do_sync() {
  local src="$1"
  local rel="${src#$KB/}"
  local dst="$SITE/$rel"
  [ -f "$src" ] || return 1
  for kw in "${PRIVATE_KW[@]}"; do
    basename "$src" | grep -qi "$kw" && { log "  🔒 跳过(私有文件名): $rel"; ((skip++)); return 1; }
  done
  if [ -f "$dst" ]; then
    sm=$(stat -f "%m" "$src" 2>/dev/null)
    dm=$(stat -f "%m" "$dst" 2>/dev/null)
    [ "$sm" -le "$dm" ] 2>/dev/null && { ((skip++)); return 1; }
  fi
  mkdir -p "$(dirname "$dst")" && cp "$src" "$dst" && log "  ✓ $rel" && ((sync++))
}

for f in "${CORE_FILES[@]}"; do do_sync "$KB/$f"; done
for g in "${RESEARCH_GLOBS[@]}"; do for f in $KB/$g; do [ -f "$f" ] && do_sync "$f"; done; done

log "✅ 同步: +$sync 跳过 $skip"
