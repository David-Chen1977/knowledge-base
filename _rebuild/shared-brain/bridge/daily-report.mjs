#!/usr/bin/env node
/**
 * daily-report.mjs
 * 
 * 每日工作简报生成器
 * 每天定时运行，生成当天的工作总结并推送到手机
 * 
 * 简报内容：
 * 1. 当天完成的任务列表
 * 2. 新增的产出（文章/PPT/图表）
 * 3. 管线状态
 * 4. 待处理任务
 * 5. 关键决策
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function generateReport() {
  const state = readJSON(resolve(ROOT, 'context', 'state.json'));
  const contextLog = readJSON(resolve(ROOT, 'brain', 'context-log.json'));
  const taskQueue = readJSON(resolve(ROOT, 'brain', 'task-queue.json'));
  const decisions = readJSON(resolve(ROOT, 'brain', 'decisions.json'));
  
  if (!state || !contextLog) {
    console.error('❌ 无法读取状态文件');
    return null;
  }
  
  // 获取今天的日志
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = contextLog.entries.filter(e => e.timestamp.startsWith(today));
  
  // 生成简报
  const report = {
    date: today,
    summary: `## 📊 每日工作简报 (${today})\n`,
    sections: []
  };
  
  // 1. 管线状态
  report.sections.push({
    title: '📈 管线状态',
    content: [
      `当前阶段: ${state.pipeline.phase}`,
      `当前任务: ${state.pipeline.topic || '无'}`,
      `阻塞状态: ${state.pipeline.blocked ? '⚠️ 已阻塞' : '✅ 正常'}`,
      `OpenCode: ${state.openCode.status}`,
      `WorkBuddy: ${state.workBuddy.status}`
    ].join('\n')
  });
  
  // 2. 今天的操作日志
  if (todayLogs.length > 0) {
    const logLines = todayLogs.map(e => {
      const time = new Date(e.timestamp).toLocaleTimeString('zh-CN', { hour12: false });
      return `- ${time} [${e.tool}] ${e.action}: ${e.detail}`;
    }).join('\n');
    
    report.sections.push({
      title: `📝 今天的操作 (${todayLogs.length} 条)`,
      content: logLines
    });
  }
  
  // 3. 产出统计
  const articles = state.project.website.articles || [];
  const ppts = state.project.ppts || [];
  const wechat = state.project.wechat.drafts || [];
  
  report.sections.push({
    title: '📦 产出统计',
    content: [
      `网站文章: ${articles.length} 篇`,
      `PPT: ${ppts.length} 个`,
      `公众号草稿: ${wechat.length} 篇`
    ].join('\n')
  });
  
  // 4. 待处理任务
  if (taskQueue && taskQueue.tasks && taskQueue.tasks.length > 0) {
    const pendingTasks = taskQueue.tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length > 0) {
      const taskLines = pendingTasks.map(t => `- [${t.type}] ${t.description}`).join('\n');
      report.sections.push({
        title: `📋 待处理任务 (${pendingTasks.length} 个)`,
        content: taskLines
      });
    }
  }
  
  // 5. 最新决策
  if (decisions && decisions.decisions && decisions.decisions.length > 0) {
    const recentDecisions = decisions.decisions.slice(-3);
    const decisionLines = recentDecisions.map(d => `- ${d.decision}`).join('\n');
    report.sections.push({
      title: '🎯 关键决策',
      content: decisionLines
    });
  }
  
  // 组装简报
  report.fullText = report.sections.map(s => `### ${s.title}\n${s.content}`).join('\n\n');
  report.markdown = `${report.summary}\n${report.fullText}`;
  
  return report;
}

function sendReport(report) {
  if (!report) return;
  
  console.log('📊 每日工作简报');
  console.log('=' .repeat(50));
  console.log(report.markdown);
  console.log('=' .repeat(50));
  
  // TODO: 推送到企微/微信
  // 调用 wecom-notify.mjs 发送简报
}

// 主函数
function main() {
  const report = generateReport();
  if (report) {
    sendReport(report);
  }
}

main();
