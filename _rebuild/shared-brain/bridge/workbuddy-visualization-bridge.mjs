#!/usr/bin/env node
/**
 * workbuddy-visualization-bridge.mjs
 *
 * OpenCode → WorkBuddy 可视化桥接。
 * 从 state.json 读取产出信息，生成 WorkBuddy Visualizer 可直接消费的图表数据。
 *
 * WorkBuddy 定时任务配置：
 *   每 5 分钟执行: node <path>/workbuddy-visualization-bridge.mjs
 *   当检测到新产出 → 生成图表 → 写入 artifacts/ 目录
 *
 * 产出格式：每个图表一个 JSON，WorkBuddy Visualizer 可直接渲染
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = resolve(__dirname, '..', 'context', 'state.json');
const ARTIFACTS_DIR = resolve(__dirname, '..', 'artifacts');
const LAST_RUN_PATH = resolve(__dirname, '..', 'logs', 'viz-last-run.txt');

function readState() {
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch { return null; }
}

function readLastRun() {
  try { return readFileSync(LAST_RUN_PATH, 'utf-8').trim(); } catch { return ''; }
}

function writeLastRun(ts) {
  writeFileSync(LAST_RUN_PATH, ts, 'utf-8');
}

function log(msg) {
  console.log(`[viz-bridge] ${new Date().toISOString()} ${msg}`);
}

// ── 主逻辑 ──

const state = readState();
if (!state) { log('❌ 无法读取 state.json'); process.exit(1); }

const lastRun = readLastRun();
const now = new Date().toISOString();

// 检查是否有新操作日志
const newOps = state.operationLog.filter(op => op.timestamp > lastRun);
if (newOps.length === 0) {
  log('没有新操作，跳过');
  process.exit(0);
}

mkdirSync(ARTIFACTS_DIR, { recursive: true });
mkdirSync(resolve(__dirname, '..', 'logs'), { recursive: true });

// 如果 pipeline 刚完成，生成可视化数据
if (['publish', 'idle'].includes(state.pipeline.phase) && state.pipeline.artifacts.length > 0) {
  const artifacts = state.pipeline.artifacts;

  // 图表 1: 发布统计条形图
  const publishChart = {
    type: 'bar',
    title: '内容产出统计',
    labels: ['公众号文章', '网站文章', 'PPT', '视频'],
    datasets: [{
      label: '本批产出',
      data: [
        artifacts.filter(a => a.type === 'article').length,
        artifacts.filter(a => a.type === 'website').length,
        artifacts.filter(a => a.type === 'ppt').length,
        artifacts.filter(a => a.type === 'video').length,
      ],
      backgroundColor: ['#4361ee', '#3a86ff', '#7209b7', '#f72585']
    }]
  };
  writeFileSync(join(ARTIFACTS_DIR, 'chart-publish-stats.json'), JSON.stringify(publishChart, null, 2));

  // 图表 2: 累计产出饼图
  const totalArticles = state.project.website.articles?.length || 0;
  const totalPpts = state.project.ppts?.length || 0;
  const totalWechat = state.project.wechat.drafts?.length || 0;
  const cumulativeChart = {
    type: 'pie',
    title: '累计内容资产',
    labels: ['网站文章', 'PPT', '公众号草稿'],
    datasets: [{
      data: [totalArticles, totalPpts, totalWechat],
      backgroundColor: ['#3a86ff', '#7209b7', '#06d6a0']
    }]
  };
  writeFileSync(join(ARTIFACTS_DIR, 'chart-cumulative.json'), JSON.stringify(cumulativeChart, null, 2));

  log(`✅ 生成 ${2} 个可视化图表`);
}

writeLastRun(now);
log('可视化桥接完成');
