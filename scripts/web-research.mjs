#!/usr/bin/env node
/**
 * web-research.mjs — 研究数据引擎（双模式）
 *
 * 模式 A: --seed <json>    通过 MCP websearch 预填真实研究数据
 * 模式 B: --topic "..."    自动生成结构化研究骨架 + 知识库辅助
 *
 * 用法:
 *   node web-research.mjs --seed ./research-seed.json --topic "主题" --output ./research.md
 *   node web-research.mjs --topic "双碳政策2026" --output ./research.md
 *
 * 种子 JSON 格式:
 *   {
 *     "summary": "一句话摘要",
 *     "dataPoints": ["11亿吨碳减排...", ...],
 *     "insights": ["核心洞察1...", ...],
 *     "trends": ["趋势1...", ...],
 *     "hook": "开场钩子句",
 *     "conflict": "冲突/问题描述",
 *     "sources": ["来源1...", ...],
 *     "content": "完整正文...（可选）"
 *   }
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = __dirname;
const KNOWLEDGE_VAULT = join(DOCS, 'Knowledge', '_vault');

// ── CLI ──

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
  };
  const topic = get('--topic');
  const seedPath = get('--seed');
  const outputPath = get('--output');

  if (!topic && !seedPath) {
    console.error('用法: node web-research.mjs --topic "主题" [--output ./research.md] [--seed ./seed.json]');
    process.exit(1);
  }

  return { topic: topic || '', seedPath, outputPath };
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
}

function now() {
  return new Date().toISOString();
}

function log(emoji, msg) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`${ts} ${emoji} ${msg}`);
}

// ── 知识库辅助 ──

function searchKnowledgeBase(topic) {
  const results = { notes: 0, matches: [] };
  if (!existsSync(KNOWLEDGE_VAULT)) return results;

  const keywords = topic.split(/[\s,，、]/).filter(k => k.length > 1);
  try {
    const files = readdirSync(KNOWLEDGE_VAULT).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = readFileSync(join(KNOWLEDGE_VAULT, file), 'utf-8');
      const matchCount = keywords.filter(k => content.includes(k)).length;
      if (matchCount >= Math.ceil(keywords.length / 3)) {
        results.matches.push({ file, excerpt: content.slice(0, 200).replace(/\n+/g, ' ') });
        results.notes++;
      }
    }
  } catch { /* ignore */ }
  return results;
}

// ── 模式 A: 从种子 JSON 生成 ──

function generateFromSeed(topic, seed) {
  const lines = [];

  lines.push(`# 研究报告: ${topic}`);
  lines.push(`> 基于预填研究数据生成于 ${now()}`);
  lines.push('');

  // 钩子（视频开场用）
  if (seed.hook) {
    lines.push('## 开场钩子');
    lines.push('');
    lines.push(seed.hook);
    lines.push('');
  }

  // 冲突/问题（叙事驱动）
  if (seed.conflict) {
    lines.push('## 核心矛盾');
    lines.push('');
    lines.push(seed.conflict);
    lines.push('');
  }

  // 摘要
  if (seed.summary) {
    lines.push('## 摘要');
    lines.push('');
    lines.push(seed.summary);
    lines.push('');
  }

  // 核心数据
  if (seed.dataPoints && seed.dataPoints.length > 0) {
    lines.push('## 核心数据');
    lines.push('');
    seed.dataPoints.forEach((dp, i) => {
      lines.push(`${i + 1}. ${dp}`);
    });
    lines.push('');
  }

  // 核心洞察
  if (seed.insights && seed.insights.length > 0) {
    lines.push('## 核心洞察');
    lines.push('');
    seed.insights.forEach((insight, i) => {
      lines.push(`- **观点 ${i + 1}**: ${insight}`);
    });
    lines.push('');
  }

  // 趋势判断
  if (seed.trends && seed.trends.length > 0) {
    lines.push('## 趋势判断');
    lines.push('');
    seed.trends.forEach(t => lines.push(`- ${t}`));
    lines.push('');
  }

  // 数据来源
  if (seed.sources && seed.sources.length > 0) {
    lines.push('## 数据来源');
    lines.push('');
    seed.sources.forEach(s => lines.push(`- ${s}`));
    lines.push('');
  }

  return lines.join('\n');
}

// ── 模式 B: 无种子时生成骨架 + 知识库辅助 ──

function generateSkeleton(topic) {
  const lines = [];
  const kb = searchKnowledgeBase(topic);

  lines.push(`# 研究报告: ${topic}`);
  lines.push(`> 自动生成于 ${now()}`);
  lines.push('');

  if (kb.notes > 0) {
    lines.push(`> 知识库关联: ${kb.notes} 条笔记`);
    lines.push('');
  }

  lines.push('## 行业背景');
  lines.push('');
  if (kb.matches.length > 0) {
    kb.matches.slice(0, 2).forEach(m => {
      lines.push(`- 📝 ${m.file.replace('.md', '')}: ${m.excerpt}`);
      lines.push('');
    });
  } else {
    lines.push(`${topic} 的背景分析。`);
    lines.push('');
  }

  lines.push('## 核心数据');
  lines.push('');
  lines.push('待补充 — 使用 web-research.mjs --seed 预填研究数据:');
  lines.push('');
  lines.push('1. 关键数据点一');
  lines.push('2. 关键数据点二');
  lines.push('');

  lines.push('## 核心洞察');
  lines.push('');
  lines.push('- **观点 1**: 待补充');
  lines.push('- **观点 2**: 待补充');
  lines.push('');

  lines.push('## 趋势判断');
  lines.push('');
  lines.push('- 趋势一');
  lines.push('- 趋势二');
  lines.push('');

  lines.push('## 数据来源');
  lines.push('');
  lines.push('- 待补充');
  lines.push('');

  return lines.join('\n');
}

// ── 主流程 ──

function main() {
  const { topic, seedPath, outputPath } = parseArgs();

  console.log(`\n🌐 Web Research Engine`);

  let research;
  let sourceDesc = '自动骨架';

  if (seedPath) {
    if (!existsSync(seedPath)) {
      console.error(`❌ 种子文件不存在: ${seedPath}`);
      process.exit(1);
    }
    const seed = JSON.parse(readFileSync(seedPath, 'utf-8'));
    research = generateFromSeed(topic, seed);
    const dpCount = seed.dataPoints?.length || 0;
    const insightCount = seed.insights?.length || 0;
    sourceDesc = `种子数据 (${dpCount} 数据点, ${insightCount} 洞察)`;
    log('📦', `加载种子: ${seedPath}`);
    log('📊', `数据点: ${dpCount}, 洞察: ${insightCount}, 趋势: ${seed.trends?.length || 0}`);
  } else {
    research = generateSkeleton(topic);
    const kb = searchKnowledgeBase(topic);
    sourceDesc = `自动骨架 (知识库: ${kb.notes} 条)`;
    log('📋', `主题: ${topic}`);
    log('📋', `知识库关联: ${kb.notes} 条笔记`);
  }

  const outPath = outputPath || resolve(process.cwd(), `${slugify(topic)}_research.md`);
  writeFileSync(outPath, research, 'utf-8');

  log('✅', `研究报告已保存: ${outPath}`);
  console.log(`   来源: ${sourceDesc}`);
  console.log(`   字数: ${research.length} 字符\n`);
}

main();
