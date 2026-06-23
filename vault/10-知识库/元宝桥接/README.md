---
updated: 2026-06-23
visibility: private
---
# 元宝桥接

**用途：** 腾讯元宝 ↔ OpenCode 文件级通信桥

---

## 使用方式

### P0 — 手动粘贴

1. 在元宝里复制内容
2. 在这里新建文件：`YYYY-MM-DD-标题.md`
3. OpenCode 自动读取

### P1 — 剪辑板代理脚本（推荐）

```bash
# 手动运行：把当前剪贴板内容存为一个新文件
python3 clip-import.py

# 会自动创建文件：YYYY-MM-DD-HHMMSS-元宝导入.md
```

### P2 — 本地 HTTP 桥（可选）

```bash
# 启动接收服务（端口 8899）
python3 http-bridge.py

# 然后从元宝/浏览器 POST 内容到 http://localhost:8899/import
# curl -X POST http://localhost:8899/import -H "Content-Type: text/plain" -d "内容"
```

---

## 桥接流程

```
用户：在元宝看到有价值内容 → 复制
  ↓
P1脚本：clip-import.py 检测剪贴板 → 保存为时间戳文件
  ↓
OpenCode：读取文件 → 分析/归档/产出
  ↓
用户：在 OpenCode 中协作完善 → 写文章/建知识库
```
