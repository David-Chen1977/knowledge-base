#!/usr/bin/env node
/**
 * 微信草稿箱更新 — 上传图片 + 更新草稿
 *
 * ⚠️ 已弃用：请使用 wechat_publisher.py 替代此脚本。
 *    wechat_publisher.py 已合并全部功能（含 Keychain 凭证解析、inline 图片上传、
 *    封面/正文图片管理、草稿创建与更新），为统一维护入口。
 *
 * 此前用于替代 wechat_publisher.py（Python SSL 在 macOS 上有兼容问题），
 * 该问题已通过 REQUESTS_KWARGS = {"verify": false} 解决。
 */
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { readFileSync } from 'node:fs';

/**
 * Resolve WeChat AppSecret from (in order):
 * 1. Environment variable WECHAT_APP_SECRET
 * 2. macOS Keychain (security find-generic-password)
 */
async function resolveAppSecret() {
  if (process.env.WECHAT_APP_SECRET) return process.env.WECHAT_APP_SECRET;
  try {
    const { execSync } = await import('child_process');
    const keychain = execSync(
      `security find-generic-password -a "wx7ae4cfe0d680c0fe" -s "wechat-publisher" -w 2>/dev/null`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();
    if (keychain) return keychain;
  } catch { /* keychain not available */ }
  console.error('❌ 未找到 WECHAT_APP_SECRET。请设置环境变量或存入 Keychain:');
  console.error('   export WECHAT_APP_SECRET="你的secret"');
  console.error('   或: security add-generic-password -a "wx7ae4cfe0d680c0fe" -s "wechat-publisher" -w "你的secret"');
  process.exit(1);
}

const APP_ID = 'wx7ae4cfe0d680c0fe';
const APP_SECRET = await resolveAppSecret();
const DRAFT_MEDIA_ID = process.env.WECHAT_DRAFT_MEDIA_ID || '';

async function getAccessToken() {
  const url = `/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`;
  const data = await httpsRequest(url, 'GET');
  if (data.access_token) {
    console.log('✅ access_token 获取成功');
    return data.access_token;
  }
  throw new Error(`获取token失败: ${JSON.stringify(data)}`);
}

function httpsRequest(path, method = 'GET', body = null, contentType = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.weixin.qq.com',
      port: 443,
      path,
      method,
      headers: {},
    };
    if (contentType) opts.headers['Content-Type'] = contentType;
    if (body && !contentType) opts.headers['Content-Type'] = 'application/json; charset=utf-8';
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Parse failed (len=${data.length}): ${data.substring(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

/** Upload image for body content, returns WeChat CDN URL */
async function uploadBodyImage(token, imagePath) {
  const boundary = `----FormBoundary${Date.now()}`;
  const fileName = path.basename(imagePath);
  const fileBuf = readFileSync(imagePath);

  // Build multipart form
  const header = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const bodyBuf = Buffer.concat([header, fileBuf, footer]);

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.weixin.qq.com',
      port: 443,
      path: `/cgi-bin/media/uploadimg?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuf.length,
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const r = JSON.parse(data);
          if (r.url) resolve(r.url);
          else reject(new Error(`Upload failed: ${JSON.stringify(r)}`));
        } catch (e) {
          reject(new Error(`Parse error: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(bodyBuf);
    req.end();
  });
}

/** Upload cover image (thumb type), returns media_id */
async function uploadCover(token, imagePath) {
  const boundary = `----FormBoundary${Date.now()}`;
  const fileName = path.basename(imagePath);
  const fileBuf = readFileSync(imagePath);

  const header = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const bodyBuf = Buffer.concat([header, fileBuf, footer]);

  const data = await new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.weixin.qq.com',
      port: 443,
      path: `/cgi-bin/material/add_material?access_token=${token}&type=thumb`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuf.length,
      },
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { reject(new Error(d.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(bodyBuf);
    req.end();
  });
  if (data.media_id) return data.media_id;
  throw new Error(`Cover upload failed: ${JSON.stringify(data)}`);
}

/** Update existing draft with new images */
async function updateDraft(token, title, htmlContent, digest, author, thumbMediaId) {
  const body = {
    media_id: DRAFT_MEDIA_ID,
    index: 0,
    articles: {
      title,
      author,
      digest,
      content: htmlContent,
      content_source_url: '',
      thumb_media_id: thumbMediaId,
      need_open_comment: 0,
      only_fans_can_comment: 0,
    },
  };
  const jsonStr = JSON.stringify(body);
  const data = await httpsRequest(
    `/cgi-bin/draft/update?access_token=${token}`,
    'POST',
    jsonStr
  );
  if (!data.errcode || data.errcode === 0) {
    console.log('✅ 草稿更新成功！');
    return true;
  }
  throw new Error(`更新失败: ${JSON.stringify(data)}`);
}

async function main() {
  console.log('=== 微信图片上传 + 草稿更新 ===\n');

  // 1. Get token
  const token = await getAccessToken();

  // 2. Upload body images
  const bodyImages = [
    '/Users/Admin/Desktop/inline_1.png',
    '/Users/Admin/Desktop/inline_2.png',
    '/Users/Admin/Desktop/inline_3.png',
  ];
  const bodyUrls = [];
  console.log('📤 上传正文图片...');
  for (let i = 0; i < bodyImages.length; i++) {
    const url = await uploadBodyImage(token, bodyImages[i]);
    console.log(`  inline_${i + 1}.png → ${url}`);
    bodyUrls.push(url);
  }

  // 3. Upload cover
  console.log('\n📤 上传封面...');
  let thumbId;
  try {
    thumbId = await uploadCover(token, '/Users/Admin/Desktop/cover_use.png');
    console.log(`  cover_use.png → media_id: ${thumbId}`);
  } catch (e) {
    console.log(`  ⚠️ 封面上传失败: ${e.message}，使用旧封面`);
    thumbId = null;
  }

  // 4. Read markdown, replace placeholders with image URLs
  console.log('\n📝 组装文章...');
  const mdPath = '/Users/Admin/OpencodeWorkspace/内容输出/算电协同不可能三角/公众号版.md';
  let mdContent = readFileSync(mdPath, 'utf-8');

  // Replace BODY_IMG_1/2/3 with actual CDN URLs
  const replacements = { BODY_IMG_1: bodyUrls[0], BODY_IMG_2: bodyUrls[1], BODY_IMG_3: bodyUrls[2] };
  for (const [key, value] of Object.entries(replacements)) {
    mdContent = mdContent.replace(key, value);
  }

  // Convert to WeChat HTML (simple conversion)
  const htmlContent = mdToWechatHtml(mdContent);

  const title = '算电协同的不可能三角';
  const author = '道雷';
  const digest = '算电协同面临安全绿色经济三重目标，谁在解这个三角';

  // 5. Update draft
  console.log('💾 更新草稿箱...');
  await updateDraft(token, title, htmlContent, digest, author, thumbId);

  console.log('\n🎉 完成！请前往公众号后台确认。');
}

function mdToWechatHtml(md) {
  // Remove the first # title line (WeChat shows it separately)
  md = md.replace(/^# .+\n/, '');
  md = md.replace(/\n# .+\n/, '\n');

  // Convert basic markdown to HTML
  let html = md;

  // Convert images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    return `<img src="${src}" alt="${alt}" style="width:100%;border-radius:8px;margin:16px 0;" />`;
  });

  // Convert bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Convert italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Convert separators
  html = html.replace(/^---+/gm, '<section style="height:1px;background:#e0e0e0;margin:15px 0;"></section>');

  // Convert blockquotes
  html = html.replace(/^>\s*(.+)$/gm, (_, text) => {
    return `<blockquote style="padding:12px 16px;background:#f7f7f7;border-left:4px solid #c00000;margin:16px 0;font-size:14px;color:#555;">${text}</blockquote>`;
  });

  // Convert headings
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:17px;font-weight:bold;margin-top:20px;margin-bottom:10px;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:19px;font-weight:bold;margin-top:24px;margin-bottom:12px;">$1</h2>');

  // Convert paragraphs (lines with content)
  html = html.replace(/^([^<\n].+)$/gm, (match) => {
    const trimmed = match.trim();
    if (!trimmed) return match;
    return `<p style="font-size:15px;line-height:1.8;color:#333;margin-bottom:14px;">${trimmed}</p>`;
  });

  // Clean up empty paragraphs
  html = html.replace(/<p style="[^"]*"><\/p>/g, '');

  // Wrap in section
  html = `<section data-style="default">${html}</section>`;

  return html;
}

main().catch((e) => {
  console.error('\n❌ 失败:', e.message);
  process.exit(1);
});
