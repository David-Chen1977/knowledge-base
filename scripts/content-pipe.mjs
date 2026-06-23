#!/usr/bin/env node
/**
 * content-pipe — 统一内容生产管线 CLI
 *
 * 用法:
 *   node content-pipe.mjs --topic "AI+能源高价值场景" [选项]
 *
 * 必填:
 *   --topic "..."        生产主题
 *
 * 选项:
 *   --types ppt,article,video,website  产出类型（默认 all）
 *   --preview             预览模式：输出 HTML/配置但不实际创建/发布
 *   --skip-research       跳过研究阶段（需已存在 research.md）
 *   --publish             发布到公众号（默认不发布）
 *   --skip-index          不写入知识库
 *   --batch-dir <path>    指定批次目录（默认自动生成）
 *   --dry-run             只打印将要执行的操作，不运行
 *   -h, --help            显示帮助
 *
 * 示例:
 *   node content-pipe.mjs --topic "双碳政策2026变局与产业重构"
 *   node content-pipe.mjs --topic "算电协同" --types ppt,article --preview
 *   node content-pipe.mjs --topic "新能源重卡投资机会" --publish
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync, statSync } from 'fs';
import { resolve, dirname, basename, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { resolveVideoQuality, buildHyperFramesArgs, TIERS } from './video-quality.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = __dirname;
const OUTPUT_DIR = join(DOCS, 'OpenCode生成文件');
const BATCH_ROOT = join(DOCS, '生产批次');
const WECHAT_PUBLISHER = join(DOCS, 'wechat-publisher');
const KNOWLEDGE_INDEX = join(DOCS, 'knowledge-index.mjs');
const PPT_PREFLIGHT = join(DOCS, 'ppt-preflight.py');
const GEN_PERSONAL_TEMPLATE = join(DOCS, 'gen_personal_template.py');
const AI_PPTX_PIPELINE = join(DOCS, 'ai_pptx_pipeline.py');
const VIDEO_HYPERFRAMES = join(DOCS, 'video-hyperframes.mjs');
const INGEST_SCRIPT = join(DOCS, 'ingest-research.mjs');
const RESEARCH_TO_BUNDLE = join(DOCS, 'research-to-bundle.mjs');
const MD_TO_ASTRO = join(DOCS, 'md-to-astro.mjs');
const PERSONAL_WEBSITE = join(DOCS, 'personal-website');

// ── 工具函数 ──

function log(emoji, msg) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`${ts} ${emoji} ${msg}`);
}

function die(msg, code = 1) {
  console.error(`\n❌ ${msg}`);
  process.exit(code);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function now() {
  return new Date().toISOString();
}

function runCmd(cmd, opts = {}) {
  const defaults = { cwd: DOCS, stdio: 'pipe', timeout: 300000, encoding: 'utf-8' };
  try {
    const out = execSync(cmd, { ...defaults, ...opts });
    return { ok: true, stdout: out?.toString?.() || '', stderr: '' };
  } catch (e) {
    return { ok: false, stdout: e.stdout?.toString() || '', stderr: e.stderr?.toString() || '', error: e.message };
  }
}

// Resolve workspace paths from publish.config (shared config)
let WS_SCRIPTS = join(__dirname);  // default: same directory
let SANJITAO_DIR = '/Users/Admin/三件套输出';  // fallback
try {
  const configPath = join(__dirname, '..', '..', '三件套输出', 'publish.config');
  const configContent = readFileSync(configPath, 'utf-8');
  const wsMatch = configContent.match(/^SCRIPTS_DIR="(.+)"/m);
  const sjMatch = configContent.match(/^SCRIPT_DIR_DEFAULT="(.+)"/m);
  if (wsMatch) WS_SCRIPTS = wsMatch[1];
  if (sjMatch) SANJITAO_DIR = sjMatch[1];
} catch {}
function findScript(name) {
  const primary = join(DOCS, name);
  if (existsSync(primary)) return primary;
  const ws = join(WS_SCRIPTS, name);
  if (existsSync(ws)) return ws;
  return primary;
}

// ── CLI 参数解析 ──

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    const help = `
content-pipe — 统一内容生产管线

用法:
  node content-pipe.mjs --topic "主题" [选项]

必填:
  --topic "..."        生产主题

选项:
  --types <list>       产出类型: ppt,article,video,website（默认 all，逗号分隔）
  --preview            预览模式（输出 HTML/配置，不实际创建）
  --skip-research      跳过研究阶段
  --publish            发布到公众号
  --template <name>    PPT 模版: personal（默认/Apple风格）或 huihong（汇竑红金）
  --skip-index         不写入知识库
  --batch-dir <path>   指定批次目录
  --ingest <path>      研报/文档消化入口（PDF/PPTX/DOCX/图片 → Markdown）
  --suggest            先展示选题建议（结合 topic-sense），支持 --topic 过滤
  --dry-run            只打印将要执行的操作，不运行
  --deploy-website     自动提交个人网站 .astro 页面到 Git（确认后手动 push）
  --video-quality <lvl> 视频质量等级: S/A/B/C（默认 A，详见 video-quality.mjs）
  --dashboard           运行后显示生产 Dashboard
  --pool                查看选题池到期选题（不生产）
  --pool-produce        消费选题池所有到期选题并自动展示 Dashboard
  -h, --help           显示帮助

示例:
  node content-pipe.mjs --topic "双碳政策2026变局与产业重构"
  node content-pipe.mjs --topic "算电协同" --types ppt,article --preview
  node content-pipe.mjs --topic "新能源重卡投资机会" --publish
  node content-pipe.mjs --topic "投资专栏第三篇" --template huihong
  node content-pipe.mjs --topic "电力现货市场" --ingest ~/Downloads/研报.pdf
  node content-pipe.mjs --suggest             # 只看选题建议
  node content-pipe.mjs --suggest --preview    # 选题建议后预览产出
  node content-pipe.mjs --pool                 # 查看选题池到期选题
  node content-pipe.mjs --pool-produce         # 批量生产所有到期选题
`;
    console.log(help);
    process.exit(0);
  }

  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
  };

  const topic = get('--topic');
  const bundlePath = get('--bundle');
  const suggestMode = args.includes('--suggest');
  const poolMode = args.includes('--pool');
  const poolProduce = args.includes('--pool-produce');
  if (!topic && !bundlePath && !suggestMode && !poolMode && !poolProduce) die('必须指定 --topic "生产主题" 或 --bundle <bundle.json>（或 --suggest / --pool / --pool-produce）');

  const typesStr = get('--types') || 'all';
  const types = typesStr === 'all'
    ? ['ppt', 'article', 'video', 'website']
    : typesStr.split(',').map(s => s.trim());

  const preview = args.includes('--preview');
  const skipResearch = args.includes('--skip-research');
  const publish = args.includes('--publish');
  const skipIndex = args.includes('--skip-index');
  const dryRun = args.includes('--dry-run');
  const batchDir = get('--batch-dir');
  const template = get('--template') || 'personal';
  const ingest = get('--ingest');
  const deployWebsite = args.includes('--deploy-website');
  const videoQuality = get('--video-quality') || 'A';
  const showDashboard = args.includes('--dashboard');

  return { topic, bundlePath, types, preview, skipResearch, publish, skipIndex, dryRun, batchDir, template, ingest, suggestMode, deployWebsite, videoQuality, showDashboard, poolMode, poolProduce };
}

// ── 批次目录管理 ──

function ensureBatchDir(topic, customDir) {
  if (customDir) {
    mkdirSync(customDir, { recursive: true });
    return customDir;
  }

  const date = today();
  const slug = slugify(topic);
  const dir = join(BATCH_ROOT, `${date}_${slug}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// ── 阶段: 研究 ──

const WEB_RESEARCH = join(DOCS, 'web-research.mjs');

function runResearch(topic, batchDir) {
  const outPath = join(batchDir, 'research.md');
  if (existsSync(outPath)) {
    log('📖', `研究已存在: ${outPath}，跳过`);
    return outPath;
  }

  log('🔬', `研究阶段: ${topic}`);

  // 优先: 检查是否有预填种子文件
  const seedPath = join(batchDir, 'research-seed.json');
  if (existsSync(seedPath) && existsSync(WEB_RESEARCH)) {
    log('📦', '发现研究种子文件，生成研究报告...');
    const r = runCmd(`node "${WEB_RESEARCH}" --seed "${seedPath}" --topic "${topic}" --output "${outPath}"`);
    if (r.ok) {
      log('✅', `研究报告已生成（种子数据）: ${outPath}`);
      return outPath;
    }
    log('⚠️', '种子文件处理失败，回退...');
  }

  // 次优先: 调用 web-research.mjs 自动模式（知识库+骨架）
  if (existsSync(WEB_RESEARCH)) {
    log('🌐', '调用 web-research.mjs 生成研究...');
    const r = runCmd(`node "${WEB_RESEARCH}" --topic "${topic}" --output "${outPath}"`);
    if (r.ok) {
      log('✅', `研究报告已生成: ${outPath}`);
      return outPath;
    }
    log('⚠️', 'web-research.mjs 失败，回退默认骨架');
  }

  // 兜底: 默认骨架（最简单模板）
  const research = `# 研究报告: ${topic}\n\n> 自动生成于 ${now()}\n\n## 行业背景\n\n${topic} 的背景分析。\n\n## 核心数据\n\n1. 关键数据点一\n2. 关键数据点二\n\n## 核心洞察\n\n- 待补充\n\n## 趋势判断\n\n- 趋势一\n- 趋势二\n`;
  writeFileSync(outPath, research, 'utf-8');
  log('✅', `研究报告已保存（骨架）: ${outPath}`);
  return outPath;
}

// ── 阶段: 内容包生成 ──

function generateContentBundle(topic, batchDir, types) {
  log('📦', `生成内容包 (${types.join(', ')})`);

  const bundleJsonPath = join(batchDir, `${slugify(topic)}.bundle.json`);

  // 1. 优先从现有 Bundle JSON 恢复
  if (existsSync(bundleJsonPath)) {
    log('📖', `内容包已存在: ${basename(bundleJsonPath)}，跳过`);
    const bundle = JSON.parse(readFileSync(bundleJsonPath, 'utf-8'));
    return { ...bundle, files: resolveBundleFiles(bundle, batchDir, types) };
  }

  // 2. 检查是否有 research.md，通过 research-to-bundle.mjs 生成
  const researchPath = join(batchDir, 'research.md');
  if (existsSync(RESEARCH_TO_BUNDLE) && existsSync(researchPath)) {
    log('🔄', '从研究结果转换内容包...');
    const r = runCmd(`node "${RESEARCH_TO_BUNDLE}" --topic "${topic}" --research "${researchPath}" --output "${bundleJsonPath}"`);
    if (r.ok && existsSync(bundleJsonPath)) {
      const bundle = JSON.parse(readFileSync(bundleJsonPath, 'utf-8'));
      log('✅', `Content Bundle 已生成: ${bundle.slug}.bundle.json`);
      return { ...bundle, files: resolveBundleFiles(bundle, batchDir, types) };
    }
    log('⚠️', 'research-to-bundle 失败，回退手动生成');
  }

  // 3. 回退：直接生成 Bundle JSON（不依赖 research-to-bundle）
  const timestamp = now();
  const slug = slugify(topic);
  const bundle = {
    version: 1,
    slug,
    title: topic,
    digest: `${topic} — 自动生成`,
    source: 'custom',
    topic,
    types,
    generatedAt: timestamp,
    outline: [],
    facts: [],
    content: `# ${topic}\n\n> 本文自动生成于 ${today()}\n\n## 正文\n\n${topic} 的详细分析...\n`,
    keywords: [topic],
    images: [
      { id: 'cover', prompt: `Professional photography ${topic}, cinematic, modern, high quality, wide angle, 4k`, url: '', alt: `${topic} 封面`, usage: 'cover' },
      { id: 'body_1', prompt: `Infographic illustration ${topic}, data visualization style, clean, modern`, url: '', alt: '', usage: 'body' },
      { id: 'body_2', prompt: `Abstract concept art ${topic}, business style, gradient, elegant`, url: '', alt: '', usage: 'body' },
      { id: 'body_3', prompt: `Future technology ${topic}, blue tone, wide angle, minimalist`, url: '', alt: '', usage: 'body' },
    ],
  };
  writeFileSync(bundleJsonPath, JSON.stringify(bundle, null, 2), 'utf-8');
  log('✅', `Content Bundle 已生成: ${bundle.slug}.bundle.json`);

  // 4. 生成各管线所需文件（从 Bundle 派生）
  const bundleWithFiles = { ...bundle, files: resolveBundleFiles(bundle, batchDir, types) };

  log('✅', `内容包就绪: ${Object.keys(bundleWithFiles.files).length} 个产出文件`);
  return bundleWithFiles;
}

function resolveBundleFiles(bundle, batchDir, types) {
  /* 从 Content Bundle 生成各管线所需的独立文件 */
  const files = { bundle: join(batchDir, `${bundle.slug}.bundle.json`) };

  if (types.includes('article')) {
    const mdPath = join(batchDir, 'article.md');
    if (!existsSync(mdPath)) {
      writeFileSync(mdPath, bundle.content, 'utf-8');
    }
    files.article = mdPath;
  }

  if (types.includes('website')) {
    const mdPath = join(batchDir, 'website.md');
    if (!existsSync(mdPath)) {
      writeFileSync(mdPath, `# ${bundle.title}\n\n> 网站发布版\n\n## 正文\n\n${bundle.content.replace(/^# .+\n/, '')}\n`, 'utf-8');
    }
    files.website = mdPath;
    // 同时生成 .astro 页面（调用 md-to-astro.mjs）
    if (existsSync(MD_TO_ASTRO)) {
      const bundlePath = join(dirname(mdPath), `${bundle.slug}.bundle.json`);
      const r = runCmd(`node "${MD_TO_ASTRO}" --bundle "${bundlePath}" --website-dir "${PERSONAL_WEBSITE}"`);
      if (r.ok) {
        files.websiteAstro = join(PERSONAL_WEBSITE, 'src', 'pages', 'blog', `${bundle.slug}.astro`);
        log('✅', `网站 .astro 页面已生成: ${bundle.slug}.astro`);
      } else {
        log('⚠️', `网站页面生成异常: ${r.stderr?.slice(0, 200)}`);
      }
    }
  }

  if (types.includes('ppt')) {
    const cfgPath = join(batchDir, 'ppt-config.json');
    if (!existsSync(cfgPath)) {
      const imagePrompts = bundle.images?.map(i => ({ id: i.id, prompt: i.prompt, usage: i.usage })) || [];
      const config = {
        topic: bundle.topic,
        output: join(OUTPUT_DIR, `${bundle.slug}.pptx`),
        images: [
          { id: 'cover', prompt: imagePrompts.find(p => p.usage === 'cover')?.prompt || `Professional business background related to ${bundle.topic}, dark blue gold tones, 16:9` },
          { id: 'section1', prompt: imagePrompts.find(p => p.id === 'body_1')?.prompt || `Abstract concept related to ${bundle.topic}, blue industrial style, 16:9` },
          { id: 'closing', prompt: `Elegant dark gradient, closing, 16:9` },
        ],
        slides: [
          { type: 'cover', image_id: 'cover', title: bundle.title, subtitle: '汇竑资本 · 研究出品' },
          { type: 'section', image_id: 'section1', num: 1, title: '核心分析', subtitle: bundle.topic },
          { type: 'closing', image_id: 'closing', main_text: '感谢观看', sub_text: '汇竑资本 · 共创绿色能源未来' },
        ],
      };
      writeFileSync(cfgPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    files.pptConfig = cfgPath;
  }

  if (types.includes('video')) {
    const scriptPath = join(batchDir, 'video-script.md');
    if (!existsSync(scriptPath)) {
      // 从 bundle 提取结构化内容
      const topic = bundle.title || bundle.topic || '';
      const outline = bundle.outline || [];
      const facts = bundle.facts || [];

      // 检测是否有种子数据（开场钩子/核心矛盾）
      const hasHook = outline.some(s => /钩子|开场/i.test(s));
      const hasConflict = outline.some(s => /矛盾|冲突|问题/i.test(s));
      const hasData = outline.some(s => /数据|数字|指标/i.test(s));

      // 分解事实: 带数字的用于 data 场景
      const dataFacts = facts.filter(f => /[\d,]+\.?\d*\s*(?:亿|万|千|%|B|M|K|x|倍|吨|GW)/.test(f.claim || f));
      const insightFacts = facts.filter(f => !/[\d,]+\.?\d*\s*(?:亿|万|千|%|B|M|K|x|倍|吨|GW)/.test(f.claim || f));

      // 时长估算: 每字约0.25秒，最少30秒，最多90秒
      const totalChars = (hasHook ? 20 : 0) + (hasConflict ? 40 : 0) + (dataFacts.length * 15) + (insightFacts.length * 20) + 20;
      const estimatedDuration = Math.max(30, Math.min(90, Math.round(totalChars * 0.25)));

      let script = `# 视频脚本: ${topic}\n\n**时长**: ${estimatedDuration}秒\n\n`;

      // ── 场景1: 开场钩子（3-5秒） ──
      if (hasHook) {
        const hookIdx = outline.findIndex(s => /钩子|开场/i.test(s));
        const hookText = facts[hookIdx]?.claim || `${topic}——这是一个你不能忽视的趋势。`;
        script += `## 钩子 — 5秒\n\n[口播] ${hookText}\n[特效] 大字标题弹出，数字放大闪烁\n\n`;
      } else {
        script += `## 钩子 — 5秒\n\n[口播] ${topic}——这是一个你不能忽视的趋势。\n[特效] 大字标题渐进\n\n`;
      }

      // ── 场景2: 核心矛盾/问题（10-15秒） ──
      if (hasConflict) {
        const conflictIdx = outline.findIndex(s => /矛盾|冲突|问题/i.test(s));
        const conflictText = facts[conflictIdx]?.claim || outline[conflictIdx] || '核心问题分析...';
        script += `## 冲突 — 12秒\n\n[口播] ${conflictText}\n[文字] ${conflictText.slice(0, 30)}\n[特效] 对比分栏或引用竖线\n\n`;
      } else {
        script += `## 冲突 — 10秒\n\n[口播] 当前${topic}面临的核心挑战正在改变行业格局。\n[文字] 核心挑战\n\n`;
      }

      // ── 场景3: 核心数据（15-20秒） ──
      if (dataFacts.length > 0) {
        const mainData = dataFacts.slice(0, 3);
        const dataText = mainData.map(d => d.claim || d).join('，');
        script += `## 数据 — 18秒\n\n[口播] ${dataText}\n[特效] 数字逐个放大展示\n`;
        // 把数字单独提出来用于 data-hero 展示
        const numbers = mainData.map(d => (d.claim || d).match(/[\d,]+\.?\d*\s*(?:亿|万|千|%|B|M|K|x|倍|吨|GW)?/)).filter(Boolean).slice(0, 2);
        if (numbers.length > 0) {
          script += `[B-Roll] 数据显示: ${numbers.map(n => n[0]).join(', ')}\n`;
        }
        script += '\n';
      } else {
        script += `## 数据 — 15秒\n\n[口播] ${topic}的最新数据表明，行业正经历结构性变化。\n[特效] 数据计数动画\n\n`;
      }

      // ── 场景4: 洞察/趋势（15-20秒） ──
      if (insightFacts.length > 0) {
        const insightText = insightFacts.slice(0, 2).map(d => d.claim || d).join('，');
        script += `## 洞察 — 15秒\n\n[口播] ${insightText}\n[文字] ${(insightFacts[0]?.claim || '').slice(0, 25)}\n[特效] 引用样式，左侧竖线\n\n`;
      } else {
        script += `## 洞察 — 12秒\n\n[口播] 这一趋势将对行业格局产生深远影响。\n\n`;
      }

      // ── 场景5: CTA 结尾（5-7秒） ──
      script += `## 结尾 — 5秒\n\n[口播] 关注我，获取更多深度研究。\n[特效] 品牌标识淡入\n`;

      writeFileSync(scriptPath, script, 'utf-8');
      log('🎬', `视频脚本已生成（${estimatedDuration}秒，${dataFacts.length}数据点）`);
    }
    files.videoScript = scriptPath;
  }

  return files;
}

// ── 阶段: 调用 PPT 生成 ──

function generatePPT(topic, batchDir, configPath, preview, template = 'personal') {
  log('🎨', `生成 PPT（模版: ${template}）...`);

  // 优先使用 bundle JSON（包含完整内容），其次 article.md
  const bundleJson = (() => {
    try {
      const dir = batchDir || configPath ? dirname(configPath) : batchDir;
      const files = readdirSync(batchDir).filter(f => f.endsWith('.bundle.json'));
      return files.length > 0 ? join(batchDir, files[0]) : null;
    } catch { return null; }
  })();
  const articlePath = join(batchDir, 'article.md');
  const pipeline = findScript('ppt_to_video.py');

  if (!existsSync(pipeline)) {
    log('⚠️', 'ppt_to_video.py 不存在，跳过 PPT');
    return null;
  }

  if (preview) { log('👁️', 'PPT 预览模式'); return articlePath; }

  const slug = slugify(topic);
  const out = join(OUTPUT_DIR, `${slug}.pptx`);
  let cmd;
  if (bundleJson) {
    cmd = `python3 "${pipeline}" --bundle "${bundleJson}" --slides-only`;
  } else if (existsSync(articlePath)) {
    cmd = `python3 "${pipeline}" --article "${articlePath}" --title "${topic}" --slides-only`;
  } else {
    log('⚠️', '无可用内容源（bundle/article），跳过 PPT');
    return null;
  }

  const r = runCmd(cmd);
  if (r.ok) {
    // ppt_to_video.py 输出在 OUTPUT_DIR，需要找到对应文件
    const candidates = readdirSync(OUTPUT_DIR).filter(f => f.includes(slug) && f.endsWith('.pptx'));
    const pptx = candidates.length > 0 ? join(OUTPUT_DIR, candidates[0]) : out;
    log('✅', `PPT 已生成: ${pptx}`);
    return pptx;
  }
  log('❌', `PPT 生成失败: ${r.stderr?.slice(0, 200) || r.error}`);
  return null;
}

// ── 阶段: 调用公众号文章生成 ──

function generateArticle(topic, batchDir, articlePath, preview, publish) {
  log('📝', '生成公众号文章...');

  if (!existsSync(articlePath)) {
    log('⚠️', `文章文件不存在: ${articlePath}，跳过`);
    return null;
  }

  const publisher = findScript('wechat_publisher.py');

  if (preview) {
    log('👁️', '文章预览模式');
    if (existsSync(publisher)) {
      const r = runCmd(`python3 "${publisher}" --md "${articlePath}" --preview`);
      log(r.ok ? '✅' : '⚠️', `文章预览: ${r.ok ? '已生成' : r.stderr?.slice(0, 100)}`);
    }
    return articlePath;
  }

  if (publish) {
    const publishSh = join(__dirname, '..', '..', '三件套输出', 'publish.sh');
    if (!existsSync(publishSh)) {
      log('⚠️', `publish.sh 不存在: ${publishSh}`);
      return null;
    }
    log('📤', '通过 publish.sh 发布到公众号...');
    const r = runCmd(`bash "${publishSh}" "${articlePath}" --wechat-only --dry-run`);
    log(r.ok ? '✅' : '❌', `Dry-run 检查: ${r.ok ? '通过' : r.stderr?.slice(0, 200)}`);
    if (r.ok) {
      const r2 = runCmd(`bash "${publishSh}" "${articlePath}" --wechat-only`);
      log(r2.ok ? '✅' : '❌', `公众号发布: ${r2.ok ? '草稿已创建' : r2.stderr?.slice(0, 200)}`);
      return r2.ok ? articlePath : null;
    }
    return null;
  }

  // 自动生成多平台适配版（非 preview 模式）
  if (!preview) {
    const adapter = findScript('article_adapt.py');
    if (existsSync(adapter)) {
      runCmd(`python3 "${adapter}" "${articlePath}" --platform all`);
    }
  }

  return articlePath;
}

// ── 阶段: 视频生成 ──

function generateVideo(topic, batchDir, scriptPath, preview, videoQuality = 'A') {
  log('🎬', `生成视频（质量等级: ${videoQuality}）...`);

  const pipeline = findScript('ppt_to_video.py');
  if (!existsSync(pipeline)) {
    log('⚠️', 'ppt_to_video.py 不存在，跳过视频');
    return null;
  }

  const bundleJson = (() => {
    try {
      const files = readdirSync(batchDir).filter(f => f.endsWith('.bundle.json'));
      return files.length > 0 ? join(batchDir, files[0]) : null;
    } catch { return null; }
  })();
  const articlePath = join(batchDir, 'article.md');

  if (preview) { log('👁️', '视频预览模式'); return articlePath; }

  let cmd;
  if (bundleJson) {
    cmd = `python3 "${pipeline}" --bundle "${bundleJson}"`;
  } else if (existsSync(articlePath)) {
    cmd = `python3 "${pipeline}" --article "${articlePath}" --title "${topic}"`;
  } else {
    log('⚠️', '无可用内容源，跳过视频');
    return null;
  }

  const r = runCmd(cmd, { timeout: 600000 });
  if (r.ok) {
    const slug = slugify(topic);
    const candidates = readdirSync(OUTPUT_DIR).filter(f => f.includes('翻页视频') && f.includes(slug) && f.endsWith('.mp4'));
    const mp4 = candidates.length > 0 ? join(OUTPUT_DIR, candidates[0]) : join(OUTPUT_DIR, `翻页视频_${slug}.mp4`);
    log('✅', `视频已生成: ${mp4}`);
    return mp4;
  }
  log('❌', `视频生成失败: ${r.stderr?.slice(0, 200) || r.error}`);
  return null;
}

function callMPTApi(topic, scriptPath) {
  try {
    const script = readFileSync(scriptPath, 'utf-8');
    // MPT API 端点
    const apiUrl = 'http://127.0.0.1:8080/api/v1/video';
    // 用 curl 调用（避免 Node fetch 复杂性）
    const result = runCmd(`curl -s -X POST "${apiUrl}" -H "Content-Type: application/json" -d '{
      "script": ${JSON.stringify(script)},
      "title": ${JSON.stringify(topic)},
      "size": "1080x1920",
      "subtitle_provider": "edge",
      "tts_provider": "edge"
    }'`, { timeout: 120000 });
    if (result.ok) {
      const data = JSON.parse(result.stdout);
      if (data?.id) {
        // MPT 返回 task id，需要轮询
        return { ok: true, path: `mpt:${data.id}`, taskId: data.id };
      }
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

function callHyperFrames(topic, scriptPath, batchDir, vq = null) {
  if (!existsSync(VIDEO_HYPERFRAMES)) {
    log('❌', `video-hyperframes.mjs 不存在: ${VIDEO_HYPERFRAMES}，无法生成视频`);
    return { ok: false };
  }

  // 应用质量等级参数
  const qualityArgs = vq ? buildHyperFramesArgs(vq) : '--quality standard --max-scenes 6';
  log('🎬', `调用 video-hyperframes.mjs（${qualityArgs}）...`);

  const outputDir = join(batchDir, 'hyperframes_output');
  mkdirSync(outputDir, { recursive: true });

  const result = runCmd(`node "${VIDEO_HYPERFRAMES}" --topic "${topic}" --script "${scriptPath}" --output "${outputDir}/output.mp4" ${qualityArgs}`);

  if (!result.ok) {
    log('❌', `HyperFrames 视频管线失败: ${result.stderr?.slice(0, 300) || result.error}`);
    log('📄', `stdout: ${result.stdout?.slice(-500)}`);
    return { ok: false, error: result.error };
  }

  const outputFile = join(outputDir, 'output.mp4');
  if (existsSync(outputFile)) {
    log('✅', `视频已生成: ${outputFile}`);
    return { ok: true, path: outputFile };
  }

  // fallback: 可能输出在 OpenCode生成文件
  const slug = slugify(topic);
  const fallbackPath = join(OUTPUT_DIR, `${slug}.mp4`);
  if (existsSync(fallbackPath)) {
    log('✅', `视频已生成: ${fallbackPath}`);
    return { ok: true, path: fallbackPath };
  }

  log('⚠️', '视频生成完成但未找到 MP4 文件，请检查输出目录');
  return { ok: true, path: outputDir };
}

// ── 阶段: 知识库索引 ──

function indexToKnowledge(bundle, batchDir) {
  if (!existsSync(KNOWLEDGE_INDEX)) {
    log('⚠️', `知识库索引脚本不存在: ${KNOWLEDGE_INDEX}，跳过`);
    return false;
  }

  log('📚', '写入知识库...');
  const result = runCmd(`node "${KNOWLEDGE_INDEX}" --topic "${bundle.topic}" --batch-dir "${batchDir}"`);
  log(result.ok ? '✅' : '⚠️', `知识库索引: ${result.ok ? '完成' : result.stderr?.slice(0, 100)}`);
  return result.ok;
}

// ── 阶段: 生产报告 ──

function generateReport(bundle, batchDir, results) {
  log('📊', '生成生产报告...');

  const report = `# 生产报告

**主题**: ${bundle.topic}
**时间**: ${now()}
**产出类型**: ${(bundle.types || []).join(', ') || '未指定'}
**状态**: ${results.ok ? '✅ 成功' : '⚠️ 部分完成'}

## 产出清单

| 类型 | 路径 | 状态 |
|------|------|------|
${Object.entries(results.files).map(([type, path]) => `| ${type} | ${path || '-'} | ${path ? '✅' : '❌'} |`).join('\n')}

## 耗时

- 总耗时: ${results.duration} 秒

## 下一步

${(bundle.types || []).includes('article') ? '- [ ] 检查公众号草稿\n' : ''}${(bundle.types || []).includes('ppt') ? '- [ ] 检查 PPT 输出\n' : ''}${(bundle.types || []).includes('video') ? '- [ ] 检查视频输出\n' : ''}${(bundle.types || []).includes('website') ? '- [ ] 检查 .astro 页面\n- [ ] 部署网站: cd personal-website && git push\n' : ''}
`;

  const reportPath = join(batchDir, 'report.md');
  writeFileSync(reportPath, report, 'utf-8');
  log('✅', `生产报告已保存: ${reportPath}`);
  return reportPath;
}

// ── 主流程 ──

async function main() {
  console.log('\n' + '='.repeat(56));
  console.log('  📦 content-pipe — 统一内容生产管线');
  console.log('='.repeat(56) + '\n');

  const { topic, bundlePath, types, preview, skipResearch, publish, skipIndex, dryRun, batchDir: customDir, template, ingest, suggestMode, deployWebsite, videoQuality, showDashboard, poolMode, poolProduce } = parseArgs();

  // ── 选题建议模式（双管道） ──
  if (suggestMode) {
    log('💡', '选题建议模式');
    console.log('\n' + '─'.repeat(40));
    console.log('  📡 【管道1】外部信号扫描');
    console.log('─'.repeat(40));

    // 管道1: 外部信号 → domain-watch
    const domainWatchScript = join(DOCS, 'domain-watch.mjs');
    if (existsSync(domainWatchScript)) {
      const signalResult = runCmd(`node "${domainWatchScript}" suggest`);
      if (signalResult.ok) {
        console.log(signalResult.stdout);
      } else {
        log('⚠️', `外部信号不可用: ${signalResult.stderr?.slice(0, 100)}`);
      }
    } else {
      log('ℹ️', 'domain-watch.mjs 未安装，跳过外部信号');
    }

    console.log('\n' + '─'.repeat(40));
    console.log('  📚 【管道2】知识库分析与选题');
    console.log('─'.repeat(40));

    // 管道2: 知识库缺口 → topic-sense
    const topicSenseScript = join(DOCS, 'topic-sense.mjs');
    if (existsSync(topicSenseScript)) {
      const result = runCmd(`node "${topicSenseScript}" suggest`);
      if (result.ok) {
        console.log(result.stdout);
      } else {
        log('⚠️', `选题感知不可用: ${result.stderr?.slice(0, 100)}`);
      }
    } else {
      log('⚠️', `topic-sense.mjs 不存在，跳过知识库分析`);
    }

    console.log('\n' + '─'.repeat(40));
    console.log('  🎯 下一步');
    console.log('─'.repeat(40));

    if (topic) {
      log('🎯', `基于选题继续生产: "${topic}"`);
    } else {
      log('💡', '选择一个主题后运行:');
      console.log(`   node content-pipe.mjs --topic "你的选题" [选项]\n`);
      return;
    }
  }

  // ── 选题池模式 ──
  const POOL_SCRIPT = join(__dirname, 'topic-pool.mjs');
  const DASHBOARD_SCRIPT = join(__dirname, 'pipeline-dashboard.mjs');

  if (poolMode) {
    if (!existsSync(POOL_SCRIPT)) die('topic-pool.mjs 不存在');
    log('📋', '选题池 — 到期选题');
    execSync(`node "${POOL_SCRIPT}" list --due`, { stdio: 'inherit' });
    console.log('\n💡 生产: content-pipe.mjs --pool-produce\n');
    return;
  }

  if (poolProduce) {
    if (!existsSync(POOL_SCRIPT)) die('topic-pool.mjs 不存在');
    log('🏭', '选题池生产 — 消费所有到期选题');
    execSync(`node "${POOL_SCRIPT}" produce --due`, { stdio: 'inherit', timeout: 600000 });
    // 生产完成后展示 Dashboard
    if (existsSync(DASHBOARD_SCRIPT)) {
      execSync(`node "${DASHBOARD_SCRIPT}" --html --open`, { stdio: 'inherit' });
    }
    return;
  }

  // ── Bundle 模式: 使用已有研究包 ──
  let effectiveTopic = topic;
  let effectiveBatchDir = null;
  if (bundlePath) {
    if (!existsSync(bundlePath)) die(`Bundle 文件不存在: ${bundlePath}`);
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf-8'));
    effectiveTopic = bundle.title || bundle.topic || topic || '未命名';
    log('📦', `Bundle 模式: ${effectiveTopic}`);

    // 就地使用 bundle 目录作为批次目录
    const bundleDir = dirname(resolve(bundlePath));
    effectiveBatchDir = bundleDir;
    // 确保 article.md 存在 — 按 topic 关键词匹配（文件名含中文）
    const articlePath = join(bundleDir, 'article.md');
    if (!existsSync(articlePath)) {
      let found = null;
      const outDir = SANJITAO_DIR;
      try {
        const files = readdirSync(outDir).filter(f => f.endsWith('公众号文章.md'));
        // 优先: topic 关键词 (去掉冒号后的副标题, 取前4字)
        const kw = effectiveTopic.replace(/[：:].*/, '').trim().slice(0, 4);
        found = files.find(f => f.includes(kw));
        // 备选: title 前4字
        if (!found) {
          const tkw = (bundle.title || '').replace(/[：:].*/, '').trim().slice(0, 4);
          found = files.find(f => f.includes(tkw));
        }
        // 最后: bundle 编号前缀
        if (!found) {
          const num = (basename(bundlePath).match(/bundle_(\d+)/) || [])[1];
          if (num) found = files.find(f => f.startsWith(`${num}_`));
        }
        found = found ? join(outDir, found) : null;
      } catch {}
      if (found) {
        cpSync(found, articlePath);
        log('📄', `copy 文章: ${basename(found)}`);
      } else {
        writeFileSync(articlePath, bundle.content || `# ${effectiveTopic}\n\n待撰写...`, 'utf-8');
      }
    }
  }

  log('🎯', `主题: "${effectiveTopic}"`);
  log('📋', `产出类型: ${types.join(', ')}`);
  log('📂', `预览模式: ${preview ? '是' : '否'}`);
  log('📤', `自动发布: ${publish ? '是' : '否'}`);
  log('🌐', `网站部署: ${deployWebsite ? '是' : '否'}`);
  log('🎨', `PPT 模版: ${template}`);
  log('🎬', `视频质量: ${videoQuality} 级（${TIERS[videoQuality]?.label?.split('—')[0]?.trim() || '标准'}）`);
  if (ingest) log('📥', `研报消化: ${ingest}`);
  if (dryRun) log('🏁', '干运行模式 — 仅打印计划\n');

  // 1. 创建批次目录
  const batchDir = effectiveBatchDir || ensureBatchDir(effectiveTopic, customDir);
  log('📁', `批次目录: ${batchDir}`);

  if (dryRun) {
    log('🏁', '干运行 — 以上为计划执行内容');
    console.log('\n', '='.repeat(56), '\n');
    return;
  }

  const startTime = Date.now();
  const results = { ok: true, files: {}, duration: 0, errors: [] };

  // 1.5 研报消化阶段
  if (ingest) {
    log('📥', `消化研报: ${ingest}`);
    const ingestOut = join(batchDir, '_ingested');
    if (!dryRun) {
      const r = runCmd(`node "${INGEST_SCRIPT}" --input "${ingest}" --output "${ingestOut}" --wiki`);
      if (r.ok) {
        log('✅', '研报消化完成');
        // 用第一个消化结果作为研究输入
        const ingestedFiles = ingestOut ? null : null; // will scan later
        try {
          const ingested = readdirSync(ingestOut).filter(f => f.endsWith('.md'));
          if (ingested.length > 0) {
            results.files.ingested = join(ingestOut, ingested[0]);
            log('📄', `研究基准: ${ingested[0]}`);
          }
        } catch {
          // ignore scan errors
        }
      } else {
        log('⚠', `研报消化失败: ${r.stderr?.slice(0, 200)}`);
      }
    }
  }

  // 2. 研究阶段（bundle 模式跳过）
  let researchPath = null;
  if (!skipResearch && !bundlePath) {
    researchPath = runResearch(effectiveTopic, batchDir);
  }

  // 3. 内容包（bundle 模式跳过）
  const bundle = bundlePath
    ? { ...JSON.parse(readFileSync(bundlePath, 'utf-8')), files: { article: join(batchDir, 'article.md') } }
    : generateContentBundle(effectiveTopic, batchDir, types);

  // 4. 并行产出阶段
  const pptTask = types.includes('ppt')
    ? generatePPT(effectiveTopic, batchDir, bundle.files.pptConfig, preview, template)
    : null;
  if (pptTask) results.files.ppt = pptTask;
  else if (types.includes('ppt')) results.errors.push('PPT 生成失败');

  const articleTask = types.includes('article')
    ? generateArticle(effectiveTopic, batchDir, bundle.files.article, preview, publish)
    : null;
  if (articleTask) results.files.article = articleTask;
  else if (types.includes('article')) results.errors.push('文章生成失败');

  const videoTask = types.includes('video')
    ? generateVideo(effectiveTopic, batchDir, bundle.files.videoScript, preview, videoQuality)
    : null;
  if (videoTask) results.files.video = videoTask;
  else if (types.includes('video')) results.errors.push('视频生成失败');

  if (types.includes('website')) {
    results.files.website = bundle.files.website;
    if (bundle.files.websiteAstro) results.files.websiteAstro = bundle.files.websiteAstro;
  }

  // 4.5 统一质量门禁（对所有已生成的产出文件）
  if (!preview && !dryRun) {
    const QC_GATE = join(DOCS, 'qc-gate.mjs');
    if (existsSync(QC_GATE)) {
      for (const [outputType, filePath] of Object.entries(results.files)) {
        if (!filePath || typeof filePath !== 'string' || !existsSync(filePath)) continue;
        if (outputType === 'bundle' || outputType === 'pptConfig') continue; // 跳过中间文件
        log('🔍', `QC 门禁 — ${outputType}: ${basename(filePath)}`);
        runCmd(`node "${QC_GATE}" "${filePath}"`);
        console.log('');
      }
    }
  }

  // 5. 生产报告
  results.duration = Math.round((Date.now() - startTime) / 1000);
  const reportPath = generateReport(bundle, batchDir, results);

  // 6. 知识库索引
  if (!skipIndex && !preview) {
    indexToKnowledge(bundle, batchDir);
    // 7. Wiki 概念编译
    const wikiScript = join(DOCS, 'wiki-update.mjs');
    const sourceCandidates = [bundle.files.article, bundle.files.wechat, bundle.files.videoScript].filter(Boolean);
    if (existsSync(wikiScript) && sourceCandidates.length > 0) {
      log('📖', '编译 Wiki 概念页...');
      runCmd(`node "${wikiScript}" --topic "${bundle.topic}" --source "${sourceCandidates[0]}" --type article`);
    }
  }

  // 8. 自动提交个人网站（--deploy-website）
  if (deployWebsite && types.includes('website') && bundle.files.websiteAstro) {
    log('🌐', '提交个人网站变更到 Git...');
    const r = runCmd(`git add src/pages/blog src/pages/blog.astro && git commit -m "feat(blog): 新增文章 — ${bundle.topic}"`, { cwd: PERSONAL_WEBSITE });
    if (r.ok) {
      log('✅', 'Git 提交成功');
      log('ℹ️', `推送需手动执行: cd personal-website && git push`);
    } else {
      log('⚠️', `Git 提交异常: ${r.stderr?.slice(0, 100) || '无变更'}`);
    }
  }

  results.ok = results.errors.length === 0;

  // ── 完成 ──
  console.log('\n' + '='.repeat(56));
  if (results.ok) {
    log('🎉', `管线执行完成！耗时 ${results.duration}s`);
  } else {
    log('⚠️', `管线执行完成（${results.errors.length} 个错误）`);
    results.errors.forEach(e => log('  ❌', e));
  }
  log('📁', `批次目录: ${batchDir}`);
  console.log('='.repeat(56) + '\n');

  // 9. 可选显示 Dashboard
  if (showDashboard && existsSync(DASHBOARD_SCRIPT)) {
    log('📊', '打开生产 Dashboard...');
    runCmd(`node "${DASHBOARD_SCRIPT}" --html --open`);
  }
}

main().catch(e => die(e.message));
