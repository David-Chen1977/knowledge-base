#!/usr/bin/env node
/**
 * research-to-bundle — 研究 → Content Bundle 转换器
 *
 * 将主题研究结果转换为标准化 Content Bundle JSON。
 * 支持直接通过 LLM 生成研究内容，或从已有 research.md 转换。
 *
 * 用法:
 *   node research-to-bundle.mjs --topic "主题" [--research ./research.md] [--output ./bundle.json]
 *   node research-to-bundle.mjs --topic "主题" [--facts ./facts.json]  # 只生成骨架
 *
 * 输出:
 *   Content Bundle JSON（符合 content-bundle-schema.json）
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, 'content-bundle-schema.json');

// ── 工具函数 ──

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
}

function now() {
  return new Date().toISOString();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
  };

  const topic = get('--topic');
  if (!topic) {
    console.error('用法: node research-to-bundle.mjs --topic "主题" [--research ./research.md] [--output ./bundle.json]');
    process.exit(1);
  }

  return {
    topic,
    researchPath: get('--research'),
    outputPath: get('--output'),
  };
}

// ── 从 research.md 提取内容 ──

function parseResearchMarkdown(path) {
  if (!path || !existsSync(path)) return null;
  const content = readFileSync(path, 'utf-8');

  // 提取大纲（## 标题行）
  const outline = [];
  const headingRe = /^##\s+(.+)/gm;
  let m;
  while ((m = headingRe.exec(content)) !== null) {
    outline.push(m[1].trim());
  }

  // 提取关键发现（- 或 1. 开头行）
  const facts = [];
  const factRe = /^\s*(?:[-*+]|\d+\.)\s+(.+)/gm;
  while ((m = factRe.exec(content)) !== null) {
    const line = m[1].trim();
    if (line.length > 10) {
      facts.push({ claim: line, source: 'research.md', relevance: 'auto_extracted' });
    }
  }

  return { outline, facts, content };
}

// ── 生成 Content Bundle ──

function generateBundle(topic, researchData) {
  const slug = slugify(topic);
  const timestamp = now();

  const bundle = {
    version: 1,
    slug,
    title: topic,
    digest: `${topic} — 自动生成`,
    source: researchData ? 'custom' : 'custom',
    topic,
    generatedAt: timestamp,
    outline: researchData?.outline || [],
    facts: researchData?.facts || [],
    content: researchData?.content || `# ${topic}\n\n> 自动生成\n\n## 正文\n\n${topic} 的详细分析内容。\n`,
    keywords: [topic],
    images: [
      { id: 'cover', prompt: `Professional photography ${topic}, cinematic, modern, high quality, wide angle, 4k`, url: '', alt: `${topic} 封面`, usage: 'cover' },
      { id: 'body_1', prompt: `Infographic illustration ${topic}, data visualization style, clean, modern`, url: '', alt: '', usage: 'body' },
      { id: 'body_2', prompt: `Abstract concept art ${topic}, business style, gradient, elegant`, url: '', alt: '', usage: 'body' },
      { id: 'body_3', prompt: `Future technology ${topic}, blue tone, wide angle, minimalist`, url: '', alt: '', usage: 'body' },
    ],
  };

  return bundle;
}

// ── 验证 Bundle 是否符合 Schema ──

function validateBundle(bundle) {
  const errors = [];

  // 版本检查
  if (bundle.version !== 1) errors.push('version 必须为 1');
  if (!bundle.slug) errors.push('slug 不能为空');
  if (!bundle.title) errors.push('title 不能为空');
  if (!bundle.topic) errors.push('topic 不能为空');
  if (!bundle.content) errors.push('content 不能为空');
  if (!['deep_research', 'custom'].includes(bundle.source)) {
    errors.push('source 必须为 deep_research 或 custom');
  }

  // images 检查
  if (bundle.images && Array.isArray(bundle.images)) {
    for (const img of bundle.images) {
      if (!img.id) errors.push('image.id 不能为空');
      if (!img.usage || !['cover', 'body'].includes(img.usage)) {
        errors.push(`image "${img.id}" usage 必须为 cover 或 body`);
      }
    }
  }

  return errors;
}

// ── 主流程 ──

async function main() {
  const { topic, researchPath, outputPath } = parseArgs();

  console.log(`\n📦 Content Bundle 生成器`);
  console.log(`   主题: ${topic}\n`);

  // 加载研究数据
  let researchData = null;
  if (researchPath) {
    console.log(`📖 加载研究: ${researchPath}`);
    researchData = parseResearchMarkdown(researchPath);
    if (researchData) {
      console.log(`   大纲: ${researchData.outline.length} 章节`);
      console.log(`   事实: ${researchData.facts.length} 条`);
    } else {
      console.log('⚠️  研究文件无法解析，使用默认内容');
    }
  }

  // 生成 Bundle
  const bundle = generateBundle(topic, researchData);

  // 验证
  const errors = validateBundle(bundle);
  if (errors.length > 0) {
    console.error('❌ Bundle 验证失败:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log('✅ Bundle 验证通过');
  console.log(`   标题: ${bundle.title}`);
  console.log(`   Slug: ${bundle.slug}`);
  console.log(`   大纲: ${bundle.outline.length} 章`);
  console.log(`   事实: ${bundle.facts.length} 条`);
  console.log(`   配图: ${bundle.images.length} 张`);

  // 输出
  const outPath = outputPath || resolve(process.cwd(), `${bundle.slug}.bundle.json`);
  writeFileSync(outPath, JSON.stringify(bundle, null, 2), 'utf-8');
  console.log(`\n💾 已保存: ${outPath}\n`);
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
