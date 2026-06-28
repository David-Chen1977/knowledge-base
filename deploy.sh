#!/bin/bash
# deploy.sh — 一键构建+部署个人网站到 Cloudflare Pages
# 用法: ./deploy.sh
set -e

SITE_DIR="/Users/Admin/OpencodeWorkspace/personal-website"

# 从 Keychain 读取 token（同 wenyan-mcp 模式）
TOKEN=$(security find-generic-password -a 'opencode-human-collab' -s 'cloudflare-api-token' -w 2>/dev/null || true)

if [ -z "$TOKEN" ]; then
  echo ""
  echo "=============================================="
  echo "  ❌ Cloudflare API Token 未设置"
  echo "=============================================="
  echo ""
  echo "  请在 Keychain 中设置:"
  echo ""
  echo "    security add-generic-password \\"
  echo "      -a 'opencode-human-collab' \\"
  echo "      -s 'cloudflare-api-token' \\"
  echo "      -w '你的token'"
  echo ""
  echo "  Token 获取: Cloudflare Dashboard → My Profile → API Tokens"
  echo "  权限要求: Cloudflare Pages → Edit"
  echo ""
  exit 1
fi

echo "🚀 构建网站..."
cd "$SITE_DIR"
npm run build

echo "☁️  部署到 Cloudflare Pages..."
CLOUDFLARE_API_TOKEN="$TOKEN" npx wrangler pages deploy dist --project-name chendaolei-website

echo ""
echo "✅ 部署完成: https://chendaolei-website.pages.dev"
