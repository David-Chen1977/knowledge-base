#!/usr/bin/env node
/**
 * ingest-research.mjs — 研报自动消化入口 v1
 *
 * 将 PDF/DOCX/PPTX/XLSX/图片等消化为 Markdown，自动提取知识
 *
 * 引擎：
 *   默认 engine: MarkItDown（本地 python，无 GPU 要求）
 *   可配置 engine: DeepSeek-OCR（需 GPU + CUDA，markdown 模式下自动启动）
 *
 * 用法:
 *   node ingest-research.mjs --input <文件或目录> [选项]
 *
 * 选项:
 *   --output <dir>   输出目录（默认 ~/Documents/Knowledge/_vault/99-Inbox/）
 *   --wiki           自动更新知识库 wiki（调用 wiki-update.mjs）
 *   --recursive      递归处理子目录
 *   --engine <name>  引擎: markitdown（默认）| deepseek-ocr
 *   --dry-run        仅预览不执行
 *   -h, --help       显示帮助
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, basename, extname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = __dirname;
const VAULT = join(DOCS, 'Knowledge/_vault');
const DEFAULT_OUT = join(VAULT, '99-Inbox');
const MD_VENV_PYTHON = '/tmp/md-venv/bin/python3';

const ALLOWED = {
  '.pdf': 'PDF',
  '.docx': 'DOCX',
  '.pptx': 'PPTX',
  '.xlsx': 'XLSX',
  '.xls': 'XLS',
  '.png': 'Image',
  '.jpg': 'Image',
  '.jpeg': 'Image',
  '.bmp': 'Image',
  '.tiff': 'Image',
  '.mp3': 'Audio',
  '.wav': 'Audio',
  '.m4a': 'Audio',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.csv': 'CSV',
  '.json': 'JSON',
  '.xml': 'XML',
};

function log(emoji, msg) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`${ts} ${emoji} ${msg}`);
}

function die(msg, code = 1) {
  console.error(`\n❌ ${msg}`);
  process.exit(code);
}

function showHelp() {
  console.log(`
用法: node ingest-research.mjs --input <文件或目录> [选项]

将 PDF/PPTX/DOCX/图片等消化为 Markdown，自动提取知识。

必填:
  --input <path>     输入文件或目录

选项:
  --output <dir>     输出目录（默认 ${DEFAULT_OUT}）
  --wiki             自动更新知识库 wiki
  --recursive        递归处理子目录
  --engine <name>    引擎: markitdown（默认）| deepseek-ocr
  --dry-run          仅预览不执行
  -h, --help         显示帮助

示例:
  node ingest-research.mjs --input ~/Downloads/研报.pdf --wiki
  node ingest-research.mjs --input ~/Downloads/行业资料/ --recursive --engine deepseek-ocr
`);
  process.exit(0);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  文件扫描
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function scanFiles(inputPath, recursive) {
  const files = [];
  const st = statSync(inputPath);
  if (st.isFile()) {
    const ext = extname(inputPath).toLowerCase();
    if (ALLOWED[ext]) files.push(inputPath);
    else console.warn(`⚠ 跳过不支持格式: ${inputPath}`);
    return files;
  }
  if (st.isDirectory()) {
    const entries = readdirSync(inputPath);
    for (const e of entries) {
      const full = join(inputPath, e);
      const st2 = statSync(full);
      if (st2.isDirectory()) {
        if (recursive) files.push(...scanFiles(full, true));
      } else {
        const ext = extname(full).toLowerCase();
        if (ALLOWED[ext]) files.push(full);
      }
    }
  }
  return files;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  引擎：MarkItDown
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function convertMarkItDown(filePath) {
  const absPath = resolve(filePath);
  const cmd = `echo ${JSON.stringify(absPath)} | ${MD_VENV_PYTHON} -c "
import sys, json
from markitdown import MarkItDown
path = sys.stdin.read().strip()
md = MarkItDown()
result = md.convert(path)
print(result.text_content)
"`;
  try {
    const out = execSync(cmd, { encoding: 'utf-8', timeout: 120000 });
    return out.trim();
  } catch (e) {
    throw new Error(`MarkItDown 转换失败: ${e.message}`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  引擎：DeepSeek-OCR（GPU 模式）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function checkDeepSeekAvailable() {
  try {
    const out = execSync(
      `${MD_VENV_PYTHON} -c "import torch; print(torch.cuda.is_available())"`,
      { encoding: 'utf-8', timeout: 10000 },
    );
    return out.trim() === 'True';
  } catch {
    return false;
  }
}

function convertDeepSeekOCR(filePath) {
  const absPath = resolve(filePath);
  const ext = extname(absPath).toLowerCase();
  const isImage = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff'].includes(ext);
  const isPDF = ext === '.pdf';

  if (!isImage && !isPDF) {
    log('⚠', `DeepSeek-OCR 仅支持图片/PDF，${basename(filePath)} 降级到 MarkItDown`);
    return convertMarkItDown(filePath);
  }

  // 检查 deepseek-ocr 模型目录
  const modelDir = join(DOCS, 'models/DeepSeek-OCR');
  if (!existsSync(modelDir)) {
    log('⚠', 'DeepSeek-OCR 模型未下载，降级到 MarkItDown');
    log('💡', `如需启用: git clone https://github.com/deepseek-ai/DeepSeek-OCR.git ${modelDir}`);
    return convertMarkItDown(filePath);
  }

  const script = isImage ? 'run_dpsk_ocr_image.py' : 'run_dpsk_ocr_pdf.py';
  const scriptPath = join(modelDir, 'DeepSeek-OCR-master', 'DeepSeek-OCR-vllm', script);

  if (!existsSync(scriptPath)) {
    log('⚠', `DeepSeek-OCR 脚本未找到: ${scriptPath}，降级到 MarkItDown`);
    return convertMarkItDown(filePath);
  }

  try {
    const out = execSync(
      `cd ${dirname(scriptPath)} && python ${scriptPath} --input ${JSON.stringify(absPath)}`,
      { encoding: 'utf-8', timeout: 300000 },
    );
    return out.trim();
  } catch (e) {
    log('⚠', `DeepSeek-OCR 执行失败: ${e.message}，降级到 MarkItDown`);
    return convertMarkItDown(filePath);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  元数据提取
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractMetadata(text, filePath) {
  const lines = text.split('\n').filter(l => l.trim());
  const firstH1 = lines.find(l => /^#\s+\S/.test(l));
  const title = firstH1
    ? firstH1.replace(/^#\s+/, '').trim()
    : basename(filePath).replace(/\.\w+$/, '');

  const firstLine = lines.find(l => l.trim().length > 10);
  const excerpt = firstLine ? firstLine.trim().slice(0, 120) : '';

  // 尝试提取日期
  const dateMatch = text.match(
    /(20\d{2}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日|20\d{2}[/-]\d{1,2}[/-]\d{1,2})/,
  );
  const date = dateMatch ? dateMatch[1] : '';

  return { title, excerpt, date };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  写入 Markdown
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function writeOutput(markdown, meta, filePath, outputDir) {
  const slug = basename(filePath).replace(/\.\w+$/, '').replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_');
  const outPath = join(outputDir, `${slug}.md`);

  const header = [
    '---',
    `title: "${meta.title}"`,
    meta.date ? `date: "${meta.date}"` : '',
    `source: "${filePath}"`,
    `ingested: "${new Date().toISOString().slice(0, 10)}"`,
    `excerpt: "${meta.excerpt}"`,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  const full = header + markdown;
  writeFileSync(outPath, full, 'utf-8');
  return outPath;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  入口
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function main() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help') || args.length === 0) showHelp();

  const inputIdx = args.indexOf('--input');
  const outputIdx = args.indexOf('--output');
  const engineIdx = args.indexOf('--engine');
  const input = inputIdx >= 0 ? args[inputIdx + 1] : null;
  const output = outputIdx >= 0 ? args[outputIdx + 1] : DEFAULT_OUT;
  const engine = engineIdx >= 0 ? args[engineIdx + 1] : 'markitdown';
  const withWiki = args.includes('--wiki');
  const recursive = args.includes('--recursive');
  const dryRun = args.includes('--dry-run');

  if (!input) die('请提供 --input <文件或目录>');

  const inputPath = resolve(input);
  if (!existsSync(inputPath)) die(`输入路径不存在: ${inputPath}`);

  const files = scanFiles(inputPath, recursive);
  if (files.length === 0) die('未发现可处理的文件');

  if (!existsSync(output)) mkdirSync(output, { recursive: true });

  log('📥', `发现 ${files.length} 个文件，引擎: ${engine}`);
  if (dryRun) {
    files.forEach(f => log('  📄', basename(f)));
    log('🏁', '干运行结束，未做任何转换');
    return;
  }

  // 引擎选择
  const converters = {
    'markitdown': convertMarkItDown,
    'deepseek-ocr': () => {
      if (!checkDeepSeekAvailable()) {
        log('⚠', 'GPU 不可用，使用 MarkItDown');
        return convertMarkItDown;
      }
      log('🖥️', 'GPU 可用，使用 DeepSeek-OCR');
      return convertDeepSeekOCR;
    },
  };

  const convertFn = engine === 'markitdown'
    ? convertMarkItDown
    : (engine === 'deepseek-ocr'
      ? (checkDeepSeekAvailable() ? convertDeepSeekOCR : convertMarkItDown)
      : convertMarkItDown);

  const results = [];

  for (const f of files) {
    const ext = extname(f).toLowerCase();
    const type = ALLOWED[ext] || 'Unknown';
    log('🔄', `转换 ${basename(f)} (${type})...`);

    try {
      const markdown = convertFn(f);
      if (!markdown || markdown.length < 10) {
        log('⚠', `${basename(f)} 输出内容过短，跳过`);
        continue;
      }

      const meta = extractMetadata(markdown, f);
      const outPath = writeOutput(markdown, meta, f, output);
      log('✅', `已保存: ${outPath} (${markdown.length} 字)`);
      results.push({ file: f, output: outPath, meta, size: markdown.length });
    } catch (e) {
      log('❌', `${basename(f)} 失败: ${e.message}`);
    }
  }

  log('📊', `完成 ${results.length}/${files.length} 个文件`);

  // 调用 wiki-update
  if (withWiki && results.length > 0) {
    const wikiScript = join(DOCS, 'wiki-update.mjs');
    if (existsSync(wikiScript)) {
      log('📚', '更新知识库 wiki...');
      const mdFiles = results.map(r => r.output).join(' ');
      try {
        execSync(`node ${wikiScript} ${mdFiles}`, {
          encoding: 'utf-8',
          timeout: 60000,
          stdio: 'inherit',
        });
        log('✅', '知识库 wiki 已更新');
      } catch (e) {
        log('⚠', `wiki 更新失败: ${e.message}`);
      }
    } else {
      log('⚠', 'wiki-update.mjs 未找到，跳过 wiki 更新');
    }
  }

  // 摘要报告
  console.log('\n━━━━━━━━━━━ 消化报告 ━━━━━━━━━━━');
  results.forEach(r => {
    const label = basename(r.file);
    const parts = r.meta.title ? `${r.meta.title}` : label;
    console.log(`  ✅ ${parts} (${(r.size / 1000).toFixed(1)}KB) → ${basename(r.output)}`);
  });
  console.log(`📥 ${results.length}/${files.length} 已消化 → ${output}\n`);
}

main();
