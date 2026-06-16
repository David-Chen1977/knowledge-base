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

# 所有赛道的 回流/深化/思考/会议 文件均自动同步
# 匹配: 任一目录下的 _回流_* _深化_* _思考_* _会议_* 文件
RESEARCH_GLOBS=(
  "*/_回流_*.md"
  "*/_深化_*.md"
  "*/_思考_*.md"
  "*/_会议_*.md"
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

# 如有新内容，自动构建并部署到 Vercel
if [ "$sync" -gt 0 ]; then
  log "🚀 检测到 $sync 个文件更新，触发网站重新部署..."
  
  cd "/Users/Admin/OpencodeWorkspace/知识库网站" || exit
  
  # 构建
  if npm run build >> "$LOG_FILE" 2>&1; then
    log "  ✓ VitePress 构建成功"
    
    # 部署到 Vercel (从项目根目录部署, vercel.json 中 framework=null 跳过 npm install)
    if npx vercel deploy --prod --yes --project knowledge-base-site >> "$LOG_FILE" 2>&1; then
      log "  ✓ Vercel 部署成功 → https://knowledge-base-site-iota.vercel.app"
    else
      log "  ⚠️ Vercel 部署失败（可手动重试）"
    fi
  else
    log "  ⚠️ VitePress 构建失败"
  fi
  
  cd - > /dev/null
fi
