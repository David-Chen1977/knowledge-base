#!/bin/bash
# ============================================================
# sync-to-website.sh v4 — 基于 visibility frontmatter 的安全同步
#
# v4 改进 (2026-06-23):
#   - 源改为 vault/，不再扫描旧 知识库/ 目录
#   - 废弃关键词黑名单：改为 frontmatter visibility:public 控制
#   - 保留目录结构和相对路径映射
# ============================================================

export PATH="/Users/Admin/.local/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

VAULT="/Users/Admin/OpencodeWorkspace/vault"
SITE_DOCS="/Users/Admin/OpencodeWorkspace/知识库网站/docs"
LOG_FILE="/Users/Admin/OpencodeWorkspace/知识库/.sync_log.txt"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
log "=== vault → 网站 同步 v4 ==="

# 检查上次失败标记
KB_DIR="/Users/Admin/OpencodeWorkspace/知识库"
[ -f "$KB_DIR/.build_failure" ] && log "⚠️ 上次构建失败: $(cat "$KB_DIR/.build_failure" | head -1)"
[ -f "$KB_DIR/.deploy_failure" ] && log "⚠️ 上次部署失败: $(cat "$KB_DIR/.deploy_failure" | head -1)"

# ── 前置检查 ──
NODE="/Users/Admin/.local/bin/node"
FM_CHECK="$VAULT/_scripts/apply-visibility.mjs"
if [ ! -d "$VAULT/10-知识库" ]; then
  log "❌ vault/10-知识库 不存在，请检查 vault 结构"
  exit 1
fi

# ── 确保所有文件都有 visibility frontmatter ──
log "▶ 运行 visibility 检查..."
$NODE "$FM_CHECK" --check >> "$LOG_FILE" 2>&1
# 不阻塞流程，仅记录

# ── 收集所有 visibility:public 的文件 ──
log "▶ 收集公开文件..."

sync=0
skip=0

while IFS= read -r -d '' md_file; do
  rel="${md_file#$VAULT/}"
  dst="$SITE_DOCS/$rel"

  # 读取 frontmatter 中的 visibility
  visibility=$(head -20 "$md_file" | grep -m1 '^visibility:' | sed 's/^visibility: *//; s/ *$//')

  # 跳过非公开文件
  if [ "$visibility" != "public" ]; then
    ((skip++))
    continue
  fi

  # 目标目录映射（去掉 10- 前缀的数字排序前缀）
  # vault/10-知识库/AI/xxx.md → docs/AI/xxx.md
  # vault/90-公開/xxx.md → docs/xxx.md
  dst_rel="$rel"
  # 对于 10-知识库/ 下的文件，去掉前缀
  dst_rel="${dst_rel#10-知识库/}"
  # 对于 90-公开/ 下的文件，直接映射
  dst_rel="${dst_rel#90-公开/}"
  dst="$SITE_DOCS/$dst_rel"

  # 检查是否有更新
  if [ -f "$dst" ]; then
    sm=$(stat -f "%m" "$md_file" 2>/dev/null)
    dm=$(stat -f "%m" "$dst" 2>/dev/null)
    [ "$sm" -le "$dm" ] 2>/dev/null && { ((skip++)); continue; }
  fi

  # 复制
  mkdir -p "$(dirname "$dst")"
  cp "$md_file" "$dst"
  log "  ✓ $dst_rel"
  ((sync++))
done < <(find "$VAULT" -name '*.md' -type f -not -path '*_scripts/*' -print0)

log "✅ 同步: +$sync 更新 / $skip 跳过"

# ── 如有新内容，自动构建并部署 ──
if [ "$sync" -gt 0 ]; then
  log "🚀 检测到 $sync 个文件更新，触发网站重新部署..."

  cd "/Users/Admin/OpencodeWorkspace/知识库网站" || exit

  if /Users/Admin/.local/bin/npm run build >> "$LOG_FILE" 2>&1; then
    log "  ✓ VitePress 构建成功"
    rm -f "$KB_DIR/.build_failure"

    # 删除 docs/ 中不再公开的旧文件（清理残留）
    log "  ▶ 清理已撤销公开的文件..."
    while IFS= read -r -d '' old_file; do
      old_rel="${old_file#$SITE_DOCS/}"
      # 检查是否还在 vault 中标记为 public
      vault_candidates=$(find "$VAULT" -name "$(basename "$old_file")" -type f 2>/dev/null)
      still_public=false
      for vf in $vault_candidates; do
        vis=$(head -20 "$vf" | grep -m1 '^visibility:' | sed 's/^visibility: *//; s/ *$//')
        [ "$vis" = "public" ] && still_public=true && break
      done
      if [ "$still_public" = false ]; then
        rm -f "$old_file"
        log "  🗑 移除 $old_rel (已不再公开)"
      fi
    done < <(find "$SITE_DOCS" -name '*.md' -type f -print0)

    git add -A . >> "$LOG_FILE" 2>&1
    git diff --cached --quiet || git commit -m "auto-sync: vault内容同步 $(date '+%Y-%m-%d %H:%M')" >> "$LOG_FILE" 2>&1
    if git push origin main >> "$LOG_FILE" 2>&1; then
      log "  ✓ git push 成功 → Vercel auto-deploy"
      rm -f "$KB_DIR/.deploy_failure"
    else
      log "  ⚠️ git push 失败"
      date '+%Y-%m-%d %H:%M:%S' > "$KB_DIR/.deploy_failure"
    fi
  else
    log "  ⚠️ VitePress 构建失败"
    date '+%Y-%m-%d %H:%M:%S' > "$KB_DIR/.build_failure"
  fi

  cd - > /dev/null
fi
