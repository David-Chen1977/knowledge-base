#!/bin/bash
# start-watcher.sh
# 启动所有监听器（state-watcher + inbox-watcher）

echo "🚀 启动双工具协同监听器..."
echo "📁 工作目录: /Users/Admin/.workbuddy/shared-workspace"
echo ""

cd /Users/Admin/.workbuddy/shared-workspace

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 创建必要目录
mkdir -p logs
mkdir -p inbox
mkdir -p inbox/processed
mkdir -p config

# 启动 state-watcher（后台运行）
echo "👀 启动状态监听器 (state-watcher)..."
nohup node bridge/state-watcher.mjs > logs/watcher-stdout.log 2>&1 &
STATE_WATCHER_PID=$!
echo "✅ state-watcher 已启动 (PID: $STATE_WATCHER_PID)"

# 启动 inbox-watcher（后台运行）
echo "👀 启动收件箱监听器 (inbox-watcher)..."
nohup node bridge/inbox-watcher.mjs > logs/inbox-watcher-stdout.log 2>&1 &
INBOX_WATCHER_PID=$!
echo "✅ inbox-watcher 已启动 (PID: $INBOX_WATCHER_PID)"

echo ""
echo "✅ 所有监听器已启动"
echo "📝 日志文件:"
echo "   - logs/watcher.log (state-watcher)"
echo "   - logs/inbox-watcher-stdout.log (inbox-watcher)"
echo ""
echo "🛑 停止监听器:"
echo "   kill $STATE_WATCHER_PID $INBOX_WATCHER_PID"
echo ""
echo "💡 提示: 可以关闭此终端，监听器会继续运行"
echo "   查看日志: tail -f /Users/Admin/.workbuddy/shared-workspace/logs/watcher.log"

