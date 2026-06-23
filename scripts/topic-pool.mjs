#!/usr/bin/env node
/**
 * topic-pool.mjs — 选题池管理 CLI
 *
 * 持久化存储待生产选题，支持定时触发、优先级管理、状态追踪。
 *
 * 用法:
 *   node topic-pool.mjs add --topic "xxx" [--priority P0|P1|P2] [--types article,website] [--schedule 2026-06-10]
 *   node topic-pool.mjs list [--due] [--status pending|done|failed]
 *   node topic-pool.mjs produce --id <id>
 *   node topic-pool.mjs produce --due         # 生产所有到期选题（默认行为）
 *   node topic-pool.mjs status --id <id> --status done|failed
 *   node topic-pool.mjs remove --id <id>
 *   node topic-pool.mjs cron [--interval 30]  # 持续轮询（配合 launchd）
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POOL_PATH = join(__dirname, '生产批次', 'topic-pool.json');

// ── 数据模型 ──

function loadPool() {
  if (!existsSync(POOL_PATH)) return { version: 1, topics: [] };
  return JSON.parse(readFileSync(POOL_PATH, 'utf-8'));
}

function savePool(pool) {
  writeFileSync(POOL_PATH, JSON.stringify(pool, null, 2), 'utf-8');
}

function newId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── CLI ──

function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
  };
  return {
    cmd,
    topic: get('--topic'),
    priority: get('--priority') || 'P1',
    types: (get('--types') || 'article,website').split(',').map(s => s.trim()),
    schedule: get('--schedule') || todayStr(),
    id: get('--id'),
    status: get('--status') || 'pending',
    due: args.includes('--due'),
    interval: parseInt(get('--interval') || '30', 10),
  };
}

// ── Commands ──

function cmdAdd(opts) {
  if (!opts.topic) { console.error('❌ 必须指定 --topic'); process.exit(1); }
  const pool = loadPool();
  const exists = pool.topics.some(t => t.topic === opts.topic && t.status === 'pending');
  if (exists) { console.log('⚠️  选题已存在（pending）: ' + opts.topic); return; }

  const entry = {
    id: newId(),
    topic: opts.topic,
    priority: opts.priority,
    types: opts.types,
    schedule: opts.schedule,
    status: 'pending',
    createdAt: new Date().toISOString(),
    producedAt: null,
    notes: '',
  };
  pool.topics.push(entry);
  savePool(pool);
  console.log(`✅ 已加入选题池: [${entry.priority}] ${entry.topic} (${entry.id})`);
  console.log(`   计划: ${entry.schedule} | 类型: ${entry.types.join(', ')}`);
}

function cmdList(opts) {
  const pool = loadPool();
  if (pool.topics.length === 0) { console.log('📭 选题池为空'); return; }

  let items = pool.topics;
  if (opts.status) items = items.filter(t => t.status === opts.status);
  if (opts.due) items = items.filter(t => t.schedule <= todayStr() && t.status === 'pending');

  if (items.length === 0) {
    if (opts.due) console.log('📭 没有到期待生产的选题');
    else console.log(`📭 没有状态为 "${opts.status}" 的选题`);
    return;
  }

  // 按优先级+计划排序
  const prioOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  items.sort((a, b) => (prioOrder[a.priority] || 9) - (prioOrder[b.priority] || 9) || a.schedule.localeCompare(b.schedule));

  console.log(`\n📋 选题池（${items.length}/${pool.topics.length} 项）`);
  console.log('-'.repeat(80));
  console.log('  优先级  计划日期   状态      选题');
  console.log('-'.repeat(80));
  for (const t of items) {
    const dueMark = t.schedule <= todayStr() && t.status === 'pending' ? ' 🔔' : '';
    console.log(`  [${t.priority}]  ${t.schedule}  ${t.status.padEnd(8)} ${t.topic}${dueMark}`);
  }
  console.log('-'.repeat(80));
  if (opts.due) {
    console.log('  生产: node topic-pool.mjs produce --due');
  }
  console.log();
}

function cmdProduce(opts) {
  const pool = loadPool();
  let targets = [];

  if (opts.id) {
    const t = pool.topics.find(x => x.id === opts.id);
    if (!t) { console.error(`❌ 未找到选题: ${opts.id}`); process.exit(1); }
    targets = [t];
  } else {
    // --due 或默认：所有到期 pending
    targets = pool.topics.filter(t => t.schedule <= todayStr() && t.status === 'pending');
    if (targets.length === 0) { console.log('📭 没有到期待生产的选题'); return; }
  }

  for (const t of targets) {
    console.log(`\n===== 生产: [${t.priority}] ${t.topic} =====`);
    // 标记生产中
    t.status = 'producing';
    savePool(pool);

    const typesArg = t.types.join(',');
    const cmd = `node "${join(__dirname, 'content-pipe.mjs')}" --topic "${t.topic}" --types ${typesArg} --skip-research`;

    try {
      console.log(`> ${cmd}`);
      const out = execSync(cmd, { cwd: __dirname, timeout: 600000, encoding: 'utf-8', stdio: 'inherit' });
      t.status = 'done';
      t.producedAt = new Date().toISOString();
      console.log(`✅ 生产完成: ${t.topic}`);
    } catch (e) {
      t.status = 'failed';
      t.notes = `生产失败: ${e.message?.slice(0, 200) || '未知错误'}`;
      console.error(`❌ 生产失败: ${t.topic}`);
      console.error(`    ${t.notes}`);
    }
    savePool(pool);
  }
}

function cmdStatus(opts) {
  if (!opts.id) { console.error('❌ 必须指定 --id'); process.exit(1); }
  const pool = loadPool();
  const t = pool.topics.find(x => x.id === opts.id);
  if (!t) { console.error(`❌ 未找到选题: ${opts.id}`); process.exit(1); }
  if (!opts.status || !['pending', 'done', 'failed', 'producing'].includes(opts.status)) {
    console.error('❌ 必须指定 --status pending|done|failed|producing'); process.exit(1);
  }
  t.status = opts.status;
  if (opts.status === 'done') t.producedAt = new Date().toISOString();
  savePool(pool);
  console.log(`✅ ${t.topic} → ${opts.status}`);
}

function cmdRemove(opts) {
  if (!opts.id) { console.error('❌ 必须指定 --id'); process.exit(1); }
  const pool = loadPool();
  const idx = pool.topics.findIndex(x => x.id === opts.id);
  if (idx < 0) { console.error(`❌ 未找到选题: ${opts.id}`); process.exit(1); }
  const removed = pool.topics.splice(idx, 1)[0];
  savePool(pool);
  console.log(`🗑️  已移除: ${removed.topic}`);
}

function cmdCron(opts) {
  console.log(`🔄 选题轮询启动（每 ${opts.interval} 分钟检查）`);
  console.log(`   按 Ctrl+C 停止\n`);
  const intervalMs = opts.interval * 60 * 1000;

  function tick() {
    const pool = loadPool();
    const due = pool.topics.filter(t => t.schedule <= todayStr() && t.status === 'pending');
    if (due.length > 0) {
      console.log(`\n🔔 发现 ${due.length} 个到期选题，启动生产...`);
      // 保存并关闭 pool 引用，由 cmdProduce 重新加载
      savePool(pool);
      cmdProduce({ ...opts, due: true });
    } else {
      console.log(`[${new Date().toLocaleString()}] 无到期选题，下次检查 ${opts.interval} 分钟后`);
    }
  }

  tick();
  setInterval(tick, intervalMs);
}

// ── Main ──

function help() {
  console.log(`
📋 选题池管理 — topic-pool.mjs

用法:
  add      node topic-pool.mjs add --topic "xxx" [--priority P0] [--types article,website] [--schedule 2026-06-10]
  list     node topic-pool.mjs list [--due] [--status pending]
  produce  node topic-pool.mjs produce [--due] [--id <id>]
  status   node topic-pool.mjs status --id <id> --status done|failed
  remove   node topic-pool.mjs remove --id <id>
  cron     node topic-pool.mjs cron [--interval 30]

示例:
  node topic-pool.mjs add --topic "双碳政策2026" --priority P0 --types article,website --schedule 2026-06-05
  node topic-pool.mjs list --due
  node topic-pool.mjs produce --due
  node topic-pool.mjs cron --interval 60
`);
}

function main() {
  const opts = parseArgs();
  switch (opts.cmd) {
    case 'add': cmdAdd(opts); break;
    case 'list': cmdList(opts); break;
    case 'produce': cmdProduce(opts); break;
    case 'status': cmdStatus(opts); break;
    case 'remove': cmdRemove(opts); break;
    case 'cron': cmdCron(opts); break;
    default: help(); break;
  }
}

main();
