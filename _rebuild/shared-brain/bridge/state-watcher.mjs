#!/usr/bin/env node
/**
 * state-watcher.mjs — 双工具协同事件监听器 v3
 *
 * 监听 state.json + brain/task-queue.json + brain/handoff/ 的变化，
 * 自动触发 WorkBuddy 的相应动作。
 *
 * 使用:
 *   node bridge/state-watcher.mjs          # 前台运行
 *   bash bridge/start-watcher.sh           # 后台运行（推荐）
 *   pm2 start bridge/state-watcher.mjs     # 用 pm2 守护进程
 */

import { watch, readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATE_PATH = resolve(ROOT, 'context', 'state.json');
const TASK_QUEUE_PATH = resolve(ROOT, 'brain', 'task-queue.json');
const HANDOFF_DIR = resolve(ROOT, 'brain', 'handoff');
const LOG_PATH = resolve(ROOT, 'logs', 'watcher.log');
const VIZ_BRIDGE = resolve(__dirname, 'workbuddy-visualization-bridge.mjs');

// 缓存（用于检测变化）
let lastPhase = null;
let lastBlocked = null;
let lastTaskCount = 0;
let processedHandoffs = new Set();

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  console.log(line.trim());
  try { writeFileSync(LOG_PATH, line, { flag: 'a' }); } catch {}
}

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch { return null; }
}

function logSession(tool, action, detail) {
  try {
    execSync(`node ${resolve(ROOT, 'brain', 'log-session.mjs')} ${tool} watcher "${action}" "${detail}"`, { timeout: 5000 });
  } catch {}
}

// ── 动作触发器 ──

function triggerVisualization() {
  log('🎨 触发可视化桥接...');
  const child = spawn('node', [VIZ_BRIDGE], { cwd: ROOT, stdio: 'inherit' });
  child.on('exit', (code) => {
    log(code === 0 ? '✅ 可视化桥接完成' : `❌ 可视化桥接失败 (exit ${code})`);
  });
}

function notifyBlocked(reason) {
  log(`⚠️ 管线阻塞: ${reason}`);
  
  // 调用 Server酱 通知脚本
  const scriptPath = join(__dirname, 'serverchan-notify.mjs');
  if (existsSync(scriptPath)) {
    const msg = `⚠️ 内容管线阻塞\n\n原因: ${reason}\n\n请打开 WorkBuddy 处理。`;
    const child = spawn('node', [scriptPath, '⚠️ 管线阻塞', msg], { 
      cwd: ROOT, 
      stdio: 'inherit' 
    });
    child.on('exit', (code) => {
      if (code === 0) {
        log('✅ Server酱通知已发送（微信推送）');
      } else {
        log(`⚠️ Server酱通知失败 (exit ${code})，请检查 config/notify-config.json`);
      }
    });
  } else {
    log('⚠️ 企微通知脚本不存在，跳过通知');
  }
}

function checkHandoff() {
  if (!existsSync(HANDOFF_DIR)) return;
  const files = readdirSync(HANDOFF_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('EXAMPLE'))
    .sort();

  for (const file of files) {
    if (processedHandoffs.has(file)) continue;

    const data = readJSON(join(HANDOFF_DIR, file));
    if (!data) continue;

    processedHandoffs.add(file);
    log(`📦 检测到新交接: ${data.from} → ${data.to} | ${data.context.topic}`);

    // 如果交接是给 WorkBuddy 的，触发相应动作
    if (data.to === 'workbuddy') {
      logSession('watcher', '交接处理', `${data.context.topic}: ${data.summary}`);

      if (data.needsFromReceiver.some(t => /图表|可视化|chart/i.test(t))) {
        triggerVisualization();
      }

      // 更新 state.json 记录已处理
      const state = readJSON(STATE_PATH);
      if (state) {
        state.pipeline.handoffPending = false;
        state.brain.lastHandoffProcessed = file;
        writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
      }
    }
  }
}

function checkTaskQueue() {
  const queue = readJSON(TASK_QUEUE_PATH);
  if (!queue || !queue.tasks) return;

  const pendingTasks = queue.tasks.filter(t => t.status === 'pending' && t.for === 'workbuddy');
  if (pendingTasks.length > 0 && pendingTasks.length !== lastTaskCount) {
    log(`📋 检测到 ${pendingTasks.length} 个待处理任务 (for WorkBuddy)`);
    pendingTasks.forEach(t => log(`   · [${t.type}] ${t.description}`));

    // 自动执行已知任务类型
    for (const task of pendingTasks) {
      if (task.type === 'visualize') {
        triggerVisualization();
        task.status = 'in_progress';
      }
    }

    writeFileSync(TASK_QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf-8');
    lastTaskCount = pendingTasks.length;
  }
}

// ── 状态机引擎 ──

function onStateChange(state) {
  // phase 变化
  if (state.pipeline.phase !== lastPhase) {
    log(`🔄 phase: ${lastPhase} → ${state.pipeline.phase}`);

    if (state.pipeline.phase === 'publish') {
      triggerVisualization();
      logSession('watcher', '发布检测', state.pipeline.topic);
    }

    lastPhase = state.pipeline.phase;
  }

  // blocked 变化
  if (state.pipeline.blocked !== lastBlocked) {
    if (state.pipeline.blocked) notifyBlocked(state.pipeline.blockedReason);
    lastBlocked = state.pipeline.blocked;
  }

  // handoff pending
  if (state.pipeline.handoffPending && state.pipeline.pendingHandoffFrom === 'opencode') {
    checkHandoff();
  }
}

// ── 启动 ──

function startWatching() {
  log('🚀 双工具协同监听器 v3 启动');
  log(`📁 工作区: ${ROOT}`);

  // 初始加载
  const initialState = readJSON(STATE_PATH);
  if (initialState) {
    lastPhase = initialState.pipeline.phase;
    lastBlocked = initialState.pipeline.blocked;
    log(`👀 当前 phase: ${lastPhase}, blocked: ${lastBlocked}`);
    checkHandoff();
    checkTaskQueue();
  }

  // 监听 state.json
  watch(STATE_PATH, { persistent: true }, () => {
    setTimeout(() => {
      const state = readJSON(STATE_PATH);
      if (state) onStateChange(state);
    }, 200);
  });

  // 监听 task-queue.json
  if (existsSync(TASK_QUEUE_PATH)) {
    watch(TASK_QUEUE_PATH, { persistent: true }, () => {
      setTimeout(checkTaskQueue, 200);
    });
  }

  // 监听 handoff 目录
  if (existsSync(HANDOFF_DIR)) {
    watch(HANDOFF_DIR, { persistent: true }, () => {
      setTimeout(checkHandoff, 300);
    });
  }

  // 心跳
  setInterval(() => {
    const state = readJSON(STATE_PATH);
    if (state) {
      log(`💓 运行中 | phase: ${state.pipeline.phase} | blocked: ${state.pipeline.blocked}`);
      checkHandoff();
      checkTaskQueue();
    }
  }, 60000);
}

startWatching();
