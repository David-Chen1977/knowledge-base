#!/usr/bin/env node
/**
 * serverchan-notify.mjs
 * 使用 Server酱 推送消息到个人微信
 * 
 * 使用方式：
 * node serverchan-notify.mjs "标题" "消息内容"
 * node serverchan-notify.mjs "标题" "消息内容" "https://example.com/详情链接"
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// 读取配置
function loadConfig() {
  const configPath = resolve(ROOT, 'config/notify-config.json');
  if (!existsSync(configPath)) {
    console.error('❌ 配置文件不存在:', configPath);
    console.error('请先创建 config/notify-config.json');
    process.exit(1);
  }
  
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  if (config.provider !== 'serverchan' || !config.sendkey) {
    console.error('❌ 配置错误: 请使用 Server酱 配置');
    console.error('参考 config/notify-config-template.json');
    process.exit(1);
  }
  
  return config;
}

// 发送消息
async function sendMessage(title, content, url = '') {
  const config = loadConfig();
  const { sendkey } = config;
  
  // Server酱 API
  const apiUrl = `https://sctapi.ftqq.com/${sendkey}.send`;
  
  const postData = new URLSearchParams({
    title: title || 'WorkBuddy 通知',
    desp: content || '',
    channel: '9'  // 默认推送到所有渠道
  });
  
  if (url) {
    postData.append('url', url);
  }
  
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData.toString())
      }
    };
    
    const req = https.request(apiUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            console.log('✅ 消息发送成功');
            console.log('   标题:', title);
            console.log('   推送ID:', result.data?.pushid);
            resolve(result);
          } else {
            console.error('❌ 发送失败:', result.message);
            console.error('   错误码:', result.code);
            reject(new Error(result.message));
          }
        } catch (e) {
          console.error('❌ 解析响应失败:', e.message);
          reject(e);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ 网络错误:', e.message);
      reject(e);
    });
    
    req.write(postData.toString());
    req.end();
  });
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方式:');
    console.log('  node serverchan-notify.mjs "标题" "消息内容"');
    console.log('  node serverchan-notify.mjs "标题" "消息内容" "详情链接"');
    process.exit(0);
  }
  
  const title = args[0] || 'WorkBuddy 通知';
  const content = args[1] || '';
  const url = args[2] || '';
  
  try {
    await sendMessage(title, content, url);
    process.exit(0);
  } catch (error) {
    console.error('发送失败:', error.message);
    process.exit(1);
  }
}

main();
