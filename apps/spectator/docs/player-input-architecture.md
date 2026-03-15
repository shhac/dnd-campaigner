# Player Input via Spectator Web App

## Overview

The spectator web app doubles as a player input channel. Instead of typing in the Claude Code terminal, humans can respond to GM prompts, interrupt the session, pause, and toggle AI control — all from the browser.

## Validated Assumptions

- **MCP timeout**: 300 seconds (5 minutes) confirmed with no timeout. Claude Code does not kill long-running MCP tool calls. Blocking pattern is viable.
- **MCP availability**: Stdio MCP servers are spawned by Claude Code at session start. Always available, no manual boot needed.
- **Teammate access**: ⚠️ Teammate agents CANNOT use MCP tools — see `mcp-teammate-limitation.md`. MCP calls from teammates hit a team-lead approval gate that has no approval mechanism.

## Architecture

### MCP Server as Universal Router

The `spectator-input` MCP server (registered in `.mcp.json`) auto-detects the best input channel per-call:

```
ask_player({ campaign, character, prompt, options })
  │
  ├─ Session paused? (player.pause exists)
  │   └─ YES → block until pause lifted, then continue
  │
  ├─ Spectator running? (HTTP check localhost:3333)
  │   └─ YES → push prompt to browser, block for response (with countdown)
  │            return { mode: "web", response: "..." }
  │            OR timeout → return { mode: "ai_takeover" }
  │
  ├─ Character in full-auto? ({character}.auto exists)
  │   └─ YES → return { mode: "full_auto" }
  │
  └─ Neither → return { mode: "terminal" }
```

One tool, one code path. The calling agent branches on the response mode.

### Components

```
┌──────────────┐     WebSocket      ┌──────────────┐
│  Browser UI  │ ◄────────────────► │  Spectator   │
│  (humans)    │                    │  Server      │
│              │                    │  :3333       │
│  Per-char    │                    └──────┬───────┘
│  prompt tabs │     POST /api/*           │ writes/reads
│  Interrupt   │ ──────────────────►       │ lock files
│  Pause/Mode  │                    ┌──────▼───────┐
└──────────────┘                    │  tmp/        │
                                    │  {char}-prompt.json│
                                    │  {char}-response.json│
                                    │  player.lock │
                                    │  player.pause│
                                    │  {char}.auto │
                                    └──────▲───────┘
                                           │
                                    ┌──────┴───────┐
                                    │  MCP Server  │
                                    │  (stdio,     │
                                    │   spawned by │
                                    │   Claude)    │
                                    └──────▲───────┘
                                           │ tool call
                                    ┌──────┴───────┐
                                    │  Player      │
                                    │  Agent       │
                                    │  (any)       │
                                    └──────────────┘
```

### Who Calls the MCP Tool

**The player agent itself** calls `ask_player` — not the team lead or orchestrator. From the GM's perspective, every player agent is identical: it sends a prompt, gets a response. The difference is internal to the player agent:

- **AI player**: receives `[GM_TO_PLAYER]`, thinks, responds autonomously
- **Human player**: receives `[GM_TO_PLAYER]`, calls `ask_player` MCP, gets human input, responds

This means:
- Any character can be toggled between human and AI control mid-session
- Multiple humans can each control different characters (multiplayer)
- The GM doesn't know or care which players are human

### MCP Tools

#### `ask_player`

```
Input:  { campaign, character, prompt, options?, timeout_seconds? }
Output: { mode: "web", response: string }
      | { mode: "ai_takeover" }      ← timeout, AI acts this turn only
      | { mode: "full_auto" }        ← character is AI-controlled
      | { mode: "terminal" }         ← no spectator, use AskUserQuestion
```

Per-character lock files: `{character}-prompt.json`, `{character}-response.json`, `{character}.auto`

#### `check_interrupt`

```
Input:  { campaign }
Output: { interrupted: false }
      | { interrupted: true, message, mode_change?, character? }
```

Called at every beat boundary regardless of mode. Global (not per-character) since interrupts affect the whole session.

### Lock File Protocol

#### Prompted Response
```
1. Player agent calls ask_player({ campaign, character: "eamon-lightward", prompt: "..." })
2. MCP writes tmp/eamon-lightward-prompt.json
3. Spectator detects, pushes to browser
4. Browser shows prompt under Eamon's tab with countdown
5. Human responds → POST /api/respond { character: "eamon-lightward", message: "..." }
6. Spectator writes tmp/eamon-lightward-response.json
7. MCP reads response, deletes both files, returns to player agent
8. Player agent sends response to GM as [PLAYER_TO_GM]
```

#### Interrupt (unprompted)
```
1. Human clicks Interrupt → POST /api/interrupt { message, character? }
2. Spectator writes tmp/player.lock + tmp/player-interrupt.json
3. GM calls check_interrupt() at next beat boundary
4. MCP reads + deletes, returns content
```

#### Per-Character Mode Toggle
```
1. Human toggles Eamon to Full Auto → POST /api/mode { character: "eamon-lightward", mode: "full_auto" }
2. Creates tmp/eamon-lightward.auto
3. Next ask_player for Eamon → returns { mode: "full_auto" } immediately
4. Player agent acts autonomously
```

### Multiplayer Support

The per-character design naturally supports multiple human players:

| Scenario | Configuration |
|----------|--------------|
| Solo (1 human, 3 AI) | One character has no `.auto` flag |
| Duo (2 humans, 2 AI) | Two characters have no `.auto` flag |
| Full party (4 humans) | No `.auto` flags |
| Spectator only | All characters have `.auto` flags |
| Hot-swap | Toggle `.auto` per character mid-session |

The browser UI shows prompt tabs for each human-controlled character. Multiple browser tabs/windows could each claim a different character.

### Browser UI

```
┌─────────────────────────────────────────────────────────┐
│  ◆ The Dimming — Spectator                       [Live] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Play Script content...]                               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Eamon ●] [Silani] [Korimeth] [Thaneshi]    ⏱ 2:43    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ GM: "What do you do about the artifact?"        │    │
│  │ [________________________________] [Send] [Skip]│    │
│  └─────────────────────────────────────────────────┘    │
│  [Interrupt]  [Pause]  [Eamon: Human ▾]                 │
└─────────────────────────────────────────────────────────┘
```

- **Character tabs**: one per human-controlled character, dot = prompt waiting
- **Prompt area**: shows the active character's prompt with countdown
- **Mode dropdown per character**: Human / Full Auto

### Spectator Server API

```
GET  /api/health                    → { ok, session, campaign, characters, isPaused }
GET  /api/prompt?character=X        → character's pending prompt or null
POST /api/respond                   → { character, message, skip? }
POST /api/interrupt                 → { message, mode_change?, character? }
POST /api/pause / DELETE /api/pause → toggle session pause
POST /api/mode                      → { character, mode: "human"|"full_auto" }
```

### Implementation Status

- [x] MCP timeout validated (300s clean)
- [x] MCP server with `ask_player` and `check_interrupt` (`apps/spectator/mcp.ts`)
- [x] API endpoints on spectator server (`apps/spectator/server.ts`)
- [x] Browser UI with prompt bar, interrupt, pause, mode toggle
- [x] Registered in `.mcp.json` (project scope)
- [ ] Per-character prompt/response files (Phase 2)
- [ ] Character tabs in browser UI (Phase 2)
- [ ] Player agent integration (`ask_player` call in player-teammate.md)
- [ ] GM agent integration (`check_interrupt` call at beat boundaries)
- [ ] End-to-end test with live session
