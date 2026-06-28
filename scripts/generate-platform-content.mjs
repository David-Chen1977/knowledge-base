#!/usr/bin/env node
/**
 * generate-platform-content.mjs — 从 Bundle 生成平台专属原创文章
 *
 * 同一份 research bundle（事实/大纲/关键词），为每个平台生成结构/角度/文风
 * 完全不同的文章，满足各平台「首发原创」要求。
 *
 * 用法:
 *   node generate-platform-content.mjs \
 *     --bundle ./batch/bundle.json \
 *     --platform zhihu \
 *     --output article.zhihu.md
 *
 * 平台:
 *   zhihu   — 深度结构化，理性分析，专业调性
 *   toutiao — 钩子驱动，短段落，情绪节奏，流量思维
 *   wechat  — 品牌长文，深度叙事，个人IP风格（现有，保持不变）
 *
 * 输出:
 *   给定平台的独立 Markdown 文章（含 YAML frontmatter）
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 平台调性定义 ──

const PLATFORM_PROFILES = {
  zhihu: {
    name: '知乎专栏',
    titleSuffix: ' | 深度分析',
    tone: '专业、理性、结构化，逻辑严密，数据驱动',
    structure: [
      '开篇引言：设定问题或悬念，点明核心矛盾',
      '背景分析：行业/领域现状与关键变量',
      '深度拆解：3-4 个核心论点，每个论点配数据/案例支撑',
      '对比视角：不同立场/观点对比分析',
      '结论与展望：总结核心判断，给出前瞻性观点',
    ],
    styleNotes: [
      '使用专业术语但给予解释',
      '段落较长，200-300字一段',
      '开篇需要一个有争议性或引人深思的提问',
      '数据必须标注来源',
      '结尾可以开放讨论，引导评论区互动',
    ],
    length: '3000-5000字',
  },
  toutiao: {
    name: '头条号',
    titleSuffix: '',
    tone: '钩子驱动、短平快、情绪节奏、口语化、强互动',
    structure: [
      '黄金开头：前100字制造强烈钩子（悬念/反常识/争议/共鸣）',
      '核心痛点：快速点出读者最关心的问题',
      '干货拆解：3-5个短小精悍的信息点，配简易案例',
      '情绪高潮：一个反转/亮点/金句',
      '结尾引导：总结+互动引导（点赞/评论/关注）',
    ],
    styleNotes: [
      '段落极短，不超过100字一段',
      '多用短句、口语化表达',
      '每300字插入一个情绪钩子或金句',
      '少用数据堆砌，多用故事和场景',
      '标题党适度，不能夸张失实',
      '段落间空行明显，节奏感强',
    ],
    length: '1500-2500字',
  },
};

// ── 工具 ──

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (f) => { const i = args.indexOf(f); return i >= 0 && i < args.length - 1 ? args[i + 1] : null; };
  const bundle = get('--bundle');
  const platform = get('--platform') || 'zhihu';
  const output = get('--output');

  if (!bundle || !['zhihu', 'toutiao', 'wechat'].includes(platform)) {
    console.error(`用法: node generate-platform-content.mjs --bundle <bundle.json> --platform zhihu|toutiao|wechat --output <file.md>`);
    process.exit(1);
  }
  return { bundlePath: bundle, platform, outputPath: output };
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── 文章生成器 ──

function generateArticle(bundle, platform) {
  const profile = PLATFORM_PROFILES[platform];
  if (!profile) throw new Error(`未知平台: ${platform}`);

  const { title: topic, outline, facts, keywords } = bundle;
  const factList = (facts || []).filter(f => f.claim);
  const outlineItems = outline || [];

  // 从 facts 中分类：带数字的事实 / 观点性事实
  const dataFacts = factList.filter(f => /[\d.,]+%|[\d,]+亿|[\d,]+万|[\d,]+美元/.test(f.claim));
  const insightFacts = factList.filter(f => !dataFacts.includes(f));

  // ── 标题生成 ──
  const title = topic + (platform === 'zhihu' ? ' | 深度分析' : '');

  // ── 摘要生成 ──
  const digest = insightFacts[0]
    ? insightFacts[0].claim.slice(0, 80)
    : `${topic}的深度分析`;

  // ── 关键词/Tags ──
  const tags = (keywords || [topic]).slice(0, 5);
  const tagLine = tags.map(t => `  - "${t}"`).join('\n');

  // ── 正文骨架 ──
  let bodySections = [];

  // 按平台结构生成
  const structure = profile.structure;

  for (let i = 0; i < structure.length; i++) {
    const sectionTitle = structure[i];
    let content = '';

    // 从 facts/outline 中提取相关素材
    let relevantFacts = [];
    const sectionKeywords = sectionTitle.replace(/[：:].*/, '').split(/[/,，、]/);

    for (const sk of sectionKeywords) {
      if (sk.length < 2) continue;
      const matches = factList.filter(f =>
        f.claim.includes(sk) || outlineItems.some(o => o.includes(sk))
      );
      relevantFacts.push(...matches);
    }

    // 去重
    relevantFacts = [...new Map(relevantFacts.map(f => [f.claim, f])).values()];

    // 生成章节内容
    const dataForSection = dataFacts.slice(i * 2, i * 2 + 2);
    const insightForSection = insightFacts.slice(i * 2, i * 2 + 2);

    content += `<!-- 调性提示: ${profile.tone} -->\n`;
    content += `<!-- 本节角色: ${sectionTitle} -->\n\n`;

    if (relevantFacts.length > 0) {
      for (const rf of relevantFacts.slice(0, 3)) {
        content += `${rf.claim}\n\n`;
      }
    }

    if (dataForSection.length > 0) {
      content += `📊 **关键数据**: `;
      content += dataForSection.map(d => d.claim).join('；');
      content += '\n\n';
    }

    if (insightForSection.length > 0) {
      content += `💡 **核心洞察**: ${insightForSection[0].claim}\n\n`;
    }

    // 空白章节占位
    if (content.trim() === '') {
      content = `<!-- 本节内容需根据 bundle facts 展开 -->\n\n`;
    }

    bodySections.push({
      title: sectionTitle,
      content: content.trim(),
    });
  }

  // ── 组装文章 ──
  let md = `---
title: "${title}"
author: "陈道雷"
digest: "${digest}"
platform: "${platform}"
generated_from: "${bundle.slug || bundle.topic || 'bundle'}"
tags:
${tagLine}
---

# ${title}

`;

  // 每节
  for (const sec of bodySections) {
    md += `## ${sec.title}\n\n${sec.content}\n\n`;
  }

  // 平台特有结尾
  if (platform === 'zhihu') {
    md += `---\n\n*本文基于公开信息和行业研究撰写，仅供参考。欢迎在评论区讨论。*\n\n`;
  } else if (platform === 'toutiao') {
    md += `---\n\n**关注我，获取更多行业深度解读。** 你觉得这个趋势会怎么发展？评论区聊聊。\n\n`;
  }

  // 附：写作提示
  md += `\n<!--\n=== 平台写作指引 (在编辑时参考，发布前删除) ===\n`;
  md += `调性: ${profile.tone}\n`;
  md += `结构建议:\n`;
  for (const s of structure) {
    md += `  ${s}\n`;
  }
  md += `\n风格要点:\n`;
  for (const n of profile.styleNotes) {
    md += `  - ${n}\n`;
  }
  md += `\n建议字数: ${profile.length}\n`;
  md += `==============================\n-->\n`;

  return md;
}

// ── 主流程 ──

function main() {
  const { bundlePath, platform, outputPath } = parseArgs();

  if (!existsSync(bundlePath)) {
    console.error(`❌ Bundle 文件不存在: ${bundlePath}`);
    process.exit(1);
  }

  const bundle = JSON.parse(readFileSync(bundlePath, 'utf-8'));
  console.log(`📦 Bundle: ${bundle.title || bundle.topic}`);
  console.log(`🎯 平台: ${platform} (${PLATFORM_PROFILES[platform].name})`);
  console.log(`📝 生成中...`);

  const article = generateArticle(bundle, platform);

  const outFile = outputPath || resolve(process.cwd(), `article.${platform}.md`);
  writeFileSync(outFile, article, 'utf-8');

  console.log(`✅ 已生成: ${outFile}`);
  console.log(`   字数: ~${article.length} 字符`);
  console.log(`   注意: 文章内容基于 bundle facts 生成骨架，`);
  console.log(`   请在编辑器中填充完整后发布。`);
}

main();
