#!/bin/bash
# ============================================================
# deploy.sh — 统一部署入口 v1
# 一条命令触发两站部署：知识库网站(Vercel) + 个人网站(Cloudflare)
# 用法:
#   ./deploy.sh           # 两站都部署
#   ./deploy.sh --kb-only # 仅知识库网站
#   ./deploy.sh --site-only # 仅个人网站
# ============================================================

set -euo pipefail

KB_DIR="/Users/Admin/OpencodeWorkspace/知识库"
KB_SITE_DIR="/Users/Admin/OpencodeWorkspace/知识库网站"
PERSONAL_SITE_DIR="/Users/Admin/OpencodeWorkspace/personal-website"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="$KB_DIR/.deploy_log.txt"
SYNC_LOG="$KB_DIR/.sync_log.txt"

log() { echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"; }

# ---- 参数解析 ----
DO_KB=true
DO_SITE=true
for arg in "$@"; do
  case "$arg" in
    --kb-only) DO_SITE=false ;;
    --site-only) DO_KB=false ;;
    --help|-h)
      echo "用法: ./deploy.sh [--kb-only|--site-only|--help]"
      exit 0
      ;;
  esac
done

log "═══════════════════════════════════════════"
log "  统一部署 v1  —  $TIMESTAMP"
log "═══════════════════════════════════════════"

# ============================================================
# 1. 知识库网站 — 同步 + 构建 + git push → Vercel auto-deploy
# ============================================================
if [ "$DO_KB" = true ]; then
  echo ""
  echo "━━━ 1/2  知识库网站（VitePress → Vercel）━━━"
  echo ""

  if [ -f "$KB_DIR/.scripts/sync-to-website.sh" ]; then
    log "▶ 知识库同步开始..."
    if bash "$KB_DIR/.scripts/sync-to-website.sh" 2>&1 | tee -a "$LOG_FILE"; then
      log "✅ 知识库同步完成"
    else
      log "❌ 知识库同步失败（详情见 $SYNC_LOG）"
      echo "⚠️  知识库同步失败，请检查 $SYNC_LOG"
    fi
  else
    log "⚠️  未找到 sync-to-website.sh"
  fi
fi

# ============================================================
# 2. 个人网站 — git push → GitHub Actions → Cloudflare Pages
# ============================================================
if [ "$DO_SITE" = true ]; then
  echo ""
  echo "━━━ 2/2  个人网站（Astro → Cloudflare Pages）━━━"
  echo ""

  if [ -d "$PERSONAL_SITE_DIR" ]; then
    log "▶ 个人网站部署开始..."

    cd "$PERSONAL_SITE_DIR"

    # 先拉取最新代码避免冲突
    git pull --ff-only origin main 2>/dev/null && log "  ✓ git pull 同步远程" || log "  - git pull 跳过（可能无远程跟踪）"

    # 检查是否有变更
    if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
      log "  - 个人网站无变更，跳过部署"
      echo "    个人网站无变更，跳过"
    else
      # 本地构建验证
      log "  ▶ Astro 构建检查..."
      if npm run build >> "$LOG_FILE" 2>&1; then
        log "  ✅ Astro 构建成功"
        echo "    ✓ Astro 构建通过"

        # 提交并推送
        git add -A .
        git commit -m "deploy: 自动部署 $(date '+%Y-%m-%d %H:%M')" >> "$LOG_FILE" 2>&1 || true
        if git push origin main >> "$LOG_FILE" 2>&1; then
          log "  ✅ git push 成功 → GitHub Actions 触发 Cloudflare Pages 部署"
          echo "    ✓ 已推送 → GitHub Actions 自动部署"
        else
          log "  ⚠️  git push 失败"
          echo "    ⚠️  推送失败，请检查网络"
        fi
      else
        log "  ❌ Astro 构建失败"
        echo "    ❌ 个人网站构建失败，推送已中止"
      fi
    fi

    cd - > /dev/null
  else
    log "⚠️  个人网站目录不存在: $PERSONAL_SITE_DIR"
    echo "    ⚠️  个人网站目录未挂载: $PERSONAL_SITE_DIR"
  fi
fi

# ============================================================
# 3. 总结
# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  部署报告  —  $TIMESTAMP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$DO_KB" = true ]; then
  KB_STATUS="$(tail -3 "$SYNC_LOG" 2>/dev/null | grep -c '✓\|成功')"
  [ "$KB_STATUS" -gt 0 ] && echo "  知识库网站: ✅ 已推送 Vercel" || echo "  知识库网站: ⚠️  请检查日志"
fi
if [ "$DO_SITE" = true ]; then
  echo "  个人网站:  ✅ 已推送 GitHub Actions"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "═══════════════════════════════════════════"
log "  部署完成"
log "═══════════════════════════════════════════"
