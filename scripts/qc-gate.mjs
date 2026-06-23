#!/usr/bin/env node
/**
 * qc-gate.mjs — 统一质量门禁框架
 *
 * 自动检测产出类型并路由到对应检查模块:
 *   .md / .html  → 文章质量门禁
 *   .mp4          → 视频质量门禁
 *   .pptx         → PPT 基础检查
 *   .astro        → 页面结构检查
 *
 * 用法:
 *   node qc-gate.mjs <产出文件路径> [选项]
 *
 * 选项:
 *   --json         输出 JSON 报告
 *   --strict       所有检查必须通过（默认允许警告继续）
 *   -h, --help     显示帮助
 *
 * 集成:
 *   content-pipe.mjs 中各管线生成后自动调用
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { extname, resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ══════════════════════════════════════════════════════════
//  日志
// ══════════════════════════════════════════════════════════

function log(emoji, msg) { console.log(`  ${emoji} ${msg}`); }

// ══════════════════════════════════════════════════════════
//  类型检测 & 路由
// ══════════════════════════════════════════════════════════

function detectType(filePath) {
  const ext = extname(filePath).toLowerCase();
  const name = filePath.toLowerCase();
  if (ext === '.md') return 'article';
  if (ext === '.html') return 'article';
  if (ext === '.mp4') return 'video';
  if (ext === '.pptx') return 'ppt';
  if (ext === '.astro') return 'astro';
  if (name.endsWith('.bundle.json')) return 'bundle';
  return 'unknown';
}

// ══════════════════════════════════════════════════════════
//  通用检查项
// ══════════════════════════════════════════════════════════

/** 文件存在且非空 */
function checkFileExists(filePath) {
  const s = statSync(filePath, { throwIfNoEntry: false });
  if (!s) return { pass: false, detail: '文件不存在' };
  if (s.size === 0) return { pass: false, detail: '文件为空' };
  return { pass: true, detail: `${(s.size / 1024).toFixed(0)} KB` };
}

/** 文件大小合理 */
function checkFileSize(filePath, minKB = 1, maxKB = 50000) {
  const s = statSync(filePath, { throwIfNoEntry: false });
  if (!s) return { pass: false, detail: '文件不存在' };
  const kb = s.size / 1024;
  if (kb < minKB) return { pass: false, detail: `文件过小: ${kb.toFixed(0)} KB` };
  if (kb > maxKB) return { pass: false, detail: `文件过大: ${kb.toFixed(0)} KB` };
  return { pass: true };
}

// ══════════════════════════════════════════════════════════
//  各类型门禁
// ══════════════════════════════════════════════════════════

async function checkArticle(filePath) {
  const checks = [];

  // 1. 文件存在性
  checks.push({ test: '文件存在', status: checkFileExists(filePath).pass ? '✅' : '❌', detail: checkFileExists(filePath).detail });

  // 2. 内容解析
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  // 标题
  const titleLine = lines.find(l => /^#\s+\S/.test(l));
  const title = titleLine ? titleLine.replace(/^#\s*/, '').trim() : '';
  checks.push({
    test: '标题长度',
    status: title.length >= 2 && title.length <= 64 ? '✅' : '❌',
    detail: title ? `${title.length}字` : '缺失',
  });

  // 摘要
  const digestLine = lines.find(l => /^>\s*\S/.test(l));
  const digest = digestLine ? digestLine.replace(/^>\s*/, '').trim() : '';
  checks.push({
    test: '摘要',
    status: digest.length >= 5 ? '✅' : '⚠️',
    detail: digest ? `${digest.length}字` : '无摘要',
  });

  // 正文长度
  const bodyText = lines.filter(l => !l.startsWith('#') && !l.startsWith('>') && l.trim()).join('').replace(/\s+/g, '');
  checks.push({
    test: '正文长度',
    status: bodyText.length >= 100 ? '✅' : '⚠️',
    detail: `${bodyText.length}字${bodyText.length < 100 ? '（建议≥100）' : ''}`,
  });

  // 配图
  const imgCount = (raw.match(/!\[.*?\]\(/g) || []).length;
  checks.push({
    test: '配图数量',
    status: imgCount > 0 ? '✅' : '⚠️',
    detail: `${imgCount} 张${imgCount === 0 ? '（建议≥1）' : ''}`,
  });

  // 公众号尾部模板（点赞/在看/转发 + 关注 + 免责声明）
  const hasFooter = /点赞|在看|转发|关注.*道雷|道雷说道|免责声明/.test(raw);
  checks.push({
    test: '公众号尾部模板',
    status: hasFooter ? '✅' : '⚠️',
    detail: hasFooter ? '已含尾部模板' : '缺失（建议添加点赞/关注/免责）',
  });

  // 免责声明关键词
  const hasDisclaimer = /免责|风险提示|不构成.*建议|仅供参考/.test(raw);
  checks.push({
    test: '免责声明',
    status: hasDisclaimer ? '✅' : '⚠️',
    detail: hasDisclaimer ? '有' : '缺失（投资类内容建议加）',
  });

  // 中文标点规范：检查是否有英文逗号/句号混在中文中
  const mixedPunct = (raw.match(/[\u4e00-\u9fff][,\.][\u4e00-\u9fff]/g) || []).length;
  checks.push({
    test: '标点规范',
    status: mixedPunct === 0 ? '✅' : '⚠️',
    detail: mixedPunct > 0 ? `${mixedPunct}处英文标点混入中文` : '通过',
  });

  // 空链接检查
  const emptyLinks = (raw.match(/\]\(\)/g) || []).length;
  checks.push({
    test: '空链接',
    status: emptyLinks === 0 ? '✅' : '❌',
    detail: emptyLinks > 0 ? `${emptyLinks}个空链接` : '无',
  });

  // 段落结构：小标题数量
  const subHeadings = (raw.match(/^##\s+/gm) || []).length;
  checks.push({
    test: '小标题数量',
    status: subHeadings >= 2 ? '✅' : subHeadings >= 1 ? '⚠️' : '❌',
    detail: `${subHeadings} 个${subHeadings < 2 ? '（建议≥2，增强可读性）' : ''}`,
  });

  return checks;
}

async function checkVideo(filePath) {
  const checks = [];

  // 1. 文件存在性
  checks.push({ test: '文件存在', status: checkFileExists(filePath).pass ? '✅' : '❌', detail: checkFileExists(filePath).detail });

  // 2. 文件大小
  checks.push({ test: '文件大小', status: checkFileSize(filePath, 100, 500000).pass ? '✅' : '⚠️', detail: checkFileSize(filePath, 100, 500000).detail || '' });

  // 3. 尝试用 ffprobe 检查视频
  try {
    const info = execSync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}" 2>/dev/null`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    const data = JSON.parse(info);

    // 时长
    const duration = parseFloat(data.format?.duration || 0);
    checks.push({
      test: '时长',
      status: duration >= 10 ? '✅' : '⚠️',
      detail: `${duration.toFixed(1)}s${duration < 10 ? '（过短）' : ''}`,
    });

    // 视频流
    const videoStream = data.streams?.find(s => s.codec_type === 'video');
    if (videoStream) {
      const { width, height } = videoStream;
      const isHD = width >= 720 && height >= 720;
      checks.push({
        test: '分辨率',
        status: isHD ? '✅' : '⚠️',
        detail: `${width}x${height}${isHD ? '' : '（建议≥720p）'}`,
      });
    }

    // 音频流
    const audioStream = data.streams?.find(s => s.codec_type === 'audio');
    checks.push({
      test: '音轨',
      status: audioStream ? '✅' : '⚠️',
      detail: audioStream ? `${audioStream.codec_name || '有'}` : '无音轨',
    });
  } catch {
    checks.push({ test: 'ffprobe 分析', status: '⚠️', detail: 'ffprobe 不可用或解析失败' });
  }

  return checks;
}

async function checkPPT(filePath) {
  const checks = [];

  checks.push({ test: '文件存在', status: checkFileExists(filePath).pass ? '✅' : '❌', detail: checkFileExists(filePath).detail });

  // 尝试用 python-pptx 检查幻灯片数量
  try {
    const info = execSync(
      `python3 -c "
from pptx import Presentation
prs = Presentation('${filePath}')
slides = len(prs.slides)
print(f'slides={slides}')
" 2>/dev/null`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    const slideMatch = info.match(/slides=(\d+)/);
    const slideCount = slideMatch ? parseInt(slideMatch[1]) : 0;
    checks.push({
      test: '幻灯片数量',
      status: slideCount > 0 ? '✅' : '⚠️',
      detail: `${slideCount} 页`,
    });
  } catch {
    checks.push({ test: 'PPT 解析', status: '⚠️', detail: 'python-pptx 不可用' });
  }

  return checks;
}

async function checkAstro(filePath) {
  const checks = [];

  checks.push({ test: '文件存在', status: checkFileExists(filePath).pass ? '✅' : '❌', detail: checkFileExists(filePath).detail });

  const raw = readFileSync(filePath, 'utf-8');

  // Frontmatter
  const hasFrontmatter = /^---\n[\s\S]*?\n---/.test(raw);
  checks.push({ test: 'Frontmatter', status: hasFrontmatter ? '✅' : '❌', detail: hasFrontmatter ? '有' : '缺失' });

  // Layout import
  const hasLayout = /import\s+\w+\s+from\s+['"]\.\.\/layouts\/\w+/.test(raw);
  checks.push({ test: 'Layout', status: hasLayout ? '✅' : '⚠️', detail: hasLayout ? '已导入' : '未找到 Layout 导入' });

  // 内容长度
  const htmlContent = raw.replace(/---[\s\S]*?---\n/, '').trim();
  checks.push({
    test: '内容长度',
    status: htmlContent.length > 100 ? '✅' : '❌',
    detail: `${htmlContent.length} 字符`,
  });

  return checks;
}

// ══════════════════════════════════════════════════════════
//  CLI
// ══════════════════════════════════════════════════════════

function printHelp() {
  console.log(`
qc-gate — 统一质量门禁框架

用法:
  node qc-gate.mjs <文件路径> [选项]

选项:
  --json     输出 JSON 报告
  --strict   所有检查必须通过

示例:
  node qc-gate.mjs article.md
  node qc-gate.mjs output.mp4 --json
  node qc-gate.mjs output.astro --strict
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const filePath = args.find(a => !a.startsWith('--'));
  const jsonMode = args.includes('--json');
  const strict = args.includes('--strict');

  if (!filePath || !existsSync(filePath)) {
    console.error('❌ 文件不存在或未指定');
    process.exit(1);
  }

  const type = detectType(filePath);
  let checks = [];
  switch (type) {
    case 'article': checks = await checkArticle(filePath); break;
    case 'video':   checks = await checkVideo(filePath); break;
    case 'ppt':     checks = await checkPPT(filePath); break;
    case 'astro':   checks = await checkAstro(filePath); break;
    default:
      checks = [{ test: '类型识别', status: '⚠️', detail: `无法识别: ${extname(filePath)}` }];
  }

  // JSON 模式：只输出 JSON 到 stdout，日志走 stderr
  if (jsonMode) {
    console.log(JSON.stringify({ file: filePath, type, checks }, null, 2));
    return;
  }

  console.log(`\n📋 QC 门禁 — ${type === 'unknown' ? '未知类型' : type.toUpperCase()}\n`);
  log('📄', filePath);
  console.log('');
  for (const c of checks) {
    const statusIcon = c.status === '✅' ? '✅' : c.status === '⚠️' ? '⚠️' : '❌';
    log(statusIcon, `${c.test}: ${c.detail || (c.status === '✅' ? '通过' : '失败')}`);
  }

  const passed = checks.filter(c => c.status === '✅').length;
  const warned = checks.filter(c => c.status === '⚠️').length;
  const failed = checks.filter(c => c.status === '❌').length;
  console.log(`\n  结果: ${passed}/${checks.length} 通过，${warned} 警告，${failed} 失败`);

  if (strict && failed > 0) process.exit(1);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
