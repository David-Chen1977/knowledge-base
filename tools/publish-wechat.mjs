#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const WENYAN_MCP = '/Users/Admin/.hermes/node/lib/node_modules/@wenyan-md/mcp/dist/index.js';
const ARTICLE_FILE = '/Users/Admin/OpencodeWorkspace/内容输出/一个框架看懂电力新能源赛道/文章.md';

class MCPClient {
  constructor(command) {
    this.proc = spawn('node', [command], {
      env: {
        ...process.env,
        WECHAT_APP_ID: 'wx7ae4cfe0d680c0fe',
        WECHAT_APP_SECRET: 'adf75c607ef68de68e19180fd4507246',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.requestId = 1;
    this.pending = new Map();

    const rl = createInterface({ input: this.proc.stdout });
    rl.on('line', (line) => {
      try {
        const msg = JSON.parse(line);
        if (msg.id && this.pending.has(msg.id)) {
          this.pending.get(msg.id)(msg);
          this.pending.delete(msg.id);
        }
      } catch (e) {}
    });

    this.proc.stderr.on('data', (d) => {
      const str = d.toString();
      if (!str.includes('[Init]')) console.error('MCP err:', str);
    });
  }

  async call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const request = { jsonrpc: '2.0', id, method, params };
      this.pending.set(id, resolve);
      this.proc.stdin.write(JSON.stringify(request) + '\n');
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Timeout for ${method}`));
        }
      }, 60000);
    });
  }

  async initialize() {
    return this.call('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'opencode-publisher', version: '1.0.0' },
    });
  }

  async listTools() {
    const result = await this.call('tools/list');
    return result;
  }

  async callTool(name, args) {
    const result = await this.call('tools/call', { name, arguments: args });
    return result;
  }

  close() {
    this.proc.stdin.end();
    this.proc.kill();
  }
}

async function main() {
  console.log('🚀 Starting wenyan-mcp client...');
  const client = new MCPClient(WENYAN_MCP);

  try {
    const init = await client.initialize();
    console.log('✅ Initialized');

    // List tools to see exact names and schemas
    const toolsResp = await client.listTools();
    const tools = toolsResp.result?.tools || [];
    console.log('Available tools:');
    for (const t of tools) {
      console.log(`  - ${t.name}`);
      console.log(`    description: ${t.description || 'N/A'}`);
      console.log(`    inputSchema: ${JSON.stringify(t.inputSchema, null, 4)}`);
    }

    // Read article
    const fs = await import('fs');
    const markdown = fs.readFileSync(ARTICLE_FILE, 'utf-8');
    console.log(`\n📄 Article loaded (${markdown.length} chars)`);

    // Try publish_article
    console.log('\n📤 Publishing to WeChat draft...');
    const result = await client.callTool('publish_article', {
      file: ARTICLE_FILE,
      theme_id: 'default',
    });

    console.log('\n✅ Result:', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('\n❌ Error:', err.message);
  } finally {
    client.close();
  }
}

main();
