---
updated: 2026-06-23
visibility: private
---
# 2026-06-19 · GBrain 安装 + 视频 skill 调研

## Session Summary

### Skill Assessments

1.  **Proactive-agent skill** — assessed as low value relative to complexity; skipped.
2.  **Screenshot-to-code** — assessed as low value; skipped. Existing imgclippy + Claude workflow already solves this adequately.
3.  **微信公众号AI运营助手** — assessed as medium value; deferred. Potential future use but no immediate need.

### GBrain Installed & Configured

- Repository: `https://github.com/garrytan/gbrain`
- Clone location: `/tmp/gbrain`
- Dependencies: `bun install` completed (276 packages)
- Initialization: `gbrain init --pglite --no-embedding`
  - 114 migrations applied
  - Brain database at: `/Users/Admin/.gbrain/brain.pglite`
- Knowledge import: ~110 pages, 475 chunks ingested from `/Users/Admin/OpencodeWorkspace/知识库/`

### Skills Installed

All 9 recommended GBrain skills installed. Key ones for context:
- `gbrain_skill_4_mcp.md` — MCP server usage guide
- `gbrain_skill_3_tavily.md` — Tavily web search integration
- `gbrain_skill_2_cli.md` — Full GBrain CLI reference (query, read, context, search)

See `/tmp/gbrain/skills/` for the full list.

### MCP Server Configuration

Added to `/Users/Admin/.config/opencode/opencode.jsonc`:

```json
{
  "name": "gbrain",
  "description": "Personal knowledge graph via GBrain",
  "alwaysAllow": true,
  "command": "bun",
  "args": ["run", "/tmp/gbrain/src/cli.ts", "serve"]
}
```

**Important:** OpenCode must be restarted for the MCP server to connect. The GBrain tools (`gbr_search`, `gbr_read`, `gbr_query`, `gbr_context`) will not be available until restart.

### Verification

Tested with CLI search for "电力现货市场" — returned 4 results. Knowledge base ingestion and retrieval confirmed working.

### Next Steps

1.  Restart OpenCode to activate GBrain MCP tools.
2.  After restart, test video skill for sample output.
