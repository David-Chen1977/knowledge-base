#!/usr/bin/env node
/**
 * create-handoff.mjs — 创建交接上下文包
 *
 * OpenCode 在完成一个工作段、需要 WorkBuddy 接续时调用此脚本。
 * 生成的结构化 JSON 包含 WorkBuddy 继续工作所需的全部上下文。
 *
 * 用法:
 *   node create-handoff.mjs --from opencode --to workbuddy \
 *     --topic "冷却液材料" \
 *     --summary "三件套完成" \
 *     --task "生成可视化图表" \
 *     [选项]
 *
 * 选项:
 *   --from <tool>         来源工具 (opencode|workbuddy)
 *   --to <tool>           目标工具 (opencode|workbuddy)
 *   --topic <string>      任务主题
 *   --summary <string>    一句话总结
 *   --task <string>       需要对方做的下一件事 (可重复)
 *   --blocker <string>    阻塞项 (可重复)
 *   --key-finding <string> 关键发现 (可重复)
 *   --next-step <string>  下一步建议 (可重复)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HANDOFF_DIR = resolve(__dirname, 'handoff');

function now() { return new Date().toISOString(); }
function ts() { return new Date().toISOString().replace(/[:.]/g, '-'); }

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
  };

  const handoff = {
    version: 1,
    handoffId: `ho_${ts().slice(0, 19)}`,
    timestamp: now(),
    from: get('--from') || 'opencode',
    to: get('--to') || 'workbuddy',
    summary: get('--summary') || '工作段完成',
    context: {
      topic: get('--topic') || '',
      userRequest: '',
      keyFindings: [],
    },
    whatWasDone: {},
    needsFromReceiver: [],
    blockers: [],
    nextSteps: {
      immediate: get('--task') || '',
      future: ''
    }
  };

  // 收集重复参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key-finding' && i + 1 < args.length) {
      handoff.context.keyFindings.push(args[++i]);
    } else if (args[i] === '--task' && i + 1 < args.length) {
      handoff.needsFromReceiver.push(args[++i]);
    } else if (args[i] === '--blocker' && i + 1 < args.length) {
      handoff.blockers.push(args[++i]);
    } else if (args[i] === '--next-step' && i + 1 < args.length) {
      if (!handoff.nextSteps.future) handoff.nextSteps.future = args[++i];
    }
  }

  return handoff;
}

// ── 主逻辑 ──

const handoff = parseArgs();

if (!handoff.context.topic) {
  console.error('❌ --topic 是必填项');
  process.exit(1);
}

mkdirSync(HANDOFF_DIR, { recursive: true });

// 文件名：{timestamp}_{topic}.json
const filename = `${ts()}_${handoff.context.topic.replace(/[^\w\u4e00-\u9fff]+/g, '_').slice(0, 30)}.json`;
const outPath = join(HANDOFF_DIR, filename);

writeFileSync(outPath, JSON.stringify(handoff, null, 2), 'utf-8');

// 清理旧文件（保留最近 20 个）
const files = readdirSync(HANDOFF_DIR)
  .filter(f => f.endsWith('.json'))
  .sort()
  .reverse();

if (files.length > 20) {
  for (const old of files.slice(20)) {
    try { writeFileSync(join(HANDOFF_DIR, old), ''); } catch {}
  }
}

console.log(`📦 交接上下文包已创建: brain/handoff/${filename}`);
console.log(`   来自: ${handoff.from} → 交给: ${handoff.to}`);
console.log(`   主题: ${handoff.context.topic}`);
if (handoff.needsFromReceiver.length > 0) {
  console.log(`   需要对方做的事:`);
  handoff.needsFromReceiver.forEach(t => console.log(`     - ${t}`));
}
console.log('✅ 交接就绪');
