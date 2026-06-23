#!/usr/bin/env node
/**
 * apply-visibility.mjs — vault visibility frontmatter 初始化/维护工具
 *
 * 用法:
 *   node _scripts/apply-visibility.mjs              # 扫描所有文件，添加缺失的 visibility
 *   node _scripts/apply-visibility.mjs --check      # 只检查不修改
 *   node _scripts/apply-visibility.mjs --reset=public # 重置所有 public 判断
 *
 * 规则:
 *   - 在 90-公開/ 目录下 → visibility: public
 *   - 文件名匹配 _回流_ _深化_ _思考_ _会议_ → visibility: public
 *   - 在已知公开文件列表中 → visibility: public
 *   - 文件名含私密关键词 → visibility: private
 *   - 其余 → visibility: private (默认安全)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, relative, basename, dirname, join } from 'path';

const VAULT_ROOT = resolve(import.meta.dirname, '..');

// ── 已知公开文件（来自旧的 CORE_FILES 列表）──
const PUBLIC_PATHS = new Set([
  '10-知识库/MOC-赛道交叉图.md',
  '10-知识库/电力新能源/赛道总览.md',
  '10-知识库/电力新能源/关键术语表.md',
  '10-知识库/电力新能源/储能/产业链.md',
  '10-知识库/电力新能源/光伏/产业链.md',
  '10-知识库/电力新能源/风电/产业链.md',
  '10-知识库/电力新能源/氢能/产业链.md',
  '10-知识库/电力新能源/智能电网/新兴赛道.md',
  '10-知识库/电力新能源/碳市场/赛道文件.md',
  '10-知识库/电力新能源/电力市场/赛道文件.md',
  '10-知识库/算电协同/赛道总览.md',
  '10-知识库/算电协同/投资逻辑.md',
  '10-知识库/算电协同/数据中心+能源/赛道文件.md',
  '10-知识库/算电协同/节能用能体系深度分析.md',
  '10-知识库/AI/赛道总览.md',
  '10-知识库/AI/关键术语表.md',
  '10-知识库/AI/基础层/芯片与算力.md',
  '10-知识库/AI/模型层/大模型赛道.md',
  '10-知识库/AI/应用层/AI应用赛道.md',
]);

// ── 私密关键词（文件名含这些 → 强制 private）──
const PRIVATE_KW = [
  '一级标的库', '估值基准', '变现商业模式',
  '汇竑资本', '写作风格参考', '文章质量标准',
  '质量检查标准', '评级建仓', '仓位管理',
];

// ── 公开模式文件名匹配 ──
const PUBLIC_GLOB = /_[回流深化思考会议]+_/;

// ── 判断 visibility ──
function determineVisibility(filePath) {
  const rel = relative(VAULT_ROOT, filePath);

  // 90-公开/ → 永远 public
  if (rel.startsWith('90-公开')) return 'public';

  // 检查私密关键词
  const fname = basename(filePath);
  for (const kw of PRIVATE_KW) {
    if (fname.includes(kw)) return 'private';
  }

  // 已知公开文件列表
  if (PUBLIC_PATHS.has(rel)) return 'public';

  // 回流/深化/思考/会议 → public
  if (PUBLIC_GLOB.test(fname)) return 'public';

  // 默认安全
  return 'private';
}

// ── 读取/解析 frontmatter ──
function parseFrontmatter(content) {
  const fm = {};
  if (!content.startsWith('---')) return { fm, body: content };
  const end = content.indexOf('---', 3);
  if (end === -1) return { fm, body: content };
  const fmText = content.slice(3, end).trim();
  const body = content.slice(end + 3);
  for (const line of fmText.split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return { fm, body };
}

// ── 构建新 frontmatter ──
function buildFrontmatter(fm, visibility) {
  fm.visibility = visibility;
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push('---');
  return lines.join('\n');
}

// ── 递归查找 .md 文件 ──
function findMDFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    if (entry.isDirectory()) results.push(...findMDFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.md')) results.push(fullPath);
  }
  return results;
}

// ── 主流程 ──
function main() {
  const isCheck = process.argv.includes('--check');
  const mdFiles = findMDFiles(VAULT_ROOT);

  console.log(`📄 扫描到 ${mdFiles.length} 个 .md 文件\n`);

  let updated = 0, ok = 0, errors = 0;

  for (const fp of mdFiles) {
    const rel = relative(VAULT_ROOT, fp);
    const content = readFileSync(fp, 'utf-8');
    const { fm, body } = parseFrontmatter(content);
    const expected = determineVisibility(fp);

    if (fm.visibility === expected) {
      ok++;
      continue;
    }

    if (isCheck) {
      const current = fm.visibility || '(缺失)';
      console.log(`  ⚠️  ${rel}: ${current} → 应为 ${expected}`);
      continue;
    }

    // 写入
    fm.updated = new Date().toISOString().slice(0, 10);
    const newContent = buildFrontmatter(fm, expected) + '\n' + body;
    writeFileSync(fp, newContent, 'utf-8');
    console.log(`  ${expected === 'public' ? '🌐' : '🔒'} ${rel} → ${expected}`);
    updated++;
  }

  console.log(`\n✅ 完成: ${ok} 已正确, ${updated} 已更新, ${errors} 错误`);
}

main();
