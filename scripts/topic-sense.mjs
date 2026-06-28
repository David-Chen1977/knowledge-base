#!/usr/bin/env node
/**
 * topic-sense — 选题感知与自动化提醒
 *
 * 用法:
 *   node topic-sense.mjs show          查看当前建议选题
 *   node topic-sense.mjs scan          扫描知识库，分析覆盖缺口
 *   node topic-sense.mjs suggest       输出推荐选题（综合策略）
 *   node topic-sense.mjs watch         检查关注领域的最新动态
 *   node topic-sense.mjs init          初始化选题跟踪数据库
 *
 * 选题策略:
 *   1. 知识库缺口 — 30-Notes/ 哪些领域内容少
 *   2. 政策热点   — 跟踪政策文件变化
 *   3. 兴趣延续   — 已产出内容的自然延伸
 *   4. 时间节点   — 财报季、政策窗口、行业会议
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname);
const VAULT = '/Users/Admin/知识库Vault';
const NOTES_DIR = join(VAULT, '01_赛道研究');
const READING_DIR = join(VAULT, '01_赛道研究');
const DECISIONS_DIR = join(VAULT, '00_MOC');
const DAILY_DIR = join(VAULT, '06_复盘笔记');
const OUTPUT_DIR = join(DOCS, 'OpenCode生成文件');
const TRACKING_FILE = join(DOCS, '.topic-sense.json');
const PRODUCTION_LOG = join(VAULT, '06_复盘笔记', 'production-log.md');

// ── 领域定义 ──

const DOMAINS = [
  { id: 'charging', name: '充电桩/重卡充电', tags: ['充电桩', '重卡', '充电'] },
  { id: 'power-market', name: '电力市场/电力交易', tags: ['电力市场', '电力交易', '电改', '现货'] },
  { id: 'AI-energy', name: 'AI+能源', tags: ['AI', '能源', '人工智能', '算力'] },
  { id: 'carbon', name: '双碳/碳中和', tags: ['双碳', '碳中和', '碳交易', '碳市场'] },
  { id: 'fund', name: '基金投资/一级市场', tags: ['基金', '投资', '一级市场', 'VC'] },
  { id: 'policy', name: '政策研究', tags: ['政策', '发改委', '能源局', '规划'] },
  { id: 'suan-dian', name: '算电协同', tags: ['算电协同', '算力', '数据中心'] },
  { id: 'storage', name: '储能/光储充', tags: ['储能', '光储充', '光伏', '电池'] },
];

// ── 工具 ──

function getArgs() {
  return process.argv[2] || 'show';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readDirSafe(dir) {
  try { return readdirSync(dir); } catch { return []; }
}

function readFileSafe(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return ''; }
}

function countFilesByTags(dir, tags) {
  let count = 0;
  const files = readDirSafe(dir);
  for (const f of files) {
    const content = readFileSafe(join(dir, f));
    if (tags.some(tag => content.toLowerCase().includes(tag.toLowerCase()))) {
      count++;
    }
  }
  return count;
}

// ── 初始化跟踪数据库 ──

function initTracking() {
  const data = {
    initializedAt: today(),
    lastScan: null,
    topics: [],
    covered: {},
    ignored: [],
    productionHistory: {},
  };
  writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ 选题跟踪数据库已初始化: ${TRACKING_FILE}`);
  return data;
}

function loadTracking() {
  if (!existsSync(TRACKING_FILE)) return initTracking();
  return JSON.parse(readFileSync(TRACKING_FILE, 'utf-8'));
}

function saveTracking(data) {
  writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ── 扫描知识库覆盖情况 ──

function scanCoverage() {
  console.log('🔍 扫描知识库覆盖情况...\n');

  const coverage = {};

  for (const domain of DOMAINS) {
    const noteCount = countFilesByTags(NOTES_DIR, domain.tags);
    const readingCount = countFilesByTags(READING_DIR, domain.tags);
    const decisionCount = countFilesByTags(DECISIONS_DIR, domain.tags);
    const productionCount = countFilesByTags(DAILY_DIR, domain.tags);

    const total = noteCount + readingCount + decisionCount;
    const level = total >= 5 ? 'high' : total >= 2 ? 'medium' : 'low';

    coverage[domain.id] = {
      name: domain.name,
      notes: noteCount,
      readings: readingCount,
      decisions: decisionCount,
      productions: productionCount,
      total,
      level,
    };

    const icon = level === 'high' ? '🟢' : level === 'medium' ? '🟡' : '🔴';
    console.log(`  ${icon} ${domain.name.padEnd(16)} ${total} 条（笔记:${noteCount} 阅读:${readingCount} 决策:${decisionCount}）`);
  }

  // 找出缺口领域
  const gaps = DOMAINS
    .map(d => ({ ...d, coverage: coverage[d.id] }))
    .filter(d => d.coverage.level === 'low')
    .map(d => ({ id: d.id, name: d.name, count: d.coverage.total }));

  console.log('\n📊 覆盖率总结:');
  console.log(`   🟢 高覆盖: ${DOMAINS.filter(d => coverage[d.id].level === 'high').length}`);
  console.log(`   🟡 中等:   ${DOMAINS.filter(d => coverage[d.id].level === 'medium').length}`);
  console.log(`   🔴 缺口:   ${DOMAINS.filter(d => coverage[d.id].level === 'low').length}`);

  if (gaps.length > 0) {
    console.log('\n📌 知识库缺口:');
    for (const g of gaps) {
      console.log(`   🔴 ${g.name}（仅 ${g.count} 条）`);
    }
  }

  return coverage;
}

// ── 读取生产历史 ──

function readProductionHistory() {
  const log = readFileSafe(PRODUCTION_LOG);
  const lines = log.split('\n').filter(l => l.startsWith('|') && l.includes('✅'));
  // 跳过表头
  const data = lines.slice(1).map(l => {
    const parts = l.split('|').map(s => s.trim()).filter(Boolean);
    return { date: parts[0], topic: parts[1], dir: parts[2] };
  });
  return data;
}

// ── 生成选题建议 ──

function suggestTopics(coverage, history) {
  console.log('\n=== 选题建议 ===\n');

  const suggestions = [];

  // 1. 知识库缺口优先
  const gaps = DOMAINS
    .filter(d => coverage[d.id]?.level === 'low')
    .map(d => ({
      topic: `${d.name}深度分析`,
      reason: `知识库缺口（仅 ${coverage[d.id]?.total || 0} 条）`,
      priority: '高',
      domain: d.id,
    }));
  suggestions.push(...gaps);

  // 2. 基于产出历史的热点延续
  const recentTopics = history.slice(-5);
  const extendPairs = [
    { from: '充电桩', to: '重卡充电投资机会' },
    { from: '电力市场', to: '电力现货交易策略' },
    { from: '双碳', to: '碳市场CCER重启机会' },
    { from: '算电协同', to: '数据中心绿电采购趋势' },
    { from: 'AI', to: 'AI+能源落地案例' },
    { from: '储能', to: '工商业储能经济性分析' },
  ];

  for (const pair of extendPairs) {
    const hasBase = recentTopics.some(t => t.topic.includes(pair.from));
    const alreadyDone = history.some(t => t.topic.includes(pair.to));
    if (hasBase && !alreadyDone) {
      suggestions.push({
        topic: pair.to,
        reason: `延续 "${pair.from}" 系列`,
        priority: '中',
        domain: DOMAINS.find(d => pair.from.includes(d.name) || d.name.includes(pair.from))?.id || 'general',
      });
    }
  }

  // 3. 时间节点选题
  const currentMonth = new Date().getMonth() + 1;
  const seasonalTopics = [
    { month: [5, 6], topic: '夏季用电高峰与虚拟电厂投资', priority: '高' },
    { month: [6, 7], topic: '年中经济工作会议前瞻', priority: '中' },
    { month: [3, 4, 10, 11], topic: '电力市场交易与电价波动', priority: '中' },
    { month: [12, 1], topic: '年度政策回顾与来年展望', priority: '高' },
  ];

  for (const st of seasonalTopics) {
    if (st.month.includes(currentMonth)) {
      const alreadyDone = history.some(t => t.topic.includes(st.topic.slice(0, 6)));
      if (!alreadyDone) {
        suggestions.push({
          topic: st.topic,
          reason: '季节性选题',
          priority: st.priority,
          domain: 'policy',
        });
      }
    }
  }

  // 去重
  const seen = new Set();
  const unique = suggestions.filter(s => {
    if (seen.has(s.topic)) return false;
    seen.add(s.topic);
    return true;
  });

  // 按优先级排序
  const priorityOrder = { '高': 0, '中': 1, '低': 2 };
  unique.sort((a, b) => (priorityOrder[a.priority] || 9) - (priorityOrder[b.priority] || 9));

  if (unique.length === 0) {
    console.log('  暂无新选题建议。已覆盖全部领域。');
    return;
  }

  for (const s of unique) {
    const prioIcon = s.priority === '高' ? '🔴' : s.priority === '中' ? '🟡' : '🟢';
    console.log(`  ${prioIcon} [${s.priority}] ${s.topic}`);
    console.log(`         ${s.reason}`);
    console.log();
  }

  return unique;
}

// ── 展示当前状态 ──

function cmdShow() {
  const tracking = loadTracking();

  console.log('\n=== 选题感知系统 ===\n');
  console.log(`📅 今日: ${today()}`);
  console.log(`📊 上次扫描: ${tracking.lastScan || '从未'}`);
  console.log(`📝 已产出主题: ${tracking.topics?.length || 0} 个\n`);

  // 扫描覆盖
  const coverage = scanCoverage();
  const history = readProductionHistory();

  console.log(`\n📋 最近生产记录:`);
  const recent = history.slice(-5).reverse();
  for (const r of recent) {
    console.log(`   📄 ${r.date}: ${r.topic}`);
  }

  // 选题建议
  suggestTopics(coverage, history);

  // 更新跟踪
  tracking.lastScan = today();
  saveTracking(tracking);
}

function cmdScan() {
  const coverage = scanCoverage();
  const tracking = loadTracking();
  tracking.lastScan = today();
  tracking.coverage = coverage;
  saveTracking(tracking);
  console.log('\n✅ 扫描完成');
}

function cmdSuggest() {
  const tracking = loadTracking();
  const coverage = tracking.coverage || scanCoverage();
  const history = readProductionHistory();
  const suggestions = suggestTopics(coverage, history);
  return suggestions;
}

// ── 监控模式：调用 domain-watch 扫描外部信号 ──

async function cmdWatch() {
  console.log('\n=== 📡 监控模式 ===\n');
  console.log('🔍 扫描外部信号...\n');

  const domainWatch = join(DOCS, 'domain-watch.mjs');
  if (!existsSync(domainWatch)) {
    console.log('⚠️ domain-watch.mjs 不存在，跳过外部信号扫描');
    console.log('📋 基于知识库缺口生成建议:\n');
    const tracking = loadTracking();
    const coverage = tracking.coverage || scanCoverage();
    const history = readProductionHistory();
    suggestTopics(coverage, history);
    return;
  }

  // 1. 运行 domain-watch 扫描（静默模式）
  try {
    execSync(`node "${domainWatch}" scan`, { cwd: DOCS, stdio: 'pipe', timeout: 60000, encoding: 'utf-8' });
  } catch {
    console.log('⚠️ 外部信号扫描异常（网络可能不可用）');
  }

  // 2. 读取信号并展示
  const signalsFile = join(DOCS, '.domain-signals.json');
  let signals = [];
  try {
    const raw = readFileSync(signalsFile, 'utf-8');
    const data = JSON.parse(raw);
    signals = data.signals || [];
  } catch {
    log('ℹ️', '信号文件不可读（首次运行或无信号）');
  }

  // 3. 展示高价值未消费信号
  const hotSignals = signals.filter(s => !s.consumed && s.relevance >= 0.5);
  if (hotSignals.length > 0) {
    console.log(`\n🔥 高价值外部信号（${hotSignals.length} 条）:\n`);

    const typeIcons = { policy: '📜', market: '💰', news: '📰', opinion: '💬' };
    const domainMap = {};
    for (const d of DOMAINS) domainMap[d.id] = d.name;

    for (const s of hotSignals.slice(0, 10)) {
      const icon = typeIcons[s.type] || '📄';
      const domainName = domainMap[s.domain] || s.domain;
      const relStars = s.relevance >= 0.7 ? '⭐⭐' : s.relevance >= 0.5 ? '⭐' : '';
      console.log(`  ${icon} ${relStars} [${domainName}] ${s.title}`);
      if (s.snippet) console.log(`     ${s.snippet.slice(0, 100)}`);
      if (s.url) console.log(`     ${s.url}`);
      console.log();
    }
  } else {
    console.log('  ℹ️ 无未消费高价值信号');
  }

  // 4. 基于知识库缺口的选题建议
  console.log('📋 基于知识库的选题建议:\n');
  const tracking = loadTracking();
  const coverage = tracking.coverage || scanCoverage();
  const history = readProductionHistory();
  const suggestions = suggestTopics(coverage, history);

  // 5. 如果有信号，尝试交叉推荐
  if (hotSignals.length > 0 && suggestions) {
    // 找信号密集领域但知识库缺口
    const signalDomains = new Set(hotSignals.map(s => s.domain));
    const gapDomains = DOMAINS.filter(d => coverage[d.id]?.level === 'low').map(d => d.id);
    const crossDomains = [...signalDomains].filter(d => gapDomains.includes(d));

    if (crossDomains.length > 0) {
      console.log('\n🔄 交叉推荐（外部信号→知识库缺口）:\n');
      for (const dId of crossDomains) {
        const name = DOMAINS.find(d => d.id === dId)?.name || dId;
        const domainSignals = hotSignals.filter(s => s.domain === dId).slice(0, 2);
        console.log(`  🔴 ${name}（信号密集但知识库仅 ${coverage[dId]?.total || 0} 条）:`);
        for (const s of domainSignals) {
          console.log(`     📄 ${s.title}`);
        }
        console.log();
      }
    }
  }

  console.log('💡 使用建议:');
  console.log('   node content-pipe.mjs --suggest             查看完整选题');
  console.log('   node content-pipe.mjs --topic "选题名"      开始生产');
  console.log();
}

// ── 主入口 ──

async function main() {
  const cmd = getArgs();
  switch (cmd) {
    case 'init':
      initTracking();
      break;
    case 'show':
      cmdShow();
      break;
    case 'scan':
      cmdScan();
      break;
    case 'suggest':
      cmdSuggest();
      break;
    case 'watch':
      await cmdWatch();
      break;
    default:
      console.log(`用法: node topic-sense.mjs <command>`);
      console.log(`命令: init, show, scan, suggest, watch`);
      break;
  }
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
