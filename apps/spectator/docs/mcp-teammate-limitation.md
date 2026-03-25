# MCP Tools in Claude Code Teams: Permission Limitation

**Discovered**: 2026-03-15 during playtest of The Dimming campaign

## Summary

MCP tools registered in `.mcp.json` **cannot be used by teammate agents** due to a permission gap in the Claude Code Teams platform.

## What Happens

1. A teammate agent (e.g., GM, player) calls an MCP tool (e.g., `mcp__spectator-input__check_interrupt`)
2. The tool schema resolves successfully — the tool is discoverable and callable
3. A permission prompt appears **in the teammate's terminal panel**, labeled "Waiting for team lead approval"
4. The team lead agent **never receives this permission request** — there is no inbox message, no callback, no mechanism to approve
5. The human user sees the prompt in the teammate's panel but can only **cancel** (not approve)
6. On cancellation, the teammate receives: *"The user doesn't want to proceed with this tool use. The tool use was rejected. STOP what you are doing and wait for the user to tell you how to proceed."*
7. The teammate **freezes** — it obeys the "STOP" instruction and will not continue until it receives a new message

## What We Tested

| Test | Mode | Result |
|------|------|--------|
| GM agent calling `check_interrupt` during playtest | default | Frozen after user cancelled permission prompt |
| Dedicated test agent calling `check_interrupt` | default | Same — permission prompt in teammate panel, user cancelled, agent frozen |
| Dedicated test agent calling `check_interrupt` | `bypassPermissions` | **Same result** — `bypassPermissions` does not bypass the team lead approval gate for MCP tools |

## Key Details

- The permission gate is specifically a **team lead approval** gate, not a user permission gate
- `bypassPermissions` mode on the agent does not help — it bypasses user tool permissions but not team lead MCP approval
- The frozen agent **can be unblocked** by sending it a message (e.g., a shutdown request or instructions to continue without the MCP tool)
- The MCP server itself is never reached — the block happens before the tool call executes

## Impact on Player Input Architecture

The `ask_player` and `check_interrupt` MCP tools were designed to be called directly by teammate agents (player agents call `ask_player`, GM calls `check_interrupt`). This architecture does not work under the current platform behavior.

### What Still Works

- MCP tools called from the **main Claude Code session** (team lead) work fine — the user gets a normal permission prompt they can approve
- The spectator web app's viewer functionality (reading JSONL transcripts, WebSocket streaming) is unaffected
- The spectator server API endpoints work independently of MCP

### Workaround: Pre-allow MCP Tools in Project Permissions

**Discovered**: 2026-03-25

Adding the MCP tool to `permissions.allow` in `.claude/settings.local.json` lets teammates call it without triggering the approval gate. The tool executes directly, no prompt appears.

```json
{
  "permissions": {
    "allow": [
      "mcp__ping-pong__ping",
      "mcp__spectator-input__check_interrupt",
      "mcp__spectator-input__ask_player"
    ]
  }
}
```

This was verified with a dedicated ping-pong MCP test server (`test-mcp/`):
- **Without permission**: Teammate hits "Waiting for team lead approval" — deadlock (bug reproduced)
- **With permission in settings.local.json**: Teammate calls MCP tool successfully, no approval prompt

### Other Workarounds

1. **Team lead as MCP proxy**: Teammate agents send structured messages to the team lead requesting player input. The team lead calls the MCP tool (which it can do) and relays the response back. Adds latency but works within the platform.

2. **File-based polling without MCP**: Agents use the `Read` tool directly to check for lock files in `tmp/`. No blocking, but agents can poll at beat boundaries. The spectator server still manages the files via its HTTP API.

3. **Wait for platform fix**: Report the issue to the Claude Code team. The expected behavior would be: MCP tool permission requests from teammates are delivered to the team lead's inbox (like plan approval requests), and the team lead can approve/reject programmatically.

## Known Issues on GitHub

This is a **known, unresolved platform issue** with multiple reports:

- [#25254](https://github.com/anthropics/claude-code/issues/25254) — "Team agents' messages not delivered to team lead in VS Code extension; permission prompts invisible, causing agent deadlock." Closed as duplicate of #23874 (VS Code specific), but the permission prompt issue also affects the terminal CLI for MCP tools.
- [#13254](https://github.com/anthropics/claude-code/issues/13254) — "Background subagents cannot access MCP tools." Long-standing issue (Dec 2025–Mar 2026) confirmed across many versions (2.0.60–2.1.19+). Closed for inactivity, not resolution. Community requested reopen.
- [#24073](https://github.com/anthropics/claude-code/issues/24073) — "Teammates spawned in Delegate Mode lose tool access despite mode: bypassPermissions."
- [#26479](https://github.com/anthropics/claude-code/issues/26479) — "Agent Teams teammates ignore bypassPermissions for Bash and don't inherit project settings.local.json."

The core problem — **MCP tools don't work reliably from subagents/teammates** — has been reported in various forms since December 2025 and remains unresolved as of March 2026.

## Related Files

- `apps/spectator/mcp.ts` — MCP server implementation
- `.mcp.json` — MCP server registration
- `apps/spectator/docs/player-input-architecture.md` — Full architecture (line 11 incorrectly states teammates have MCP access)
- `.claude/agents/gm.md` — References `check_interrupt` at beat boundaries
- `.claude/agents/player-teammate.md` — References `ask_player` for human input
