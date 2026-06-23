#!/usr/bin/env node
/**
 * content-to-deck.mjs — Bridge between content-pipe and native_pptx.py
 *
 * Translates bundle.json + optional ppt-config.json → deck.json → native_pptx.py
 * Supports nmg (navy/gold/red), personal (clean), huihong (red/gold) themes.
 *
 * Usage:
 *   node content-to-deck.mjs --bundle <bundle.json> [--theme nmg] [--output out.pptx]
 *   node content-to-deck.mjs --topic "主题" --article article.md [--theme nmg]
 *   node content-to-deck.mjs --deck-only ...   # only generate deck.json, skip PPTX
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, basename, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Paths ──
const SKILL_SCRIPTS = '/Users/Admin/.opencode/skills/nmg-ppt/scripts';
const NATIVE_PPTX = join(SKILL_SCRIPTS, 'native_pptx.py');
const PPTX_VENV = '/tmp/pptx-venv/bin/python3';
const SANJITAO_DIR = '/Users/Admin/三件套输出';
const BATCH_ROOT = join(__dirname, '生产批次');

// ── Theme definitions ──
const THEMES = {
  nmg: {
    name: '内蒙古新质动能',
    bg_cover: '#101828',
    bg_content: '#364153',
    bg_light: '#F9FAFB',
    bg_white: '#FFFFFF',
    accent_red: '#C00000',
    accent_darkred: '#8B0000',
    gold: '#B89A6A',
    gold_light: '#D4AF37',
    text_white: '#FFFFFF',
    text_main: '#2C2C2C',
    text_secondary: '#595959',
    text_muted: '#94A3B8',
    divider: '#E5E7EB',
    font: 'Microsoft YaHei',
    font_en: 'Franklin Gothic Medium',
  },
  personal: {
    name: '个人简约',
    bg_cover: '#1a1a2e',
    bg_content: '#FFFFFF',
    bg_light: '#F8F9FA',
    bg_white: '#FFFFFF',
    accent_red: '#E74C3C',
    accent_darkred: '#C0392B',
    gold: '#2C3E50',
    gold_light: '#3498DB',
    text_white: '#FFFFFF',
    text_main: '#2C3E50',
    text_secondary: '#7F8C8D',
    text_muted: '#BDC3C7',
    divider: '#ECF0F1',
    font: 'Microsoft YaHei',
    font_en: 'Helvetica Neue',
  },
  huihong: {
    name: '汇竑资本',
    bg_cover: '#8B0000',
    bg_content: '#FFFFFF',
    bg_light: '#FFF5F5',
    bg_white: '#FFFFFF',
    accent_red: '#C00000',
    accent_darkred: '#8B0000',
    gold: '#D4AF37',
    gold_light: '#F0D060',
    text_white: '#FFFFFF',
    text_main: '#2C2C2C',
    text_secondary: '#595959',
    text_muted: '#999999',
    divider: '#E5E7EB',
    font: 'Microsoft YaHei',
    font_en: 'Times New Roman',
  },
};

// ── UI ──
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

// ── Parse content for slides ──
function extractSections(content, outline) {
  // If outline exists, use it as section titles
  if (outline && outline.length > 0) {
    return outline.map(item => {
      if (typeof item === 'string') return { title: item, body: '' };
      return { title: item.title || item.section || '', body: item.summary || item.content || '' };
    });
  }
  // Fallback: parse markdown for ## headings
  const sections = [];
  const lines = (content || '').split('\n');
  let currentTitle = '核心内容';
  let currentBody = [];
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      if (currentBody.length > 0) {
        sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
      }
      currentTitle = h2[1];
      currentBody = [];
    } else if (!line.startsWith('# ')) {
      currentBody.push(line);
    }
  }
  if (currentBody.length > 0) {
    sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
  }
  if (sections.length === 0) {
    sections.push({ title: '概述', body: content?.slice(0, 500) || '' });
  }
  return sections;
}

function extractFacts(facts) {
  if (!facts || facts.length === 0) return [];
  return facts.map(f => {
    if (typeof f === 'string') return f;
    return f.claim || f.text || '';
  }).filter(Boolean);
}

// ── Build deck.json slides ──
function buildDeck(topic, sections, facts, themeId, mode = 'standard') {
  const theme = THEMES[themeId] || THEMES.nmg;
  const slides = [];

  // --- Slide 1: Cover ---
  slides.push({
    background: theme.bg_cover,
    shapes: [
      { type: 'rect', x: 0, y: 0, w: 13.33, h: 7.5, fill: theme.bg_cover },
      { type: 'rect', x: 0.6, y: 6.8, w: 3.0, h: 0.06, fill: theme.gold },
      { type: 'rect', x: 0.6, y: 6.2, w: 0.08, h: 0.5, fill: theme.accent_red },
    ],
    texts: [
      { text: topic, x: 0.8, y: 2.5, w: 11.0, h: 2.0, fontSize: 40, bold: true, color: theme.gold, align: 'left', font: theme.font },
      { text: '汇竑资本 · 研究出品', x: 0.8, y: 4.6, w: 8.0, h: 0.6, fontSize: 18, bold: false, color: theme.text_muted, align: 'left', font: theme.font },
      { text: new Date().toISOString().slice(0, 10), x: 0.8, y: 5.2, w: 4.0, h: 0.5, fontSize: 14, bold: false, color: theme.text_muted, align: 'left', font: theme.font },
    ],
  });

  // If no sections extracted, add a simple content slide
  if (sections.length === 0) {
    sections.push({ title: '概述', body: topic });
  }

  // --- Slide 2: Outline (if multiple sections) ---
  if (sections.length > 1) {
    const outlineText = sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
    slides.push({
      background: theme.bg_content,
      shapes: [
        { type: 'rect', x: 0, y: 0, w: 13.33, h: 7.5, fill: theme.bg_content },
        { type: 'rect', x: 0, y: 0, w: 0.15, h: 7.5, fill: theme.accent_red },
      ],
      texts: [
        { text: '目 录', x: 1.0, y: 0.6, w: 5.0, h: 0.9, fontSize: 32, bold: true, color: theme.gold, align: 'left', font: theme.font },
        { text: outlineText, x: 1.0, y: 1.8, w: 10.0, h: 4.5, fontSize: 20, bold: false, color: theme.text_white, align: 'left', font: theme.font },
      ],
    });
  }

  // --- Content slides (3-5) ---
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const bodyText = sec.body?.slice(0, 600) || '';
    // Split body into bullet points if it has newlines
    const bulletLines = bodyText.split('\n').filter(l => l.trim()).slice(0, 6);
    const formattedBody = bulletLines.map(l => {
      const clean = l.replace(/^[-*•]\s*/, '').trim();
      return clean ? `• ${clean}` : '';
    }).filter(Boolean).join('\n');

    slides.push({
      background: i % 2 === 0 ? theme.bg_content : theme.bg_cover,
      shapes: [
        { type: 'rect', x: 0, y: 0, w: 13.33, h: 7.5, fill: i % 2 === 0 ? theme.bg_content : theme.bg_cover },
        { type: 'rect', x: 0.6, y: 0.8, w: 0.08, h: 0.5, fill: theme.gold },
      ],
      texts: [
        { text: `${sec.title}`, x: 1.0, y: 0.6, w: 10.0, h: 0.9, fontSize: 28, bold: true, color: theme.gold, align: 'left', font: theme.font },
        { text: formattedBody || '（待补充详细内容）', x: 1.0, y: 1.8, w: 11.0, h: 4.5, fontSize: 18, bold: false, color: theme.text_white, align: 'left', font: theme.font },
      ],
    });
  }

  // --- Facts/Data slide (if available) ---
  if (facts.length > 0) {
    const factText = facts.slice(0, 4).map((f, i) => `📊 ${f}`).join('\n\n');
    slides.push({
      background: theme.bg_content,
      shapes: [
        { type: 'rect', x: 0, y: 0, w: 13.33, h: 7.5, fill: theme.bg_content },
        { type: 'rect', x: 0.6, y: 0.8, w: 0.08, h: 0.5, fill: theme.accent_red },
        { type: 'rounded_rect', x: 0.8, y: 1.8, w: 11.5, h: 4.8, fill: '#2C3E50', radius: 0.02 },
      ],
      texts: [
        { text: '关键数据', x: 1.0, y: 0.6, w: 5.0, h: 0.9, fontSize: 28, bold: true, color: theme.gold, align: 'left', font: theme.font },
        { text: factText, x: 1.2, y: 2.2, w: 10.8, h: 4.2, fontSize: 18, bold: false, color: theme.text_white, align: 'left', font: theme.font },
      ],
    });
  }

  // --- Closing Slide ---
  slides.push({
    background: theme.bg_cover,
    shapes: [
      { type: 'rect', x: 0, y: 0, w: 13.33, h: 7.5, fill: theme.bg_cover },
      { type: 'rect', x: 4.67, y: 4.2, w: 4.0, h: 0.04, fill: theme.gold },
    ],
    texts: [
      { text: '感谢观看', x: 1.5, y: 2.5, w: 10.0, h: 1.5, fontSize: 36, bold: true, color: theme.gold, align: 'center', font: theme.font },
      { text: '汇竑资本 · 共创绿色能源未来', x: 1.5, y: 4.5, w: 10.0, h: 0.8, fontSize: 18, bold: false, color: theme.text_muted, align: 'center', font: theme.font },
    ],
  });

  return {
    title: topic,
    theme: themeId,
    slides,
  };
}

// ── Main ──
function main() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
content-to-deck.mjs — Bridge: content-pipe → native_pptx.py

Usage:
  node content-to-deck.mjs --bundle <bundle.json> [options]
  node content-to-deck.mjs --topic "主题" --article article.md [options]

Options:
  --bundle <path>     bundle.json from content-pipe
  --config <path>     ppt-config.json (optional, overrides bundle)
  --topic <text>      Topic/title for the PPT
  --article <path>    Article markdown path (content source)
  --theme <name>      Theme: nmg (default), personal, huihong
  --output <path>     Output .pptx path (default: auto from topic)
  --deck-only         Only generate deck.json, skip PPTX generation
  --preview           Generate preview PNGs alongside PPTX
  -h, --help          Show this help
`);
    process.exit(0);
  }

  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
  };

  const bundlePath = get('--bundle');
  const configPath = get('--config');
  const topicOverride = get('--topic');
  const articlePath = get('--article');
  const themeId = get('--theme') || 'nmg';
  const outputPath = get('--output');
  const deckOnly = args.includes('--deck-only');
  const preview = args.includes('--preview');

  if (!THEMES[themeId]) {
    die(`Unknown theme: ${themeId}. Available: ${Object.keys(THEMES).join(', ')}`);
  }

  // ── Gather input data ──
  let topic = topicOverride || '';
  let content = '';
  let outline = [];
  let facts = [];

  // 1. Try bundle.json
  if (bundlePath && existsSync(bundlePath)) {
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf-8'));
    topic = topic || bundle.title || bundle.topic || '';
    content = bundle.content || '';
    outline = bundle.outline || [];
    facts = bundle.facts || [];
    log('📦', `Loaded bundle: ${bundle.slug || topic}`);
  }

  // 2. Try article.md (overrides content from bundle)
  if (articlePath && existsSync(articlePath)) {
    content = readFileSync(articlePath, 'utf-8');
    log('📄', `Loaded article: ${basename(articlePath)}`);
  } else if (!bundlePath) {
    // Fallback: try to find article.md alongside
    const cwd = process.cwd();
    const fallbackArticle = join(cwd, 'article.md');
    if (existsSync(fallbackArticle)) {
      content = readFileSync(fallbackArticle, 'utf-8');
      log('📄', `Loaded article (cwd): article.md`);
    }
  }

  // 3. Try ppt-config.json (may override theme)
  if (configPath && existsSync(configPath)) {
    const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
    // Config gives slide structure hints, but we use our own generation
    log('⚙️', `Loaded ppt-config`);
  } else if (!bundlePath && !configPath && !articlePath && !topicOverride) {
    // Try to find files in batch dir
    const batchDirs = [];
    try {
      if (existsSync(BATCH_ROOT)) {
        batchDirs.push(...readdirSync(BATCH_ROOT).map(d => join(BATCH_ROOT, d)));
      }
    } catch {}
    for (const dir of batchDirs) {
      const b = readdirSync(dir).find(f => f.endsWith('.bundle.json'));
      const a = readdirSync(dir).find(f => f === 'article.md');
      if (b) {
        const bundle = JSON.parse(readFileSync(join(dir, b), 'utf-8'));
        topic = topic || bundle.title || bundle.topic || '';
        content = bundle.content || '';
        outline = bundle.outline || [];
        facts = bundle.facts || [];
        log('📦', `Auto-discovered bundle: ${bundle.slug || topic}`);
        break;
      }
      if (a && !content) {
        content = readFileSync(join(dir, a), 'utf-8');
      }
    }
  }

  if (!topic && content) {
    // Extract title from markdown
    const h1 = content.match(/^#\s+(.+)/m);
    topic = h1 ? h1[1].trim() : '未命名主题';
  }
  if (!topic) die('No topic specified. Use --topic or --bundle.');

  // ── Generate deck ──
  log('🎨', `Generating deck for "${topic}" (theme: ${themeId})`);
  const sections = extractSections(content, outline);
  const extractedFacts = facts.length > 0 ? facts : extractFacts(sections);
  const deck = buildDeck(topic, sections, extractedFacts, themeId);

  // Ensure output dir exists
  const outputDeckPath = join(process.cwd(), `${slugify(topic)}.deck.json`);
  writeFileSync(outputDeckPath, JSON.stringify(deck, null, 2), 'utf-8');
  log('✅', `deck.json: ${outputDeckPath}`);

  if (deckOnly) {
    console.log(`\n📋 Deck saved. ${deck.slides.length} slides.`);
    return;
  }

  // ── Call native_pptx.py ──
  const outputPptx = outputPath || join(SANJITAO_DIR, `${slugify(topic)}_PPT.pptx`);
  const outputDir = dirname(outputPptx);
  mkdirSync(outputDir, { recursive: true });

  if (!existsSync(NATIVE_PPTX)) {
    log('❌', `native_pptx.py not found: ${NATIVE_PPTX}`);
    log('💡', 'Install nmg-ppt skill or copy scripts to skill directory');
    console.log(`\n📋 Deck only: ${outputDeckPath}`);
    return;
  }

  const python = existsSync(PPTX_VENV) ? PPTX_VENV : 'python3';
  // Check if python-pptx is actually available
  let pythonOk = false;
  try {
    const check = execSync(`${python} -c "import pptx; print(pptx.__version__)"`, { encoding: 'utf-8', timeout: 5000 });
    pythonOk = true;
    log('🐍', `python-pptx ${check.trim()} available`);
  } catch {
    log('⚠️', 'python-pptx not available in main python, trying venv...');
  }
  if (!pythonOk) {
    // Try backup python paths
    for (const py of ['/tmp/pptx-venv/bin/python3', '/usr/local/bin/python3', '/opt/homebrew/bin/python3']) {
      if (existsSync(py)) {
        try {
          execSync(`${py} -c "import pptx"`, { encoding: 'utf-8', timeout: 5000 });
          const pythonFinal = py;
          log('🐍', `Using python: ${pythonFinal}`);
          break;
        } catch {}
      }
    }
  }

  const previewArg = preview ? '--preview' : '';
  const previewDir = preview ? `--preview-dir ${join(dirname(outputPptx), 'preview')}` : '';
  const cmd = `${python} "${NATIVE_PPTX}" "${outputDeckPath}" "${outputPptx}" ${previewArg} ${previewDir}`.trim();

  log('🔄', `Running native_pptx.py...`);
  log('💻', `  ${cmd}`);

  try {
    const result = execSync(cmd, { encoding: 'utf-8', timeout: 120000 });
    console.log(result.trim());
    log('✅', `PPT generated: ${outputPptx}`);
  } catch (e) {
    log('❌', `native_pptx.py failed: ${e.stderr?.slice(0, 500) || e.message}`);
    console.log(`\n📋 Deck saved (PPT generation failed): ${outputDeckPath}`);
    process.exit(1);
  }
}

main();
