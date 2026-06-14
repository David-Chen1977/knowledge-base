# iPhone 快捷指令配置指南

> 让 iPhone 能一键发送内容到 Mac 上的 WorkBuddy/OpenCode

---

## 快捷指令功能

**名称**: "发送到 WorkBuddy"

**功能**: 在任何 APP（微信、 Safari 、照片、文件）的分享菜单中，一键发送内容到 Mac

**支持的内容类型**:
- 文字（选中文本、输入框文字）
- 图片（照片、截图）
- 网页链接
- 文件（PDF、Word、Excel）

---

## 创建步骤

### 步骤 1：打开快捷指令 APP

1. 在 iPhone 上打开"快捷指令" APP
2. 点击右上角 "+" 创建新快捷指令
3. 命名："发送到 WorkBuddy"

### 步骤 2：添加"选择文件"动作

1. 搜索"选择文件" → 添加到快捷指令
2. 开启"选择多个"选项

### 步骤 3：添加"获取文件内容"动作

1. 搜索"获取文件内容" → 添加
2. 这会读取文件的实际内容（文字/图片）

### 步骤 4：添加"如果"条件判断

根据不同的内容类型，执行不同的操作：

#### 情况 A：文字内容

1. 搜索"写入文件" → 添加
2. 文件路径：`iCloud Drive/workbuddy-inbox/[时间戳].txt`
3. 开启"覆盖已存在的文件"

#### 情况 B：图片内容

1. 搜索"写入文件" → 添加
2. 文件路径：`iCloud Drive/workbuddy-inbox/[时间戳].jpg`

#### 情况 C：网页链接

1. 搜索"获取网页内容" → 添加
2. 提取标题和摘要
3. 搜索"写入文件" → 添加
4. 文件路径：`iCloud Drive/workbuddy-inbox/[标题].md`

### 步骤 5：添加通知

1. 搜索"显示通知" → 添加
2. 通知内容："✅ 已发送到 WorkBuddy"

---

## 使用方法

### 从微信发送

1. 长按消息 → 选择"更多" → 点击分享按钮
2. 选择"快捷指令" → "发送到 WorkBuddy"
3. 内容会自动保存到 iCloud Drive/workbuddy-inbox/
4. Mac 上的 inbox-watcher 会自动检测并处理

### 从 Safari 发送

1. 点击分享按钮 → 选择"快捷指令" → "发送到 WorkBuddy"
2. 网页标题和内容会保存为 Markdown 文件
3. Mac 上的 WorkBuddy 会自动处理

### 从照片 APP 发送

1. 选择照片 → 分享 → "快捷指令" → "发送到 WorkBuddy"
2. 图片会保存到收件箱
3. Mac 上的 WorkBuddy 可以 OCR 提取文字

---

## 高级用法

### 自动添加标签

在快捷指令中添加"文本"动作，在内容开头添加标签：
```
#投资研究 #液冷赛道 
[原始内容]
```

### 自动分类

根据内容来源自动分类：
- 微信 → `workbuddy-inbox/wechat/`
- Safari → `workbuddy-inbox/web/`
- 照片 → `workbuddy-inbox/photos/`

### 自动触发 WorkBuddy

在快捷指令最后添加"运行快捷指令"动作，调用 WorkBuddy API（需要配置）

---

## 故障排查

### 快捷指令不显示在分享菜单

1. 打开快捷指令 APP
2. 长按"发送到 WorkBuddy" → 点击"详细信息"
3. 开启"在分享表中显示"

### 文件没有同步到 Mac

1. 检查 iPhone 和 Mac 是否登录同一 iCloud 账号
2. 检查 iCloud Drive 是否已启用
3. 手动打开"文件" APP → iCloud Drive → 确认文件存在

### Mac 上没有检测到文件

1. 检查 inbox-watcher 是否正在运行
2. 查看日志：`tail -f logs/inbox-watcher-stdout.log`
3. 手动将文件移动到 `inbox/` 目录测试

---

## 完整快捷指令下载

（待创建：可以导出一个 .shortcut 文件，用户直接导入即可）

---

## 下一步

配置完成后，测试一下：
1. 在微信中找一条消息
2. 分享 → 快捷指令 → "发送到 WorkBuddy"
3. 检查 Mac 上的 `inbox/` 目录是否有新文件
4. 检查 `brain/context-log.json` 是否有记录
