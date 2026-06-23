#!/usr/bin/env node
/**
 * weekly-report — 超充周报自动化更新工具
 *
 * 每周超充重点项目截图 → OCR → 自动更新两份Excel：
 *   1. 汇竑资本-周一例会汇报表.xlsx（晟竑超充 sheet）
 *   2. 晟竑超充-项目信息汇总表.xlsx
 *
 * OCR 三重保障：
 *   1) tesseract.js（纯JS，零系统依赖）
 *   2) system tesseract（brew install tesseract）
 *   3) macOS 内置 Vision OCR（Swift）
 *
 * 用法:
 *   node weekly-report.mjs --img-dir ./本周图片/
 *   node weekly-report.mjs --install          # 安装OCR依赖
 *   node weekly-report.mjs --preview --img-dir ./图片/  # 预览
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, copyFileSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname);
const DEFAULT_XLSX = join(DOCS, '每周例会文件', '汇竑资本-周一例会汇报表.xlsx');
const DEFAULT_XLSX2 = join(DOCS, '..', 'Downloads', '晟竑超充-项目信息汇总表.xlsx');
const SWIFT_OCR = join(DOCS, '.ocr-helper.swift');

// ── 工具 ──

function log(emoji, msg) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(ts + ' ' + emoji + ' ' + msg);
}

function today()      { return new Date().toISOString().slice(0, 10); }
function now()        { return new Date().toISOString(); }

// ══════════════════════════════════════════════════════════
//  OCR — 三重保障
// ══════════════════════════════════════════════════════════

async function ocrImage(imagePath) {
  log('OCR', basename(imagePath));

  // 1) tesseract.js
  const r1 = await tryOcrTesseractJs(imagePath);
  if (r1) return r1;

  // 2) system tesseract
  const r2 = tryOcrSystemTesseract(imagePath);
  if (r2) return r2;

  // 3) macOS Vision (Swift)
  const r3 = tryOcrMacosVision(imagePath);
  if (r3) return r3;

  log('FAIL', '所有OCR方案均失败');
  return '';
}

/** tesseract.js — 纯Node.js，WASM引擎 */
async function tryOcrTesseractJs(imagePath) {
  try {
    const script = [
      'const T = require("tesseract.js");',
      'const p = ' + JSON.stringify(imagePath) + ';',
      '(async()=>{',
      '  try {',
      '    const {data} = await T.recognize(p, "chi_sim+eng", {logger:()=>{}});',
      '    console.log(JSON.stringify({ok:1,text:data.text}));',
      '  } catch(e) { console.log(JSON.stringify({ok:0,err:e.message})); }',
      '})();',
    ].join('\n');

    const out = execSync('node -e ' + JSON.stringify(script), {
      cwd: '/tmp', timeout: 120000, encoding: 'utf-8', maxBuffer: 10*1024*1024,
    });
    const r = JSON.parse(out.trim());
    if (r.ok && r.text.trim()) {
      log('OK  ', 'tesseract.js: ' + r.text.trim().length + '\u5b57');
      return r.text.trim();
    }
    if (!r.ok) log('WARN', 'tesseract.js: ' + r.err);
  } catch (e) {
    log('WARN', 'tesseract.js: ' + e.message.slice(0, 60));
  }
  return '';
}

/** system tesseract (brew) */
function tryOcrSystemTesseract(imagePath) {
  try {
    execSync('which tesseract', { stdio: 'pipe', timeout: 3000 });
    const out = execSync(
      'tesseract ' + JSON.stringify(imagePath) + ' stdout -l chi_sim+eng --psm 6 2>/dev/null',
      { timeout: 60000, encoding: 'utf-8', maxBuffer: 10*1024*1024 }
    );
    const text = out.trim();
    if (text.length > 20) {
      log('OK  ', 'system tesseract: ' + text.length + '\u5b57');
      return text;
    }
  } catch {}
  return '';
}

/** macOS 内置 Vision OCR */
function tryOcrMacosVision(imagePath) {
  try {
    // 确保 helper swift 文件存在
    const swiftCode = [
      'import Cocoa; import Vision',
      'let url = URL(fileURLWithPath: CommandLine.arguments[1])',
      'guard let img = NSImage(contentsOf: url) else { print("{}"); exit(1) }',
      'guard let cg = img.cgImage(forProposedRect:nil,context:nil,hints:nil) else { print("{}"); exit(1) }',
      'let req = VNRecognizeTextRequest { req, err in',
      '  if err != nil { print("{}"); exit(1) }',
      '  let obs = req.results as? [VNRecognizedTextObservation] ?? []',
      '  let strs = obs.compactMap { $0.topCandidates(1).first?.string }',
      '  let json = try! JSONSerialization.data(withJSONObject: ["text":strs.joined(separator:"\\n")])',
      '  print(String(data:json, encoding:.utf8)!)',
      '}',
      'req.recognitionLevel = .accurate',
      'req.recognitionLanguages = ["zh-Hans","en-US"]',
      'try VNImageRequestHandler(cgImage:cg,options:[:]).perform([req])',
    ].join('\n');

    writeFileSync(SWIFT_OCR, swiftCode, 'utf-8');

    const out = execSync('swift ' + JSON.stringify(SWIFT_OCR) + ' ' + JSON.stringify(imagePath), {
      timeout: 30000, encoding: 'utf-8', maxBuffer: 10*1024*1024,
    });
    const r = JSON.parse(out.trim());
    if (r.text && r.text.trim().length > 20) {
      log('OK  ', 'macOS Vision: ' + r.text.trim().length + '\u5b57');
      return r.text.trim();
    }
  } catch {}
  return '';
}

// ══════════════════════════════════════════════════════════
//  OCR 文本 → 项目数据解析
// ══════════════════════════════════════════════════════════

function parseProjects(ocrText, source) {
  const projects = [];
  const lines = ocrText.split('\n').filter(l => l.trim());
  const skipWords = ['超充','重点用户','跟进用户','动态','项目','渠道','情况',
    '落地','要素','承销','团队','序号','编号','周报','日期'];

  let cur = null;
  for (const line of lines) {
    const t = line.trim();
    if (t.length < 4) continue;
    if (skipWords.some(w => t === w)) continue;

    if (/项目|场站|矿区|充电|贴牌|合作|采购|签约|尽调|投标|交付/.test(t)) {
      if (cur) projects.push(cur);
      cur = { raw: t, source, name:'', region:'', status:'', stage:'', deliveryDate:'', clientType:'', notes:[] };

      const regions = ['新疆','广东','陕西','内蒙古','华南','华北','华东','广西','两广','哈密','榆林','红沙泉','达旗','玉门','天津'];
      for (const r of regions) { if (t.includes(r)) { cur.region = r; break; } }

      if (/签约|采购/.test(t)) cur.status = '推进中';
      if (/已签约|已完成/.test(t)) cur.status = '已签约';
      if (/未签约|在谈/.test(t)) cur.status = '未签约';
      if (/尽调/.test(t)) cur.stage = '尽调中';
      if (/交付|通电/.test(t)) cur.stage = '交付中';

      const dm = t.match(/(\d{1,2})[\.月](\d{1,2})/);
      if (dm) cur.deliveryDate = dm[1] + '.' + dm[2];

      if (/上市/.test(t)) cur.clientType = '上市公司';
      else if (/国企|央企/.test(t)) cur.clientType = '国企';
      else if (/民企|民营/.test(t)) cur.clientType = '民企';
      else if (/外资|经销/.test(t)) cur.clientType = '其他';
    } else if (cur) {
      cur.notes.push(t);
    }
  }
  if (cur) projects.push(cur);
  return projects;
}

// ══════════════════════════════════════════════════════════
//  模糊化 + Excel 操作
// ══════════════════════════════════════════════════════════

function fuzzifyProject(p) {
  const r = p.region || '';
  const ct = p.clientType || '';
  const ns = p.notes.join(' ');

  let clientName = r + ct || r + '\u4f01\u4e1a';
  let projectName = r + '\u91cd\u70b9\u9879\u76ee';

  if (/场站|充电/.test(p.raw)) projectName = r + '\u8d85\u5145\u573a\u7ad9\u9879\u76ee';
  else if (/矿区|矿山/.test(p.raw)) projectName = r + '\u77ff\u533a\u8fd0\u8f93\u9879\u76ee';
  else if (/贴牌/.test(p.raw)) projectName = '\u8d34\u724c\u5408\u4f5c\u9879\u76ee';
  else if (/车/.test(p.raw) && /合作/.test(p.raw)) projectName = '\u8f66\u5145\u5408\u4f5c\u9879\u76ee';
  else if (/集采|采购/.test(p.raw)) projectName = r + '\u96c6\u91c7\u9879\u76ee';
  else if (/投标|招标/.test(p.raw)) projectName = r + '\u6295\u6807\u9879\u76ee';

  return { clientName, projectName };
}

function readExcel(xlsxPath) {
  log('XLSX', basename(xlsxPath));
  const XLSX = require('xlsx');
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets['\u664f\u5432\u8d85\u5145'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  return { wb, ws, data };
}

function writeExcel(wb, xlsxPath) {
  const XLSX = require('xlsx');
  XLSX.writeFile(wb, xlsxPath);
  log('SAVE', basename(xlsxPath));
}

function findProjectRows(data) {
  const hr = data.findIndex(r =>
    r.some(c => String(c||'').includes('\u5ba2\u6237')) &&
    r.some(c => String(c||'').includes('\u9879\u76ee\u540d\u79f0'))
  );
  const start = hr >= 0 ? hr + 1 : 6;
  const projects = [];
  for (let i = start; i < data.length; i++) {
    const r = data[i] || [];
    const client = String(r[1]||'').trim();
    const pname = String(r[4]||'').trim();
    if (client && pname && client !== 'undefined') {
      projects.push({ rowIdx:i, client, projectName:pname,
        signStatus:String(r[5]||''), stage:String(r[10]||''), deliveryDate:String(r[11]||'') });
    }
  }
  return { startRow:start, projects };
}

function matchProject(parsed, existing) {
  let best = null, bestScore = 0;
  for (const ep of existing) {
    let score = 0;
    if (parsed.region && (ep.client.includes(parsed.region) || ep.projectName.includes(parsed.region))) score += 30;
    if (parsed.clientType && ep.client.includes(parsed.clientType)) score += 20;
    const kws = ['场站','充电','矿区','贴牌','集采','合作','车充'];
    for (const kw of kws) { if (parsed.raw.includes(kw) && (ep.client.includes(kw) || ep.projectName.includes(kw))) score += 15; }
    if (parsed.deliveryDate && ep.deliveryDate.includes(parsed.deliveryDate)) score += 25;
    if (score > bestScore) { bestScore = score; best = ep; }
  }
  return bestScore >= 20 ? best : null;
}

// ══════════════════════════════════════════════════════════
//  文件2: 项目信息汇总表 更新
// ══════════════════════════════════════════════════════════

function updateProjectSummary(xlsxPath, parsedProjects) {
  const XLSX = require('xlsx');
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets['\u664f\u5432\u8d85\u5145'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const hr = data.findIndex(r => String(r[0]||'').includes('\u5e8f\u53f7') && String(r[2]||'').includes('\u9879\u76ee\u540d\u79f0'));
  const start = hr >= 0 ? hr + 1 : 2;
  let updated = 0;

  for (const p of parsedProjects) {
    let matchRow = -1;
    for (let i = start; i < data.length; i++) {
      const row = data[i] || [];
      const rt = (row[2]||'') + (row[7]||'');
      let score = 0;
      if (p.region && rt.includes(p.region)) score += 20;
      if (p.clientType && rt.includes(p.clientType)) score += 10;
      for (const w of ['场站','矿区','车','贴牌','集采','充电','运输']) {
        if (p.raw.includes(w) && rt.includes(w)) score += 10;
      }
      if (score >= 20) { matchRow = i; break; }
    }
    if (matchRow < 0) continue;

    const row = data[matchRow];
    const changes = [];

    // N列(13): 项目阶段
    if (p.stage && !String(row[13]||'').includes(p.stage)) {
      changes.push('N\u9636\u6bb5: ' + (row[13]||'') + ' \u2192 ' + p.stage);
      row[13] = p.stage;
    }

    // Q列(16): 历史沟通记录（追加）
    const newNote = buildNote(p);
    if (newNote) {
      const old = row[16] || '';
      if (!old.includes(newNote.slice(0,20))) {
        row[16] = old + (old ? '\uff1b' : '') + newNote;
        changes.push('Q\u8bb0\u5f55: \u5df2\u8ffd\u52a0');
      }
    }

    if (changes.length > 0) {
      updated++;
      console.log('  \u{1f4cc} ' + String(row[2]||'').slice(0,30));
      changes.forEach(c => console.log('     ' + c));
    }
  }

  if (updated > 0) {
    const nws = XLSX.utils.aoa_to_sheet(data);
    if (ws['!cols']) nws['!cols'] = ws['!cols'];
    nws['!ref'] = ws['!ref'];
    wb.Sheets['\u664f\u5432\u8d85\u5145'] = nws;
    writeExcel(wb, xlsxPath);
  }
  console.log('  \u2705 ' + updated + ' \u4e2a\u9879\u76ee\u5df2\u66f4\u65b0\n');
}

function buildNote(p) {
  const parts = [];
  if (/签约|采购/.test(p.raw) && /电擎|首期/.test(p.raw)) parts.push('\u5df2\u4e0e\u7535\u64ce\u91cd\u79d1\u7b7e\u7ea6\uff0c\u9996\u671f5-10\u5957');
  if (/组团拜访|技术方案/.test(p.raw)) parts.push('\u672c\u5468\u56e2\u7ec4\u62dc\u8bbf\uff0c\u4ee5\u5149\u50a8\u5145\u65b9\u6848\u4e3a\u4e3b');
  if (/车电方案|通电/.test(p.raw)) parts.push('\u8ddf\u8fdb\u8f66\u7535\u65b9\u6848\uff0c\u4f9b\u8d27\u51c6\u5907\u4e2d');
  if (p.deliveryDate) parts.push(p.deliveryDate + '\u4ea4\u4ed8');
  return parts.join('\uff0c');
}

// ══════════════════════════════════════════════════════════
//  CLI + 参数
// ══════════════════════════════════════════════════════════

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    console.log([
      '',
      '\u{1f4cb} weekly-report \u2014 \u8d85\u5145\u5468\u62a5\u81ea\u52a8\u5316\u66f4\u65b0\u5de5\u5177',
      '',
      '\u7528\u6cd5:',
      '  node weekly-report.mjs --img-dir <path>  \u4ece\u76ee\u5f55\u8bfb\u53d64\u5f20\u56fe\u7247',
      '  node weekly-report.mjs --install         \u5b89\u88c5OCR\u4f9d\u8d56',
      '  node weekly-report.mjs --preview --img-dir ./  \u9884\u89c8\u6a21\u5f0f',
      '',
      'OCR \u4e09\u91cd\u4fdd\u969c:',
      '  1) tesseract.js \u2014 zero system deps',
      '  2) brew tesseract \u2014 macOS brew install',
      '  3) macOS Vision \u2014 \u5185\u7f6eSwift OCR',
      '',
      '\u6bcf\u5468\u64cd\u4f5c:',
      '  1. \u4e0b\u8f7d\u6700\u65b0 \u664f\u5432\u8d85\u5145-\u9879\u76ee\u4fe1\u606f\u6c47\u603b\u8868.xlsx \u5230 ~/Downloads/',
      '  2. \u5c06\u5fae\u4fe1\u622a\u56fe\u4fdd\u5b58\u5230\u6587\u4ef6\u5939',
      '  3. node weekly-report.mjs --img-dir ./\u6587\u4ef6\u5939/\n',
    ].join('\n'));
    process.exit(0);
  }

  if (args.includes('--install')) {
    console.log('\u{1f4e6} \u5b89\u88c5 tesseract.js...');
    execSync('npm install tesseract.js xlsx', { cwd: DOCS, stdio: 'inherit', timeout: 120000 });
    console.log('\u2705 \u5b8c\u6210\n');
    process.exit(0);
  }

  const get = (f) => { const i = args.indexOf(f); return i>=0 && i<args.length-1 ? args[i+1] : null; };
  return {
    imgDir: get('--img-dir'),
    img1: get('--img1'),
    img2: get('--img2'),
    xlsxPath: get('--xlsx'),
    xlsx2Path: get('--xlsx2'),
    preview: args.includes('--preview'),
  };
}

// ══════════════════════════════════════════════════════════
//  主流程
// ══════════════════════════════════════════════════════════

async function main() {
  console.log('\n==================================================');
  console.log('  \u{1f4cb} weekly-report \u2014 \u8d85\u5145\u5468\u62a5\u81ea\u52a8\u5316\u66f4\u65b0');
  console.log('==================================================\n');

  const opts = parseArgs();
  let { imgDir, img1, img2, xlsxPath:cliXlsx, xlsx2Path:cliXlsx2, preview } = opts;

  // ── 图片 ──
  if (imgDir) {
    const files = readdirSync(imgDir).filter(f => /\.jpe?g$/i.test(f) || /\.png$/i.test(f)).sort();
    const f1 = files.find(f => f.includes('1'));
    const f2 = files.find(f => f.includes('2'));
    if (f1) img1 = join(imgDir, f1);
    if (f2) img2 = join(imgDir, f2);
  }

  if (!img1 || !existsSync(img1)) {
    console.error('\u274c \u8bf7\u6307\u5b9a\u56fe\u7247\u8def\u5f84');
    console.error('   \u7528\u6cd5: node weekly-report.mjs --img-dir ./\u672c\u5468\u56fe\u7247/');
    process.exit(1);
  }

  const xlsxPath = cliXlsx || DEFAULT_XLSX;
  if (!existsSync(xlsxPath)) { console.error('\u274c Excel\u4e0d\u5b58\u5728: ' + xlsxPath); process.exit(1); }

  // ── Step 1: OCR ──
  log('OCR', '\u5f00\u59cb\u8bc6\u522b\u56fe\u7247...\n');
  const [t1, t2] = await Promise.all([
    ocrImage(img1).catch(()=>''),
    img2 && existsSync(img2) ? ocrImage(img2).catch(()=>'') : Promise.resolve(''),
  ]);

  if (!t1 && !t2) {
    log('FAIL', 'OCR \u5168\u90e8\u5931\u8d25');
    console.log('\n\u5efa\u8bae:');
    console.log('  npm install tesseract.js              # \u5b89\u88c5\u7eafJS OCR');
    console.log('  brew install tesseract tesseract-lang  # \u6216\u5b89\u88c5\u7cfb\u7edfOCR');
    process.exit(1);
  }

  // ── Step 2: 解析 ──
  const allParsed = [...parseProjects(t1,'\u91cd\u70b9\u7528\u6237'), ...parseProjects(t2,'\u8ddf\u8fdb\u7528\u6237')];
  if (allParsed.length === 0) {
    log('WARN', '\u672a\u8bc6\u522b\u5230\u9879\u76ee\u6570\u636e\uff0c\u8bf7\u68c0\u67e5\u56fe\u7247\u6e05\u6670\u5ea6');
    process.exit(1);
  }

  log('PARS', '\u89e3\u6790\u5230 ' + allParsed.length + ' \u4e2a\u9879\u76ee\n');
  for (const p of allParsed) {
    const f = fuzzifyProject(p);
    console.log('  [' + p.source + '] ' + f.clientName + ' | ' + f.projectName);
    console.log('          ' + p.raw.slice(0,60));
    if (p.deliveryDate) console.log('         \u4ea4\u4ed8: ' + p.deliveryDate);
    console.log();
  }

  // ── Step 3: Excel匹配 ──
  const { wb, ws, data } = readExcel(xlsxPath);
  const { projects: existing } = findProjectRows(data);
  log('XLSX', '\u73b0\u6709 ' + existing.length + ' \u4e2a\u9879\u76ee\u884c');

  const updates = [], newProjects = [];
  for (const p of allParsed) {
    const m = matchProject(p, existing);
    const f = fuzzifyProject(p);
    if (m) {
      const ch = {};
      if (p.status && p.status !== m.signStatus) ch.signStatus = { from:m.signStatus, to:p.status };
      if (p.stage && p.stage !== m.stage) ch.stage = { from:m.stage, to:p.stage };
      if (p.deliveryDate && !m.deliveryDate.includes(p.deliveryDate)) ch.deliveryDate = { from:m.deliveryDate, to:p.deliveryDate };
      if (Object.keys(ch).length > 0) updates.push({ row:m.rowIdx, match:f.clientName, changes:ch });
    } else {
      newProjects.push(p);
    }
  }

  // ── Step 4: print preview ──
  if (updates.length > 0) {
    console.log('\n\u{1f4dd} \u5f85\u66f4\u65b0:');
    for (const u of updates) {
      console.log('  \u{1f4cc} ' + u.match);
      for (const [k,v] of Object.entries(u.changes)) console.log('     ' + k + ': ' + v.from + ' \u2192 ' + v.to);
      console.log();
    }
  }
  if (newProjects.length > 0) {
    console.log('\u{1f195} \u672a\u5339\u914d:');
    for (const p of newProjects) console.log('  ' + fuzzifyProject(p).clientName + ' | ' + p.raw.slice(0,50));
    console.log();
  }

  if (preview) {
    console.log('\n\u{1f441} \u9884\u89c8\u6a21\u5f0f \u2014 \u53bb\u6389 --preview \u5373\u53ef\u5199\u5165\n');
    return;
  }
  if (updates.length === 0 && newProjects.length === 0) { log('INFO', '\u65e0\u53d8\u66f4'); return; }

  // ── Step 5: 写入文件1 ──
  const XLSX = require('xlsx');
  for (const u of updates) {
    const r = u.row;
    if (u.changes.signStatus) data[r][5] = u.changes.signStatus.to;
    if (u.changes.stage) data[r][10] = u.changes.stage.to;
    if (u.changes.deliveryDate) data[r][11] = u.changes.deliveryDate.to;
  }
  const nws = XLSX.utils.aoa_to_sheet(data);
  nws['!ref'] = ws['!ref'];
  if (ws['!cols']) nws['!cols'] = ws['!cols'];
  wb.Sheets['\u664f\u5432\u8d85\u5145'] = nws;
  writeExcel(wb, xlsxPath);

  // ── Step 6: 写入文件2 ──
  const x2 = cliXlsx2 || DEFAULT_XLSX2;
  if (existsSync(x2)) {
    console.log('\n\u{1f4cb} \u6587\u4ef62: \u664f\u5432\u8d85\u5145-\u9879\u76ee\u4fe1\u606f\u6c47\u603b\u8868');
    updateProjectSummary(x2, allParsed);
  } else {
    log('INFO', '\u9879\u76ee\u4fe1\u606f\u6c47\u603b\u8868\u4e0d\u5b58\u5728\uff0c\u8df3\u8fc7: ' + x2);
  }

  console.log('\n==================================================');
  log('DONE', '\u53cc\u6587\u4ef6\u66f4\u65b0\u5b8c\u6210');
  console.log('   \u66f4\u65b0 ' + updates.length + ' \u4e2a\u9879\u76ee');
  console.log('   \u65b0\u53d1\u73b0 ' + newProjects.length + ' \u4e2a\u53ef\u80fd\u7684\u65b0\u9879\u76ee');
  console.log('==================================================\n');
}

main().catch(e => { console.error('\n\u274c', e.message); process.exit(1); });
