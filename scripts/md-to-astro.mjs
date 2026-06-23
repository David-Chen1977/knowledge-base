#!/usr/bin/env node
/**
 * md-to-astro.mjs — Content Bundle JSON → 个人网站 .astro 页面
 *
 * 用法:
 *   node md-to-astro.mjs --bundle path/to/bundle.json [选项]
 *
 * 选项:
 *   --bundle <path>       Content Bundle JSON 路径（必填）
 *   --website-dir <path>  个人网站根目录（默认 ../personal-website）
 *   --article <path>      article.md 路径（可选，默认用 bundle.content）
 *   --read-time <str>     阅读时间（可选，自动估算）
 *   --preview             打印 .astro 内容到控制台，不写入
 *   --dry-run             只打印将执行的操作
 *   --git-commit          自动 git commit（需确认后手动 push）
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_WEBSITE_DIR = join(__dirname, 'personal-website');

// ── CLI ──

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
  };
  return {
    bundlePath: get('--bundle'),
    websiteDir: get('--website-dir') || DEFAULT_WEBSITE_DIR,
    articlePath: get('--article'),
    readTime: get('--read-time'),
    preview: args.includes('--preview'),
    dryRun: args.includes('--dry-run'),
    gitCommit: args.includes('--git-commit'),
  };
}

// ── Markdown → HTML（简洁转换） ──

function inlineMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function mdToHtml(md) {
  let html = '';
  const lines = md.split('\n');
  let inTable = false;
  let tableBuf = '';
  let inCodeBlock = false;
  let codeBuf = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 代码块
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBuf = '';
      } else {
        inCodeBlock = false;
        html += '<pre><code>' + codeBuf.trimEnd() + '</code></pre>\n\n';
        codeBuf = '';
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuf += line + '\n';
      continue;
    }

    // 表格
    if (trimmed.startsWith('|')) {
      if (!inTable) { inTable = true; tableBuf = '<table>\n'; }
      const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
      const nextLine = lines[i + 1]?.trim();
      const isSep = nextLine?.match(/^\|[\s\-:|]+\|?$/);
      // 如果有分隔行，当前行是表头，下一行跳过
      if (isSep) {
        tableBuf += `  <tr>${cells.map(c => `<th>${inlineMd(c)}</th>`).join('')}</tr>\n`;
        i++; // 跳过分隔行
      } else {
        const tag = tableBuf.includes('<th>') ? 'td' : 'th';
        tableBuf += `  <tr>${cells.map(c => `<${tag}>${inlineMd(c)}</${tag}>`).join('')}</tr>\n`;
      }
      continue;
    }
    if (inTable) {
      inTable = false;
      html += tableBuf + '</table>\n\n';
      tableBuf = '';
    }

    // 标题 h1/h2/h3
    const hm = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      html += `<h${hm[1].length}>${inlineMd(hm[2])}</h${hm[1].length}>\n\n`;
      continue;
    }

    // blockquote（支持多行 >）
    if (trimmed.startsWith('> ')) {
      let q = '';
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        q += (q ? '<br />' : '') + inlineMd(lines[i].trim().slice(2));
        i++;
      }
      html += `<blockquote><p>${q}</p></blockquote>\n\n`;
      i--;
      continue;
    }

    // 无序列表
    if (/^[\-\*]\s/.test(trimmed)) {
      let list = '<ul>\n';
      while (i < lines.length && /^[\-\*]\s/.test(lines[i].trim())) {
        list += `  <li>${inlineMd(lines[i].trim().replace(/^[\-\*]\s+/, ''))}</li>\n`;
        i++;
      }
      html += list + '</ul>\n\n';
      i--;
      continue;
    }

    // 有序列表
    if (/^\d+\.\s/.test(trimmed)) {
      let list = '<ol>\n';
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        list += `  <li>${inlineMd(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>\n`;
        i++;
      }
      html += list + '</ol>\n\n';
      i--;
      continue;
    }

    // 水平线
    if (trimmed === '---') {
      html += '<hr />\n\n';
      continue;
    }

    // 空行
    if (!trimmed) continue;

    // 段落
    html += `<p>${inlineMd(trimmed)}</p>\n\n`;
  }

  if (inTable) html += tableBuf + '</table>\n\n';
  if (inCodeBlock) html += '<pre><code>' + codeBuf.trimEnd() + '</code></pre>\n\n';
  return html.trim();
}

// ── 生成 .astro 内容 ──

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateAstroContent(bundle, { bodyHtml, readTime, date }) {
  const tags = bundle.keywords?.slice(0, 6) || [];
  const tagLines = tags.map(t => `    <span class="tag">${escapeHtml(t)}</span>`).join('\n');

  // 标题支持换行
  const titleParts = bundle.title.split(/\n|——|：|(\p{Pd})/u).filter(Boolean);
  const titleHtml = titleParts.length > 1
    ? titleParts.map(p => escapeHtml(p.trim())).join('<br />')
    : escapeHtml(bundle.title);

  // 封面图（若有 URL）
  const coverImg = bundle.images?.find(i => i.usage === 'cover' || i.id === 'cover');
  const coverHtml = coverImg?.url
    ? `\n  <img src="${escapeAttr(coverImg.url)}" alt="${escapeAttr(coverImg.alt || bundle.title)}" style="width:100%;border-radius:8px;margin-bottom:1.5rem;" />\n`
    : '';

  return `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import RelatedArticles from '../../components/RelatedArticles.astro';
---

<BaseLayout title="${escapeAttr(bundle.title)}" description="${escapeAttr(bundle.digest || '')}">
  <a href="/blog" class="back-link">← 返回文章列表</a>

  <h1>${titleHtml}</h1>
  <div class="article-meta">
    <span>${escapeHtml(date)}</span>
    <span>· ${escapeHtml(readTime)}</span>
  </div>
  <div class="tags">
${tagLines}
  </div>
${coverHtml}
  ${bodyHtml}

  <RelatedArticles currentSlug="${bundle.slug}" category="${escapeAttr(tags[0] || '')}" />
</BaseLayout>`;
}

// ── 更新 blog.astro 文章列表 ──

function updateBlogListing(websiteDir, entry, dryRun) {
  const blogPath = join(websiteDir, 'src', 'pages', 'blog.astro');
  if (!existsSync(blogPath)) {
    console.error(`❌ blog.astro 不存在: ${blogPath}`);
    return false;
  }

  const content = readFileSync(blogPath, 'utf-8');

  // 去重检查
  if (content.includes(`slug: '${entry.slug}'`)) {
    console.log(`ℹ️  文章 "${entry.slug}" 已在 blog.astro 列表中，跳过`);
    return true;
  }

  const newLine = `  { slug: '${entry.slug}', title: '${entry.title.replace(/'/g, "\\'")}', desc: '${entry.desc.replace(/'/g, "\\'")}', date: '${entry.date}', readTime: '${entry.readTime}', category: '${entry.category.replace(/'/g, "\\'")}' },`;

  // 在第一个 articles 条目之前插入（按日期降序，新文章排最前）
  const match = content.match(/\n\s*\{ slug: '/);
  if (!match) {
    console.error('❌ 未找到 blog.astro 中 articles 数组插入点');
    return false;
  }

  const pos = match.index + 1; // after the newline
  const newContent = content.slice(0, pos) + newLine + '\n' + content.slice(pos);

  if (dryRun) {
    console.log(`📝 将插入 blog.astro:\n   ${newLine.trim()}`);
    return true;
  }

  writeFileSync(blogPath, newContent, 'utf-8');
  console.log(`✅ blog.astro 已更新，新增: ${entry.slug}`);
  return true;
}

// ── 主流程 ──

function main() {
  const opts = parseArgs();

  if (!opts.bundlePath) {
    console.error('❌ 必须指定 --bundle <bundle.json>');
    process.exit(1);
  }
  if (!existsSync(opts.bundlePath)) {
    console.error(`❌ Bundle 文件不存在: ${opts.bundlePath}`);
    process.exit(1);
  }

  const bundle = JSON.parse(readFileSync(opts.bundlePath, 'utf-8'));
  const websiteDir = opts.websiteDir;

  if (!existsSync(join(websiteDir, 'src'))) {
    console.error(`❌ 个人网站目录不存在: ${websiteDir}`);
    process.exit(1);
  }

  // 日期
  const date = bundle.generatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);

  // 阅读时间
  let readTime = opts.readTime;
  if (!readTime) {
    const wordCount = (bundle.content || '').length;
    readTime = `约 ${Math.max(1, Math.round(wordCount / 500))} 分钟阅读`;
  }

  // 正文 HTML
  let bodyMd = '';
  if (opts.articlePath && existsSync(opts.articlePath)) {
    bodyMd = readFileSync(opts.articlePath, 'utf-8');
  } else if (bundle.content) {
    bodyMd = bundle.content;
  }
  // 剥离 YAML frontmatter（--- 之间的内容）
  bodyMd = bodyMd.replace(/^---\n[\s\S]*?\n---\n?/, '');
  // 去掉首个一级标题（页面已有 h1 title）
  bodyMd = bodyMd.replace(/^# .+\n?/, '').trim();
  const bodyHtml = bodyMd ? mdToHtml(bodyMd) : '';

  const astroPath = join(websiteDir, 'src', 'pages', 'blog', `${bundle.slug}.astro`);
  const astroContent = generateAstroContent(bundle, { bodyHtml, readTime, date });

  if (opts.dryRun) {
    console.log('\n📋 md-to-astro 计划:');
    console.log(`   页面: ${astroPath}`);
    console.log(`   标题: ${bundle.title}`);
    console.log(`   标签: ${(bundle.keywords || []).join(', ')}`);
    console.log(`   日期: ${date}`);
    console.log(`   阅读: ${readTime}`);
    return;
  }

  if (opts.preview) {
    console.log('\n=== .astro 预览 ===\n');
    console.log(astroContent);
    return;
  }

  // 写入 .astro
  writeFileSync(astroPath, astroContent, 'utf-8');
  console.log(`✅ .astro 已生成: ${bundle.slug}.astro`);

  // 更新 blog.astro 列表
  const desc = bundle.digest || bundle.topic || '';
  updateBlogListing(websiteDir, {
    slug: bundle.slug,
    title: bundle.title,
    desc,
    date,
    readTime,
    category: (bundle.keywords?.[0]) || 'AI 协作',
  }, opts.dryRun);

  // Git 提交
  if (opts.gitCommit) {
    console.log('\n🔄 提交到 Git...');
    try {
      execSync('git add src/pages/blog src/pages/blog.astro', { cwd: websiteDir, stdio: 'pipe' });
      execSync(`git commit -m "feat(blog): 新增文章 — ${bundle.title}"`, { cwd: websiteDir, stdio: 'pipe' });
      console.log('✅ Git 提交成功');
      console.log('ℹ️  推送需手动执行:');
      console.log(`   cd ${websiteDir} && git push`);
    } catch (e) {
      console.error(`❌ Git 提交失败: ${e.message}`);
    }
  }

  console.log('\n🎉 网站页面已就绪');
  console.log(`   页面路径: ${astroPath}`);
  console.log(`   部署命令: cd ${websiteDir} && git add . && git commit -m "feat: new article" && git push`);
}

try {
  main();
} catch (e) {
  console.error(`\n❌ ${e.message}`);
  process.exit(1);
}
