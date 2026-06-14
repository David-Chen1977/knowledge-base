#!/bin/bash
# codex-bridge 启动脚本
# 让 Codex App 通过 DeepSeek API 工作
# 使用方法: ./start-bridge.sh [start|stop|restart|logs]

PROXY_DIR="$HOME/OpencodeWorkspace/tools/codex-bridge"
PROXY_FILE="$PROXY_DIR/proxy.mjs"
ENV_FILE="$PROXY_DIR/.env"
LOG_FILE="/tmp/codex-bridge.log"
PID_FILE="/tmp/codex-bridge.pid"

node="$HOME/.local/bin/node"

case "${1:-start}" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
      echo "codex-bridge 已在运行 (PID $(cat "$PID_FILE"))"
      exit 0
    fi
    echo "启动 codex-bridge..."
    nohup "$node" --env-file="$ENV_FILE" "$PROXY_FILE" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 2
    if curl -sf http://127.0.0.1:4000/health > /dev/null 2>&1; then
      echo "✓ codex-bridge 已启动 (PID $(cat "$PID_FILE"))"
    else
      echo "✗ codex-bridge 启动失败，查看日志: $LOG_FILE"
    fi
    ;;
  stop)
    if [ -f "$PID_FILE" ]; then
      kill $(cat "$PID_FILE") 2>/dev/null && echo "✓ 已停止" || echo "✗ 停止失败"
      rm -f "$PID_FILE"
    else
      pkill -f "proxy.mjs" 2>/dev/null && echo "✓ 已停止" || echo "未运行"
    fi
    ;;
  restart)
    "$0" stop
    sleep 1
    "$0" start
    ;;
  logs)
    tail -f "$LOG_FILE"
    ;;
  *)
    echo "用法: $0 [start|stop|restart|logs]"
    ;;
esac
