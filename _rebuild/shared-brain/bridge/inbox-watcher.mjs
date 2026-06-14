#!/usr/bin/env node
/**
 * inbox-watcher.mjs
 * 
 * 多源收件箱监听器 - 监听来自手机的文件输入
 * 
 * 监听来源：
 * 1. iCloud Drive /workbuddy-inbox/ (Apple 生态自动同步)
 * 2. 微信文件传输助手自动下载目录
 * 3. 专属收件箱目录
 * 
 * 检测到新文件后：
 * - 移动到工作区
 * - 写入 brain/context-log.json
 * - 触发相应处理（如果是 .md 则当作研究素材，如果是图片则 OCR）
 */

import { watch, readdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INBOX_DIRS = [
  // iCloud Drive 共享文件夹（需要手动创建）
  '/Users/Admin/Library/Mobile Documents/com~apple~CloudDocs/workbuddy-inbox',
  // 微信文件传输助手下载目录（Mac 微信默认路径）
  '/Users/Admin/Downloads/WeChat Files',
  // 专属收件箱
  resolve(ROOT, 'inbox')
];

const PROCESSED_DIR = resolve(ROOT, 'inbox', 'processed');

function log(msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
}

function ensureDir(dir) {
  try {
    readdirSync(dir);
  } catch {
    const { mkdirSync } = require('fs');
    mkdirSync(dir, { recursive: true });
  }
}

function processFile(filePath) {
  const fileName = filePath.split('/').pop();
  log(`📥 收到新文件: ${fileName}`);
  
  // 移动到工作区 inbox/
  const destPath = join(resolve(ROOT, 'inbox'), fileName);
  try {
    renameSync(filePath, destPath);
    log(`✅ 已移动到: ${destPath}`);
    
    // 写入日志
    const logPath = resolve(ROOT, 'brain', 'context-log.json');
    const logData = JSON.parse(readFileSync(logPath, 'utf-8'));
    logData.entries.push({
      timestamp: new Date().toISOString(),
      tool: 'inbox-watcher',
      sessionId: 'phone-input',
      action: '手机文件接收',
      detail: fileName
    });
    writeFileSync(logPath, JSON.stringify(logData, null, 2), 'utf-8');
    
    // TODO: 根据文件类型触发相应处理
    // - .md / .txt → 当作研究素材
    // - .jpg / .png → OCR 提取文字
    // - .pdf → 解析内容
    
  } catch (e) {
    log(`❌ 处理失败: ${e.message}`);
  }
}

function startWatching() {
  log('🚀 收件箱监听器启动');
  
  // 确保专属收件箱存在
  ensureDir(resolve(ROOT, 'inbox'));
  ensureDir(PROCESSED_DIR);
  
  // 监听所有收件箱目录
  for (const dir of INBOX_DIRS) {
    if (!existsSync(dir)) {
      log(`⚠️ 目录不存在: ${dir}`);
      continue;
    }
    
    log(`👀 监听目录: ${dir}`);
    watch(dir, { persistent: true }, (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        const filePath = join(dir, filename);
        // 延迟处理，确保文件写入完成
        setTimeout(() => {
          if (existsSync(filePath)) {
            processFile(filePath);
          }
        }, 500);
      }
    });
  }
  
  // 心跳
  setInterval(() => {
    log('💓 收件箱监听器运行中...');
  }, 60000);
}

startWatching();
