#!/bin/bash
# test-serverchan.sh - 测试 Server酱 通知配置

echo "🧪 测试 Server酱 通知配置..."
echo ""

# 读取配置
CONFIG="/Users/Admin/.workbuddy/shared-workspace/config/notify-config.json"
if [ ! -f "$CONFIG" ]; then
    echo "❌ 配置文件不存在: $CONFIG"
    exit 1
fi

echo "✅ 配置文件存在"
echo ""

# 测试发送通知
echo "📤 发送测试通知..."
node /Users/Admin/.workbuddy/shared-workspace/bridge/serverchan-notify.mjs \
  "🎉 WorkBuddy 配置完成" \
  "Server酱 通知配置已成功！

✅ 配置完成时间: $(date)
✅ 推送服务: Server酱 (sct.ftqq.com)
✅ 推送目标: 你的个人微信

从此以后，WorkBuddy 的重要事件会第一时间推送到你的微信！" \
  2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 测试成功！请检查你的微信是否收到通知"
    echo ""
    echo "📝 接下来可以："
    echo "   1. 启动监听器: bash /Users/Admin/.workbuddy/shared-workspace/bridge/start-watcher.sh"
    echo "   2. 模拟管线阻塞: 修改 state.json 中的 pipeline.blocked 为 true"
    echo "   3. 观察是否收到微信通知"
else
    echo ""
    echo "❌ 测试失败，请检查配置"
fi
