#!/usr/bin/env node
/**
 * content-distributor.mjs — 内容多平台自动分发系统
 *
 * 以公众号文章为源，生成各平台优化版本 + 发布清单
 *
 * 用法:
 *   node content-distributor.mjs <文章.md> [--publish]
 *
 * 示例:
 *   node content-distributor.mjs 三件套输出/05_公众号文章.md
 *   node content-distributor.mjs 三件套输出/05_公众号文章.md --publish
 *
 * 输出:
 *   output/<slug>/
 *   ├── source.md           # 原文备份
 *   ├── zhihu.md            # 知乎优化版
 *   ├── toutiao.md          # 头条优化版
 *   ├── baijiahao.md        # 百家号优化版
 *   ├── 36kr.md             # 36氪/虎嗅投稿版
 *   └── manifest.json       # 发布清单（含状态追踪）
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_ROOT = resolve(__dirname, '..', '内容输出', '分发批次');

// ── 工具 ──

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '_')
    .replace(/^_|_$/g, '').slice(0, 50);
}

function now() { return new Date().toISOString(); }

function today() { return new Date().toISOString().slice(0, 10); }

function extractTitle(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : basename(process.argv[2] || '文章').replace(/\.md$/, '');
}

function extractFirstPara(md) {
  // Get first meaningful paragraph
  const lines = md.split('\n');
  for (const line of lines) {
    const t = line.replace(/^[#>]*\s*/, '').trim();
    if (t.length > 20 && !t.startsWith('![')) return t;
  }
  return '';
}

// ── 各平台适配器 ──

function cleanBody(text) {
  return text.replace(/!\[.*?\]\n*/g, '').replace(/\n{3,}/g, '\n\n');
}

function adaptForZhihu(title, body, sourceMd) {
  return `# ${title}

> 本文首发于微信公众号「道雷」，作者系北京大学光华管理学院硕士、一级市场股权投资人，专注电力新能源+AI赛道。

---

${cleanBody(body)}

---

**关于我：**
道雷，北京大学光华管理学院硕士，PE/VC投资人，专注电力新能源与AI基础设施赛道。

**话题标签：**
#电力能源 #AI基础设施 #PE投资 #算电协同 #液冷 #一级市场
`;
}

function adaptForToutiao(title, body, sourceMd) {
  // Toutiao: strong hook, short paragraphs, remove image placeholders
  const lines = sourceMd.split('\n');
  // Find the first true body paragraph (not title, not images, not blockquotes)
  let hook = '';
  for (const line of lines) {
    const t = line.replace(/^[#>\s]*/, '').trim();
    if (t.length > 15 && !t.startsWith('![') && !t.startsWith('http')) {
      hook = t; break;
    }
  }

  // Clean body: remove image placeholders, reduce paragraph length
  let cleanBody = body
    .replace(/!\[.*?\]\n*/g, '')  // Remove image placeholders
    .split('\n').map(line => {
      // Break long paragraphs for mobile reading
      if (line.length > 80 && !line.startsWith('#')) {
        return line.replace(/[。！？]/g, '$&\n');
      }
      return line;
    }).join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return `# ${title}

${hook}

---

${cleanBody}

---

（基于公开信息整理，不构成投资建议）
`;
}

function adaptForBaijiahao(title, body, sourceMd) {
  return `# ${title}

${cleanBody(body)}

---

> 声明：本文基于公开信息整理，仅供参考，不构成投资建议。
`;
}

function adaptFor36kr(title, body, sourceMd) {
  return `# ${title}

> 发表于 2026-06-14  |  作者：道雷

${cleanBody(body)}

---

**作者简介：**
道雷，北京大学光华管理学院硕士，一级市场股权投资人。专注电力新能源与AI基础设施赛道的研究与投资。个人微信公众号「道雷」，个人网站：chendaolei-website.pages.dev

**转载联系：**
转载请联系作者获取授权。
`;
}

// ── 核心逻辑 ──

function distribute(sourcePath, autoPublish = false) {
  if (!existsSync(sourcePath)) {
    console.error('❌ 文章不存在:', sourcePath);
    process.exit(1);
  }

  const md = readFileSync(sourcePath, 'utf-8');
  const title = extractTitle(md);

  // Split front matter and body
  const parts = md.split(/^## /m);
  const firstLines = md.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('---'));
  const bodyStart = firstLines.findIndex(l => l.length > 20);
  const bodyText = bodyStart >= 0 ? firstLines.slice(bodyStart).join('\n\n') : md;

  const slug = slugify(title);
  const batchDir = join(OUTPUT_ROOT, `${today()}_${slug}`);
  mkdirSync(batchDir, { recursive: true });

  // Build body for adaptation (first ~2000 chars to avoid over-processing)
  const summaryBody = bodyText.slice(0, 3000);

  // Generate platform versions
  const versions = {
    'source': { content: md, platform: '原始版' },
    'zhihu': { content: adaptForZhihu(title, summaryBody, md), platform: '知乎' },
    'toutiao': { content: adaptForToutiao(title, summaryBody, md), platform: '头条号' },
    'baijiahao': { content: adaptForBaijiahao(title, summaryBody, md), platform: '百家号' },
    '36kr': { content: adaptFor36kr(title, summaryBody, md), platform: '36氪/虎嗅投稿' },
  };

  // Write files
  for (const [key, v] of Object.entries(versions)) {
    const filePath = join(batchDir, `${key}.md`);
    writeFileSync(filePath, v.content, 'utf-8');
    console.log(`  📝 ${v.platform}: ${filePath}`);
  }

  // Create publishing manifest
  const manifest = {
    title,
    sourceFile: sourcePath,
    generatedAt: now(),
    slug,
    platforms: [
      { name: '微信公众号', status: '✅ 已发布（源稿）', url: '', notes: '已推送草稿箱' },
      { name: '知乎', status: '⏳ 待发布', url: '', notes: '建议延迟2-3天后发布' },
      { name: '头条号', status: '⏳ 待发布', url: '', notes: '标题可微调增强点击率' },
      { name: '百家号', status: '⏳ 待发布', url: '', notes: '注意删除无水印要求' },
      { name: '36氪/虎嗅', status: '⏳ 待投稿', url: '', notes: '每月精选，非必发' },
    ],
    contentStats: {
      originalLength: md.length,
      estimatedReadTime: Math.ceil(md.length / 500) + ' 分钟',
    }
  };

  const manifestPath = join(batchDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`  📋 发布清单: ${manifestPath}`);

  // Print summary
  console.log('\n' + '='.repeat  (50));
  console.log(`📦 分发批次: ${batchDir}`);
  console.log(`📄 原文: ${title}`);
  console.log('='.repeat(50));
  console.log('\n📋 发布清单:');
  for (const p of manifest.platforms) {
    console.log(`  ${p.status}  ${p.name}${p.notes ? ' — ' + p.notes : ''}`);
  }

  console.log('\n💡 提示: 打开 manifest.json 标记发布状态');

  return manifest;
}

// ── CLI ──

const args = process.argv.slice(2);
const sourceFile = args[0];
const autoPublish = args.includes('--publish');

if (!sourceFile) {
  console.log(`
用法:
  node content-distributor.mjs <文章.md> [--publish]

示例:
  node content-distributor.mjs 三件套输出/05_公众号文章.md

输出:
  内容输出/分发批次/<日期>_<slug>/
    ├── source.md    原始版
    ├── zhihu.md     知乎优化版
    ├── toutiao.md   头条优化版
    ├── baijiahao.md 百家号优化版
    ├── 36kr.md      36氪投稿版
    └── manifest.json 发布清单
`);
  process.exit(0);
}

distribute(sourceFile, autoPublish);
