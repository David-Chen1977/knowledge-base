#!/usr/bin/env node
/**
 * wecom-notify.mjs
 * 
 * 企业微信通知脚本 - 发送消息到手机企微 APP
 * 
 * 使用方式：
 *   node wecom-notify.mjs "标题" "内容"
 *   node wecom-notify.mjs "⚠️ 管线阻塞" "3M退出影响分析需要用户提供决策"
 * 
 * 配置方式：
 *   1. 在企微管理后台创建应用，获取 AgentId 和 Secret
 *   2. 将配置写入 wecom-config.json
 *   3. 运行脚本即可发送通知
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, '..', 'config', 'wecom-config.json');

// 读取配置
function readConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

// 获取 access_token
async function getAccessToken(corpid, corpsecret) {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.errcode !== 0) {
    throw new Error(`获取 access_token 失败: ${data.errmsg}`);
  }
  return data.access_token;
}

// 发送文本消息
async function sendTextMessage(accessToken, agentid, touser, content) {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
  const body = {
    touser: touser,
    msgtype: 'text',
    agentid: agentid,
    text: {
      content: content
    },
    safe: 0
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  if (data.errcode !== 0) {
    throw new Error(`发送消息失败: ${data.errmsg}`);
  }
  return data;
}

// 发送 Markdown 消息（支持格式）
async function sendMarkdownMessage(accessToken, agentid, touser, title, content) {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
  const markdownContent = `## ${title}\n\n${content}`;
  
  const body = {
    touser: touser,
    msgtype: 'markdown',
    agentid: agentid,
    markdown: {
      content: markdownContent
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  if (data.errcode !== 0) {
    throw new Error(`发送消息失败: ${data.errmsg}`);
  }
  return data;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('用法: node wecom-notify.mjs <标题> <内容> [用户ID]');
    console.error('示例: node wecom-notify.mjs "⚠️ 管线阻塞" "需要用户提供决策"');
    process.exit(1);
  }
  
  const [title, content, touser] = args;
  const user = touser || '@all'; // 默认发给所有人
  
  // 读取配置
  const config = readConfig();
  if (!config) {
    console.error('❌ 未找到企微配置');
    console.error('请先创建 config/wecom-config.json，参考 wecom-config-template.json');
    process.exit(1);
  }
  
  try {
    // 获取 access_token
    const accessToken = await getAccessToken(config.corpid, config.corpsecret);
    
    // 发送 Markdown 消息
    const result = await sendMarkdownMessage(accessToken, config.agentid, user, title, content);
    
    console.log(`✅ 企微通知已发送: ${title}`);
    console.log(`   接收人: ${user}`);
    console.log(`   消息 ID: ${result.msgid}`);
  } catch (error) {
    console.error(`❌ 发送失败: ${error.message}`);
    process.exit(1);
  }
}

main();
