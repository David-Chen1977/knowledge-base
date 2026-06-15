#!/usr/bin/env node
/**
 * pipeline-dashboard.mjs stub — 生产仪表盘
 * 当前为最小实现：打印产出摘要
 */
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const OUTPUT_DIR = join(__dirname, '..', '三件套输出');

console.log('\n' + '='.repeat(56));
console.log('  📊 生产仪表盘');
console.log('='.repeat(56));

const outputFiles = existsSync(OUTPUT_DIR) ? readdirSync(OUTPUT_DIR) : [];
const videos = outputFiles.filter(f => f.endsWith('.mp4')).length;
const pptxs = outputFiles.filter(f => f.endsWith('.pptx')).length;
const articles = outputFiles.filter(f => f.includes('公众号文章')).length;
const websites = outputFiles.filter(f => f.includes('网站文章')).length;
const bundles = outputFiles.filter(f => f.startsWith('bundle_') && f.endsWith('.json')).length;

console.log(`\n  选题 Bundle:  ${bundles} 个`);
console.log(`  公众号文章:   ${articles} 篇`);
console.log(`  网站文章:     ${websites} 篇`);
console.log(`  PPT:          ${pptxs} 份`);
console.log(`  视频:         ${videos} 个`);
console.log(`\n  总计产出:     ${articles + websites + pptxs + videos} 个文件`);
console.log(`  目录:         ${OUTPUT_DIR}`);
console.log('\n' + '='.repeat(56) + '\n');

if (args.includes('--html') && args.includes('--open')) {
  console.log('HTML 仪表盘暂不可用（需配置前端），已显示文本版。');
}

process.exit(0);
