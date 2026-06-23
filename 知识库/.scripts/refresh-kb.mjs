#!/usr/bin/env node
/**
 * refresh-kb.mjs — 知识库数据自动刷新引擎
 *
 * 替代旧的 refresh-all.sh（只生成指令清单），直接：
 *   1. 从 china-energy-mcp 数据源读取
 *   2. 格式化写入知识库赛道文件
 *   3. git commit
 *
 * 用法:
 *   node scripts/refresh-kb.mjs            # 全量刷新
 *   node scripts/refresh-kb.mjs --quick    # 仅更新关键指标
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const KB_ROOT = '/Users/Admin/OpencodeWorkspace/知识库';
const LOG_PATH = resolve(ROOT, 'logs', 'refresh-kb.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_PATH, line + '\n', 'utf-8'); } catch {}
}

// ── 直接导入 china-energy 数据 ──
let DATA;
try {
  DATA = await import('/Users/Admin/OpencodeWorkspace/tools/china-energy-mcp/src/sources/data.js');
  log('✅ 数据源加载完成');
} catch (e) {
  log(`❌ 数据源加载失败: ${e.message}`);
  process.exit(1);
}

// ── 格式化工具 ──

function mdTable(headers, rows) {
  const h = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
  return `${h}\n${sep}\n${body}`;
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function writeTrackFile(path, title, frontmatterTags, content) {
  const fullPath = `${KB_ROOT}/${path}`;
  ensureDir(dirname(fullPath));
  const md = [
    '---',
    `tags: [${frontmatterTags.join(', ')}]`,
    `updated: ${new Date().toISOString().slice(0, 10)}`,
    '---',
    '',
    `# ${title}`,
    '',
    `> 自动更新于 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    '',
    content.trim(),
    '',
  ].join('\n');
  writeFileSync(fullPath, md, 'utf-8');
  return fullPath;
}

// ── 刷新模块 ──

function refreshNationalStats() {
  const s = DATA.NATIONAL_STATS;
  const rows = Object.entries(s).map(([k, v]) => [k, v.toLocaleString()]);
  const content = [
    '## 📊 全国可再生能源统计',
    '',
    mdTable(['指标', '数值'], rows),
  ].join('\n');
  return writeTrackFile('电力新能源/赛道总览.md', '赛道总览', ['电力新能源', '宏观'], content);
}

function refreshProvinceCapacity() {
  const cap = DATA.PROVINCE_INSTALLED_CAPACITY;
  const util = DATA.PROVINCE_UTILIZATION;

  const headers = ['省份', '风电(万kW)', '光伏(万kW)', '储能(万kW)', '风电利用率', '光伏利用率'];
  const rows = Object.entries(cap).map(([prov, v]) => {
    const u = util[prov] || {};
    return [prov, String(v['风电'] || 0), String(v['光伏'] || 0), String(v['储能'] || 0), u['风电'] || '-', u['光伏'] || '-'];
  });

  const content = [
    '## 🗺️ 各省装机容量 & 利用率',
    '',
    mdTable(headers, rows),
    '',
    '## ⚡ 现货市场进展',
    '',
    mdTable(
      ['省份', '状态', '运行时间'],
      Object.entries(DATA.SPOT_MARKET_STATUS).map(([p, v]) => [p, v.status, v.since || '-'])
    ),
  ].join('\n');
  return writeTrackFile('电力新能源/储能/产业链.md', '储能产业链 · 数据面板', ['储能', '数据'], content);
}

function refreshSpotPrices() {
  const prices = DATA.SPOT_PRICES;
  const content = [
    '## 💰 各省现货市场均价',
    '',
    mdTable(
      ['省份', '日前均价(元/MWh)', '实时均价(元/MWh)'],
      Object.entries(prices).map(([p, v]) => [p, String(v.day_ahead || '-'), String(v.real_time || '-')])
    ),
  ].join('\n');
  return writeTrackFile('电力新能源/电力市场/赛道文件.md', '电力市场 · 价格面板', ['电力市场', '价格'], content);
}

function refreshInvestmentRef() {
  const content = [
    '## 💹 投资参考指标',
    '',
    '### 储能系统成本',
    '',
    mdTable(
      ['项目', '单位', '数值'],
      Object.entries(DATA.STORAGE_COST).map(([k, v]) => [k, v.unit || '-', String(v.value || '-')])
    ),
    '',
    '### 各场景 IRR 参考',
    '',
    mdTable(
      ['场景', 'IRR'],
      Object.entries(DATA.PROJECT_IRR).map(([k, v]) => [k, String(v)])
    ),
  ].join('\n');
  return writeTrackFile('电力新能源/储能/投资参考.md', '储能投资参考', ['储能', '投资', 'IRR'], content);
}

function refreshProvincePotential() {
  const pot = DATA.PROVINCE_POTENTIAL;
  const content = [
    '## 🌱 各省开发潜力',
    '',
    mdTable(
      ['省份', '风电潜力', '光伏潜力', '储能潜力', '综合评分'],
      Object.entries(pot).map(([p, v]) => [p, v.wind || '-', v.solar || '-', v.storage || '-', String(v.score || '-')])
    ),
  ].join('\n');
  return writeTrackFile('电力新能源/赛道总览.md', '赛道总览 · 潜力评估', ['电力新能源', '潜力'], '\n\n' + content);
}

// ── 主流程 ──

async function main() {
  const isQuick = process.argv.includes('--quick');
  log(`🚀 刷新知识库数据${isQuick ? ' [快速模式]' : ''}`);

  const results = [];

  results.push({ file: refreshNationalStats(), label: '全国统计' });
  results.push({ file: refreshProvinceCapacity(), label: '各省装机' });
  results.push({ file: refreshSpotPrices(), label: '现货价格' });
  results.push({ file: refreshInvestmentRef(), label: '投资参考' });

  if (!isQuick) {
    results.push({ file: refreshProvincePotential(), label: '开发潜力' });
  }

  log('');
  for (const r of results) {
    log(`  ✅ ${r.label}: ${r.file.replace(KB_ROOT, '知识库')}`);
  }

  // git commit
  try {
    execSync('git add -A 知识库/', { cwd: '/Users/Admin/OpencodeWorkspace', timeout: 10000 });
    execSync('git diff --cached --quiet || git commit -m "auto-refresh: 知识库数据更新 $(date +\'%Y-%m-%d %H:%M\')"', {
      cwd: '/Users/Admin/OpencodeWorkspace', timeout: 10000,
    });
    log('✅ git commit 完成');
  } catch (e) {
    log(`⚠️ git: ${e.message.slice(0, 100)}`);
  }

  log(`📊 ${results.length} 个文件已更新`);
  return results;
}

await main();
