#!/usr/bin/env python3
"""
http-bridge.py — 本地 HTTP 桥接服务
腾讯元宝 → HTTP POST → 文件 → OpenCode

用法：
  python3 http-bridge.py              # 默认端口 8899
  python3 http-bridge.py --port 9999  # 自定义端口

从元宝浏览器或任何 HTTP 客户端发送内容：
  curl -X POST http://localhost:8899/import \
    -H "Content-Type: text/plain" \
    -d "你的内容..."

  # 带标题：
  curl -X POST http://localhost:8899/import \
    -H "Content-Type: application/json" \
    -d '{"title": "会议纪要", "content": "正文..."}'
"""

import http.server
import json
import os
import sys
from datetime import datetime

BRIDGE_DIR = os.path.expanduser("~/OpencodeWorkspace/知识库/元宝桥接")
PORT = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == "--port" else 8899

class BridgeHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            html = """<html><body>
<h2>🔄 元宝桥接服务</h2>
<p>POST <code>/import</code> 来导入内容</p>
<textarea id="content" rows="10" cols="60" placeholder="粘贴内容..."></textarea><br/>
<input type="text" id="title" placeholder="标题（可选）"/><br/>
<button onclick="send()">导入</button>
<pre id="result"></pre>
<script>
async function send() {
  const r = await fetch('/import', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({title: title.value, content: content.value})
  });
  result.textContent = await r.text();
}
</script>
</body></html>"""
            self.wfile.write(html.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/import":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")

        # 支持 JSON 和纯文本
        title = None
        content = body
        ct = self.headers.get("Content-Type", "")
        if "json" in ct:
            try:
                data = json.loads(body)
                content = data.get("content", data.get("text", body))
                title = data.get("title")
            except json.JSONDecodeError:
                pass

        if not content.strip():
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Empty content")
            return

        # 保存
        os.makedirs(BRIDGE_DIR, exist_ok=True)
        now = datetime.now()
        ts = now.strftime("%Y%m%d-%H%M%S")
        date_prefix = now.strftime("%Y-%m-%d")

        if title:
            filename = f"{date_prefix}-{title}.md"
        else:
            first_line = content.strip().split("\n")[0][:20]
            safe = "".join(c if c.isalnum() or c in " _-" else "_" for c in first_line).strip() or "元宝导入"
            filename = f"{date_prefix}-{safe}.md"

        filepath = os.path.join(BRIDGE_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"# {title or safe}\n\n")
            f.write(f"导入时间: {now.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"来源: HTTP 桥\n\n---\n\n{content}")

        msg = f"✅ 已导入: {filename} ({len(content)} 字符)"
        print(f"[{ts}] {msg}")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(msg.encode())

    def log_message(self, format, *args):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]} {args[1]} {args[2]}")

if __name__ == "__main__":
    os.makedirs(BRIDGE_DIR, exist_ok=True)
    server = http.server.HTTPServer(("0.0.0.0", PORT), BridgeHandler)
    print(f"🌉 元宝桥接服务启动: http://localhost:{PORT}")
    print(f"   导入目录: {BRIDGE_DIR}")
    print(f"   发送 POST 到 http://localhost:{PORT}/import")
    server.serve_forever()
