#!/usr/bin/env node
/**
 * video-hyperframes.mjs — 已废弃，委托给 ppt_to_video.py
 */
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

// 提取 --topic 和 --output
function getFlag(flag) {
  const i = args.indexOf(flag);
  return i >= 0 && i < args.length - 1 ? args[i + 1] : null;
}

const topic = getFlag('--topic') || '';
const output = getFlag('--output') || '';
const batchDir = output ? dirname(output) : process.cwd();

// 找 bundle JSON
const { readdirSync, existsSync } = await import('fs');
let bundlePath = null;
try {
  const dir = batchDir;
  const files = readdirSync(dir).filter(f => f.endsWith('.bundle.json'));
  if (files.length > 0) bundlePath = join(dir, files[0]);
} catch {}

if (!bundlePath) {
  const fallback = join(__dirname, '..', '三件套输出', 'bundle_01.json');
  if (existsSync(fallback)) bundlePath = fallback;
}

if (bundlePath) {
  console.log(`Delegating to ppt_to_video.py --bundle ${bundlePath}`);
  const script = join(__dirname, 'ppt_to_video.py');
  execSync(`python3 "${script}" --bundle "${bundlePath}"`, { stdio: 'inherit' });
} else {
  console.log('No bundle found — video skipped');
}

process.exit(0);
