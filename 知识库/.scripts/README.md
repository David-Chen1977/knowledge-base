# 知识库自动刷新脚本

## 手动刷新

在对话中说：
- `刷新全部` — 全量刷新所有赛道数据
- `刷新 [赛道名]` — 增量刷新单个赛道

## 定时自动刷新（launchd）

本项目提供 launchd plist 实现每日自动刷新。

### 安装

```bash
# 1. 确保脚本可执行
chmod +x /Users/Admin/OpencodeWorkspace/知识库/refresh_knowledge_base.sh

# 2. 复制 plist 到 LaunchAgents
cp /Users/Admin/OpencodeWorkspace/知识库/.scripts/com.knowledgebase.refresh.plist ~/Library/LaunchAgents/

# 3. 加载（每天 9:00 自动触发）
launchctl load ~/Library/LaunchAgents/com.knowledgebase.refresh.plist

# 4. 验证
launchctl list | grep knowledgebase
```

### 查看刷新日志

```bash
cat /Users/Admin/OpencodeWorkspace/知识库/.refresh_log.txt
```

### 卸载

```bash
launchctl unload ~/Library/LaunchAgents/com.knowledgebase.refresh.plist
rm ~/Library/LaunchAgents/com.knowledgebase.refresh.plist
```

## 数据新鲜度

刷新后更新 `.data_refresh_status.json` 中的 `last_refresh` 时间戳。
各赛道文件首页的 `数据获取：YYYY-MM-DD` 也会同步更新。
