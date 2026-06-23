#!/usr/bin/env node
/**
 * wiki-update.mjs — Karpathy LLM Wiki 集成管线
 *
 * 功能: 从内容生产产出物编译概念页/实体页, 维持 wiki/index.md + log.md
 *
 * 用法:
 *   node wiki-update.mjs --topic "主题" --source <path> [--type article|研报|笔记]
 *
 * 管线集成: content-pipe.mjs 在每轮生产后自动调用
 * 知识目录: ~/Documents/Knowledge/_vault/wiki/
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname);
const WIKI = join(DOCS, 'Knowledge', '_vault', 'wiki');
const CONCEPTS_DIR = join(WIKI, 'concepts');
const ENTITIES_DIR = join(WIKI, 'entities');

// ── 工具 ──

function getArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
  };
  return {
    topic: get('--topic') || '未命名',
    source: get('--source') || '',
    type: get('--type') || 'article',
  };
}

function today() { return new Date().toISOString().slice(0, 10); }
function now() { return new Date().toISOString(); }
function slug(s) { return s.replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '').toLowerCase(); }
function readFileSafe(p) { try { return readFileSync(p, 'utf-8'); } catch { return ''; } }
function ensureDir(d) { mkdirSync(d, { recursive: true }); }

// ── 概念提取（启发式） ──

const INVEST_CONCEPTS = [
  '现金流折现', '安全边际', '护城河', '复利', '价值投资',
  '能力圈', '市场先生', '协同效应', '规模效应', '网络效应',
  '自由现金流', '折现率', '终值', 'ROE', 'ROIC', 'DCF',
  '算电协同', '电力现货', '虚拟电厂', '需求响应', '绿证',
];

const EXCLUDE_WORDS = new Set([
  '建议封面配图','配图建议位置①','配图建议位置②','配图建议','封面配图',
  '标题候选','排版建议','发布日期','建议配图','点击关注','关注公众号',
  '目录','CONTENTS','THANK YOU','关于我','联系方式','版权声明',
  '正文','前言','引言','结语','总结','附','参考','附录','备注',
]);

function isNoise(word) {
  if (EXCLUDE_WORDS.has(word)) return true;
  if (/建议|配图|封面|排版|标题|候选|位置|联系|版权|关注|目录/.test(word)) return true;
  if (word.includes('①') || word.includes('②') || word.includes('③')) return true;
  if (word.length > 16 || word.length < 2) return true;
  if (/[的的地得是了在把被这让那这不那]/.test(word) && word.length > 4) return true;
  return false;
}

function extractConcepts(text) {
  const found = [];
  for (const c of INVEST_CONCEPTS) {
    if (text.includes(c)) found.push(c);
  }

  // 从加粗文本提取
  const boldMatches = text.match(/\*\*([^*]+)\*\*/g);
  if (boldMatches) {
    for (const m of boldMatches) {
      const word = m.replace(/\*\*/g, '').trim();
      if (word.length >= 2 && word.length <= 20 && !found.includes(word) && !isNoise(word)) {
        found.push(word);
      }
    }
  }

  // 从 ## 标题提取
  const headingMatches = text.match(/^##\s+(.+)$/gm);
  if (headingMatches) {
    for (const m of headingMatches) {
      const h = m.replace(/^##\s+/, '').trim();
      if (h.length >= 2 && h.length <= 30 && !found.includes(h) && !isNoise(h)) {
        found.push(h);
      }
    }
  }

  return [...new Set(found)].slice(0, 10);
}

function extractEntities(text) {
  const entities = [];

  // 人物: 常见姓名模式
  const personPatterns = [
    /巴菲特/g, /段永平/g, /张潇雨/g, /芒格/g, /彼得·林奇/g,
    /凯恩斯/g, /格雷厄姆/g, /费雪/g, /马斯克/g, /黄仁勋/g,
  ];
  for (const p of personPatterns) {
    if (p.test(text)) entities.push({ name: p.source.replace(/\\/g,''), type: 'person' });
  }

  // 公司/机构
  const orgPatterns = [
    /英伟达|NVIDIA/gi, /伯克希尔|Berkshire/gi, /苹果|Apple(?=\s|\.|,)/g,
    /微软|Microsoft/gi, /特斯拉|Tesla/gi, /亚马逊|Amazon/gi,
    /汇竑资本/g, /宁德时代/g, /比亚迪/g, /国家电网/g,
  ];
  for (const o of orgPatterns) {
    const match = text.match(o);
    if (match) entities.push({ name: match[0], type: 'org' });
  }

  return [...new Map(entities.map(e => [e.name, e])).values()];
}

// ── Wiki 页面生成 ──

function generateConceptPage(concept, sourceTopic, sourcePath, date) {
  const existing = readFileSafe(join(CONCEPTS_DIR, `${slug(concept)}.md`));
  // 如果已存在, 追加关联而非覆盖
  if (existing) {
    const refLine = `- ${date} — [${sourceTopic}](${sourcePath})`;
    if (existing.includes(refLine)) return null;
    return existing.replace(/\n$/, '') + `\n${refLine}\n`;
  }
  return `---
title: "${concept}"
type: concept
created: ${date}
tags: [concept, investment]
---

# ${concept}

## 概述


## 相关来源

- ${date} — [${sourceTopic}](${sourcePath})

## 关联概念


## 关键洞见

`;
}

function generateEntityPage(entity, sourceTopic, sourcePath, date) {
  const existing = readFileSafe(join(ENTITIES_DIR, `${slug(entity.name)}.md`));
  if (existing) {
    const refLine = `- ${date} — [${sourceTopic}](${sourcePath})`;
    if (existing.includes(refLine)) return null;
    return existing.replace(/\n$/, '') + `\n${refLine}\n`;
  }
  const typeLabel = entity.type === 'person' ? '人物' : '机构';
  return `---
title: "${entity.name}"
type: ${entity.type}
created: ${date}
tags: [${entity.type}, investment]
---

# ${entity.name}

**类型**: ${typeLabel}

## 简介


## 相关来源

- ${date} — [${sourceTopic}](${sourcePath})

## 核心观点

`;
}

function updateIndex(newEntries) {
  const indexPath = join(WIKI, 'index.md');
  let content = readFileSafe(indexPath);
  if (!content) {
    content = `# Wiki 索引\n\n> 知识库自动编译。概念 + 实体页面随每次内容生产递增。\n\n最后更新: ${now()}\n\n`;
  }
  // 追加新条目
  for (const entry of newEntries) {
    const line = `- ${today()} — [${entry.title}](/${entry.path}) (${entry.type})\n`;
    if (!content.includes(line)) content += line;
  }
  // 更新时间戳
  content = content.replace(/最后更新: .+/, `最后更新: ${now()}`);
  writeFileSync(indexPath, content, 'utf-8');
  return indexPath;
}

function appendLog(topic, source, pagesCreated) {
  const logPath = join(WIKI, 'log.md');
  let log = readFileSafe(logPath);
  if (!log) {
    log = `# Wiki 操作日志\n\n> 追加记录，不可变。\n\n`;
  }
  log += `- ${now()} | **${topic}** | 来源: ${basename(source)} | 创建/更新 ${pagesCreated} 个页面\n`;
  writeFileSync(logPath, log, 'utf-8');
}

// ── 主流程 ──

function main() {
  ensureDir(CONCEPTS_DIR);
  ensureDir(ENTITIES_DIR);

  const { topic, source, type } = getArgs();
  const date = today();

  if (!source || !existsSync(source)) {
    console.error('❌ 需要 --source 指定来源文件');
    process.exit(1);
  }

  const text = readFileSafe(source);
  const concepts = extractConcepts(text);
  const entities = extractEntities(text);
  const newEntries = [];
  let pageCount = 0;

  console.log(`\n📖 Wiki 更新: ${topic}`);
  console.log(`   概念: ${concepts.length} 个`);

  for (const c of concepts) {
    const result = generateConceptPage(c, topic, source, date);
    if (result) {
      const p = join(CONCEPTS_DIR, `${slug(c)}.md`);
      writeFileSync(p, result, 'utf-8');
      newEntries.push({ title: c, path: `wiki/concepts/${slug(c)}.md`, type: '概念' });
      pageCount++;
      console.log(`   📄 概念: ${c}`);
    }
  }

  if (entities.length > 0) {
    console.log(`   实体: ${entities.length} 个`);
    for (const e of entities) {
      const result = generateEntityPage(e, topic, source, date);
      if (result) {
        const p = join(ENTITIES_DIR, `${slug(e.name)}.md`);
        writeFileSync(p, result, 'utf-8');
        newEntries.push({ title: e.name, path: `wiki/entities/${slug(e.name)}.md`, type: e.type === 'person' ? '人物' : '机构' });
        pageCount++;
        console.log(`   📄 ${e.type === 'person' ? '人物' : '机构'}: ${e.name}`);
      }
    }
  }

  if (pageCount > 0) {
    updateIndex(newEntries);
    appendLog(topic, source, pageCount);
    console.log(`\n✅ Wiki 更新完成: ${pageCount} 个页面 (索引 + 日志已同步)\n`);
  } else {
    console.log(`   ℹ️  无新页面, 跳过\n`);
  }
}

main();
