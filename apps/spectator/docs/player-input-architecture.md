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

Called by the GM at every beat boundary (skipped in `full_auto` mode). Global (not per-character) since interrupts affect the whole session.

#### Current Design: Beat-Boundary Polling

The GM calls `check-interrupt` as the first step of each beat. This is simple and has no lifecycle management, but depends on the GM remembering to make the call.

#### Alternative Design: Background Watcher (Not Yet Implemented)

If the GM proves unreliable at calling `check-interrupt` (e.g., the way it forgot dice rolls for 3 consecutive playtests), we could switch to a persistent background watcher:

```bash
# GM starts this at session begin via Bash with run_in_background: true, timeout: 600000
bun apps/spectator/cli.ts watch-interrupt --campaign the-dimming
# Blocks until player.lock appears, then returns the interrupt JSON
# GM gets notified automatically when the background Bash completes
```

**Trade-offs:**
- Pro: GM doesn't need to remember to check — interrupts arrive automatically
- Pro: Slightly lower latency (interrupt delivered as soon as GM's current turn ends, vs waiting for next beat boundary)
- Con: Background task lifecycle management (restart after each interrupt, handle errors)
- Con: Teammate agents are single-threaded, so the GM still can't act on the interrupt until its current turn ends — effective latency is similar
- Con: Edge cases with multiple rapid interrupts while watcher is being restarted

**When to switch:** If playtesting shows the GM consistently skips `check-interrupt` calls (similar to the dice compliance problem), implement `watch-interrupt` as a long-lived background Bash call started at session begin.

### Lock File Protocol

#### Prompted Response
```
1. Player agent calls: bun apps/spectator/cli.ts ask-player --campaign the-dimming --character eamon-lightward --prompt "..."
2. CLI writes tmp/eamon-lightward-prompt.json (with deadline timestamp)
3. Spectator detects, pushes to browser
4. Browser shows prompt under Eamon's tab with countdown (15s less than actual deadline)
5. Human responds → POST /api/respond { character: "eamon-lightward", message: "..." }
6. Spectator writes tmp/eamon-lightward-response.json
7. CLI reads response, deletes both files, outputs JSON to stdout
8. Player agent parses JSON, sends response to GM as [PLAYER_TO_GM]
```

#### Interrupt (unprompted)
```
1. Human clicks Interrupt → POST /api/interrupt { message, character? }
2. Spectator writes tmp/player.lock + tmp/player-interrupt.json
3. GM calls check-interrupt CLI at next beat boundary → gets { interrupted: true, id, message, ... }
4. GM processes the interrupt, then calls clear-interrupt --id {id} → deletes files, applies mode changes
5. If a newer interrupt arrived between check and clear, clear-interrupt returns { cleared: false } — GM re-checks
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

- [x] CLI tool with `ask-player` and `check-interrupt` (`apps/spectator/cli.ts`)
- [x] API endpoints on spectator server (`apps/spectator/server.ts`)
- [x] Browser UI with prompt bar, interrupt, pause, mode toggle
- [x] Player agent integration (`ask_player` CLI call in player-teammate.md)
- [x] GM agent integration (`check_interrupt` CLI call at beat boundaries)
- [x] Deadline-based timestamps (CLI passes deadline, UI shows 15s less)
- [ ] End-to-end test with live session

### Historical Note

The original design used an MCP server (`mcp.ts` registered in `.mcp.json`). This was replaced with a CLI tool because MCP tools cannot be called by teammate agents in Claude Code Teams — see `mcp-teammate-limitation.md` for the full investigation.
