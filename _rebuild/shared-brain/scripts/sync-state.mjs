#!/usr/bin/env node
/**
 * sync-state.mjs — 双工具状态同步脚本
 *
 * OpenCode 在每次完成重要任务后调用此脚本更新 state.json。
 * WorkBuddy 通过定时任务轮询 state.json 变化。
 *
 * 用法:
 *   node sync-state.mjs <tool> <status> <currentTask> [lastOutput]
 *
 * 示例:
 *   node sync-state.mjs opencode working "正在生成冷却液材料公众号文章"
 *   node sync-state.mjs opencode idle "" "公众号文章推送完成"
 *   node sync-state.mjs workbuddy working "正在生成可视化图表"
 *   node sync-state.mjs pipeline research "深挖三个投资方向" ""
 *
 * 状态取值: idle | working | blocked
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = resolve(__dirname, '..', 'context', 'state.json');

function readState() {
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    console.error('❌ 无法读取 state.json');
    process.exit(1);
  }
}

function writeState(state) {
  state.lastSync = new Date().toISOString();
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function log(emoji, msg) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`${ts} ${emoji} ${msg}`);
}

// ── 主逻辑 ──

const [,, tool, status, currentTask, lastOutput] = process.argv;

if (!tool || !status) {
  console.error('用法: node sync-state.mjs <tool|pipeline> <idle|working|blocked> [currentTask] [lastOutput]');
  console.error('示例: node sync-state.mjs opencode working "生成公众号文章"');
  process.exit(1);
}

const validStatuses = ['idle', 'working', 'blocked'];
if (!validStatuses.includes(status)) {
  console.error(`❌ status 必须是 ${validStatuses.join('|')}，收到: ${status}`);
  process.exit(1);
}

const state = readState();

if (tool === 'pipeline') {
  state.pipeline.phase = status;
  if (currentTask) state.pipeline.topic = currentTask;
  if (lastOutput) state.pipeline.currentStep = lastOutput;
  log('📦', `管线状态 → ${status}${currentTask ? ` (${currentTask})` : ''}`);
} else if (tool === 'opencode') {
  state.openCode.status = status;
  state.openCode.lastHeartbeat = new Date().toISOString();
  if (currentTask) state.openCode.currentTask = currentTask;
  if (lastOutput) state.openCode.lastOutput = lastOutput;
  // 如状态为 blocked, 同步反映到 pipeline
  if (status === 'blocked') {
    state.pipeline.blocked = true;
    state.pipeline.blockedReason = currentTask || 'OpenCode 阻塞';
  } else {
    state.pipeline.blocked = false;
    state.pipeline.blockedReason = '';
  }
  log('💻', `OpenCode → ${status}${currentTask ? ` (${currentTask})` : ''}`);
} else if (tool === 'workbuddy') {
  state.workBuddy.status = status;
  state.workBuddy.lastHeartbeat = new Date().toISOString();
  if (currentTask) state.workBuddy.currentTask = currentTask;
  if (lastOutput) state.workBuddy.lastInput = lastOutput;
  log('🤖', `WorkBuddy → ${status}${currentTask ? ` (${currentTask})` : ''}`);
} else {
  console.error(`❌ 未知工具: ${tool}，可选: opencode / workbuddy / pipeline`);
  process.exit(1);
}

// 追加操作日志
state.operationLog.push({
  timestamp: new Date().toISOString(),
  tool,
  action: status,
  detail: currentTask || ''
});

// 保留最近 100 条日志
if (state.operationLog.length > 100) {
  state.operationLog = state.operationLog.slice(-100);
}

writeState(state);
log('✅', `state.json 已同步`);
