#!/usr/bin/env node
/**
 * knowledge-index — 内容生产后自动索引到知识库
 *
 * 用法:
 *   node knowledge-index.mjs --topic "主题" [--batch-dir <path>]
 *
 * 功能:
 *   1. 在知识库 00-Daily/ 创建或追加今日笔记
 *   2. 在 40-Reading/ 创建阅读笔记（摘取产出中的关键信息）
 *   3. 更新 60-Reviews/ 的生产记录
 *   4. 在 knowledge-index 日志中追加生产事件
 *
 * 输出目录: ~/Documents/Knowledge/_vault/
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname);
const VAULT = '/Users/Admin/知识库Vault';
const DAILY_DIR = join(VAULT, '00_MOC');
const READING_DIR = join(VAULT, '01_赛道研究');
const REVIEWS_DIR = join(VAULT, '06_复盘笔记');
const INBOX_DIR = join(VAULT, '01_赛道研究', '会议纪要');

// ── 工具 ──

function getArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
  };
  return {
    topic: get('--topic') || '未命名主题',
    batchDir: get('--batch-dir') || null,
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function now() {
  return new Date().toISOString();
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function readFileSafe(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return ''; }
}

// ── 核心 ──

function upsertDailyNote(topic, batchDir) {
  const date = today();
  const dailyPath = join(DAILY_DIR, `${date}.md`);

  let content = readFileSafe(dailyPath);

  const entry = `\n### 🏭 内容生产: ${topic}\n\n- **时间**: ${now()}\n- **批次**: ${batchDir || '未指定'}\n- **产出**: 通过 content-pipe 管线自动生成\n`;

  if (content.includes('🏭 内容生产')) {
    // 已有生产记录，追加
    content += entry;
  } else {
    // 首次写入，创建完整笔记
    if (!content) {
      content = `---\ndate: ${date}\ntype: daily\ntags: [daily, production]\n---\n\n# ${date} · ${['周日','周一','周二','周三','周四','周五','周六'][new Date().getDay()]}\n\n> 今日包含内容生产记录\n`;
    }
    content += `\n---\n## 内容生产\n${entry}`;
  }

  writeFileSync(dailyPath, content, 'utf-8');
  console.log(`📝 Daily Note 已更新: ${dailyPath}`);
  return dailyPath;
}

function createReadingNote(topic, batchDir) {
  const date = today();
  const slug = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_').slice(0, 30);
  const notePath = join(READING_DIR, `${date}_${slug}.md`);

  if (existsSync(notePath)) {
    console.log(`📖 阅读笔记已存在，跳过: ${notePath}`);
    return notePath;
  }

  let highlights = '';
  if (batchDir) {
    // 尝试从 research.md 提取关键信息
    const researchPath = join(batchDir, 'research.md');
    const research = readFileSafe(researchPath);
    if (research) {
      // 提取前 500 字作为摘要
      highlights = research.replace(/^# .+\n/, '').slice(0, 500);
    }

    // 尝试从产出报告中提取信息
    const reportPath = join(batchDir, 'report.md');
    const report = readFileSafe(reportPath);
    if (report && !highlights) {
      highlights = report.slice(0, 500);
    }
  }

  const content = `---
date: ${date}
type: reading
tags: [reading, production, auto-generated]
---

# 生产笔记: ${topic}

> 自动记录于 ${now()}

## 主题

${topic}

## 关键内容

${highlights || '（内容摘要待补充）'}

## 产出信息

- **生产日期**: ${date}
- **批次目录**: ${batchDir || '未指定'}
- **索引时间**: ${now()}

---

*此笔记由 knowledge-index 自动生成*
`;

  writeFileSync(notePath, content, 'utf-8');
  console.log(`📖 阅读笔记已创建: ${notePath}`);
  return notePath;
}

function createInboxNote(topic, batchDir) {
  const date = today();
  const notePath = join(INBOX_DIR, `${date}_生产_${topic.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_').slice(0, 20)}.md`);

  if (existsSync(notePath)) return notePath;

  const content = `---
date: ${date}
type: inbox
tags: [inbox, production]
---

# 待消化: ${topic}

**来源**: content-pipe 管线 · ${now()}

**批次目录**: ${batchDir || '未指定'}

## 待处理

- [ ] 阅读产出内容，提炼关键 insight
- [ ] 如有决定，创建决策日志
- [ ] 决定是否归档为永久笔记

---

*自动来自 content-pipe 生产管线*
`;

  writeFileSync(notePath, content, 'utf-8');
  console.log(`📥 Inbox 笔记已创建: ${notePath}`);
  return notePath;
}

function updateProductionLog(topic, batchDir) {
  const logPath = join(VAULT, '60-Reviews', 'production-log.md');
  const date = today();

  const entry = `| ${date} | ${topic} | ${batchDir || '-'} | ✅ |\n`;

  let content = readFileSafe(logPath);
  if (!content) {
    content = `# 内容生产日志\n\n> 自动记录每次 content-pipe 生产活动\n\n| 日期 | 主题 | 批次目录 | 状态 |\n|------|------|----------|------|\n`;
  }

  // 检查是否已有今天的同类记录
  const todayEntry = `| ${date} | ${topic} |`;
  if (content.includes(todayEntry)) {
    console.log('📊 生产日志已有今天记录，跳过');
    return logPath;
  }

  content += entry;
  writeFileSync(logPath, content, 'utf-8');
  console.log(`📊 生产日志已更新: ${logPath}`);
  return logPath;
}

// ── 主流程 ──

function main() {
  console.log('\n=== 知识库索引 ===\n');

  const { topic, batchDir } = getArgs();
  console.log(`📌 主题: "${topic}"`);
  console.log(`📂 批次: ${batchDir || '未指定'}\n`);

  // 确保目录
  [DAILY_DIR, READING_DIR, REVIEWS_DIR, INBOX_DIR].forEach(ensureDir);

  // 1. 更新 Daily Note
  upsertDailyNote(topic, batchDir);

  // 2. 创建阅读笔记（提炼关键信息）
  createReadingNote(topic, batchDir);

  // 3. 创建 Inbox 备忘
  createInboxNote(topic, batchDir);

  // 4. 更新生产日志
  updateProductionLog(topic, batchDir);

  // 5. Wiki 概念编译
  const wikiScript = join(DOCS, 'wiki-update.mjs');
  if (existsSync(wikiScript)) {
    const sourceDir = batchDir || join(DOCS, 'OpenCode生成文件');
    const candidates = ['article', 'wechat', 'videoScript', 'website']
      .map(t => {
        try {
          if (batchDir) {
            const files = readdirSync(batchDir);
            const match = files.find(f => f.includes(t));
            return match ? join(batchDir, match) : null;
          }
          return null;
        } catch { return null; }
      })
      .filter(Boolean);
    const source = candidates[0] || join(INBOX_DIR, `${today()}-${slug(topic)}.md`);
    if (existsSync(source)) {
      console.log('📖 编译 Wiki 概念页...');
      try {
        execSync(`node "${wikiScript}" --topic "${topic}" --source "${source}" --type article`, { stdio: 'inherit' });
      } catch (e) {
        console.log('  ⚠️ Wiki 编译失败:', e.message.slice(0, 100));
      }
    }
  }

  console.log('\n✅ 知识库索引完成\n');
}

main();
