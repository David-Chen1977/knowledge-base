#!/usr/bin/env node
/**
 * log-session.mjs — 统一会话日志写入器
 *
 * 两个工具共用此日志，确保切换时对方能"接上话"。
 *
 * 用法:
 *   node log-session.mjs <tool> <sessionId> <action> <detail>
 *
 * 示例:
 *   node log-session.mjs opencode "ses_xxx" "三件套生产" "04_冷却液材料 公众号文章推送草稿箱"
 *   node log-session.mjs workbuddy "wb_xxx" "可视化生成" "冷却液材料市场规模柱状图"
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = resolve(__dirname, 'context-log.json');

function readLog() {
  try {
    return JSON.parse(readFileSync(LOG_PATH, 'utf-8'));
  } catch {
    return { version: 1, description: '统一会话日志', entries: [], lastUpdated: new Date().toISOString() };
  }
}

function writeLog(log) {
  log.lastUpdated = new Date().toISOString();
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), 'utf-8');
}

const [,, tool, sessionId, action, detail] = process.argv;

if (!tool || !action) {
  console.error('用法: node log-session.mjs <opencode|workbuddy> <sessionId> <action> <detail>');
  process.exit(1);
}

const log = readLog();

log.entries.push({
  timestamp: new Date().toISOString(),
  tool,
  sessionId: sessionId || '',
  action,
  detail: detail || ''
});

// 保留最近 200 条
if (log.entries.length > 200) {
  log.entries = log.entries.slice(-200);
}

writeLog(log);

const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
console.log(`${ts} ✅ 会话日志已记录: ${tool} › ${action}${detail ? ` — ${detail}` : ''}`);
