# 知识库网站部署指南

## 站点概况

| 项目 | 内容 |
|------|------|
| 框架 | VitePress v1.6.x |
| 内容 | 54份公开文档（赛道总览+产业链+研究+深化） |
| 源码 | `/Users/Admin/OpencodeWorkspace/知识库网站/` |
| 构建 | `npm run build` → `docs/.vitepress/dist/` |
| 本地预览 | `npm run preview` → http://localhost:4173 |

---

## 部署步骤（2分钟）

### 1. 创建 GitHub 公开仓库

浏览器打开 [https://github.com/new](https://github.com/new)：

- **Repository name**: `knowledge-base`（或你喜欢的名字）
- **Visibility**: Public
- **不要勾选** Initialize with README/.gitignore/license

点 **Create repository**。

### 2. 推送代码

在仓库创建页出现后，复制这三条命令到终端执行：

```bash
cd /Users/Admin/OpencodeWorkspace/知识库网站
git remote add origin https://github.com/你的用户名/knowledge-base.git
git push -u origin main
```

### 3. 部署到 Vercel

浏览器打开 [https://vercel.com/new](https://vercel.com/new)：

1. **Import Git Repository** → 选刚创建的 `knowledge-base`
2. **Framework Preset**: 选 **VitePress**（Vercel 会自动识别 `vercel.json`）
3. 其余默认 → 点 **Deploy**

约 30 秒后部署完成，Vercel 会给你一个 `xxx.vercel.app` 域名。

### 4. 配置自定义域名（可选）

在 Vercel 项目设置 → Domains → 添加你的域名。

---

## 日常更新内容

以后知识库有新内容时：

```bash
cd /Users/Admin/OpencodeWorkspace/知识库网站

# 从主知识库同步新文件
# （手动复制需要公开的新文件到 docs/）

git add docs/
git commit -m "feat: 更新XXX内容"
git push

# Vercel 自动触发重新部署
```
