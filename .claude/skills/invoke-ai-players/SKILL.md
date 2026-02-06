---
name: invoke-ai-players
description: Orchestrates AI player agent spawning for D&D sessions. Use when the GM signals [AWAIT_AI_PLAYERS] to spawn ai-player-action agents. Handles file-based communication between GM and AI players.
---

> **⚠️ DEPRECATED** — This skill is superseded by persistent player teammates in `team-play-orchestration` in Teams mode (`/play-team`).
> It remains functional for legacy `/play` sessions. Will be removed in Phase 3.

# Invoke AI Players Skill

Orchestrates spawning of ai-player-action agents during D&D sessions. The GM agent cannot spawn subagents directly, so this skill guides the main conversation (orchestrator) through the process.

**Note**: This skill handles ACTION mode only. Journaling is handled automatically by the `auto-journal` skill after GM narrative returns.

## When This Skill Activates

The GM agent outputs this signal when it needs AI player input:

| Signal | Purpose |
|--------|---------|
| `[AWAIT_AI_PLAYERS: char1, char2]` | Get character actions/responses |

## Quick Reference: Action Mode Flow

1. GM wrote context notes to `campaigns/{campaign}/tmp/gm-context.md` (for its own continuity)
2. GM wrote prompt files to `campaigns/{campaign}/tmp/{character}-prompt.md`
3. GM output `[AWAIT_AI_PLAYERS: tilda-brannock, grimjaw-ironforge]`
4. **You spawn ai-player-action agents** (in parallel):
   ```
   Task: ai-player-action (for each character)
   Prompt: |
     Campaign: {campaign}
     Character: {character}
     Scene: {scene_number} - {scene_slug}
   ```
5. AI players read prompts, write responses to `tmp/{character}-response.md`
6. AI players also write `tmp/{character}-notes-for-journal.md` (for later journaling)
7. Resume GM to continue (GM reads its context notes, then responses)

## Detailed Patterns

- For action mode details, see [action-mode.md](action-mode.md)
- For file format specifications, see [file-formats.md](file-formats.md)

## Spawning AI Players

### Parallel Spawning

When multiple characters are listed, spawn ALL agents in a single message with multiple Task tool calls:

```
[AWAIT_AI_PLAYERS: tilda-brannock, grimjaw-ironforge, seraphine-dawnwhisper]
```

Spawn three ai-player-action Tasks simultaneously - do NOT spawn sequentially.

**Character naming**: Always use full hyphenated names matching the character sheet filename (e.g., `tilda-brannock` not `tilda`).

### Task Parameters

```yaml
subagent_type: ai-player-action
prompt: |
  Campaign: the-rot-beneath
  Character: tilda-brannock
  Scene: 003 - first-contact
```

**Scene info**: The scene number and slug come from the GM's prompt files or can be determined from the `campaigns/{campaign}/scenes/` directory. The GM writes scene context to prompt files, and the orchestrator should include this in the Task prompt.

The ai-player-action agent will:
1. Parse campaign and character from the prompt
2. Read prompt file, character sheet, party-knowledge, own journal
3. Write response file (`tmp/{character}-response.md`)
4. Write notes for journal file (`tmp/{character}-notes-for-journal.md`)
5. Complete

### Spawning a Fresh GM

After all AI player agents complete, spawn a **fresh** GM agent (do NOT resume):

```yaml
subagent_type: gm
prompt: |
  Continue the session for {campaign}.

  **First**: Read your context notes from campaigns/{campaign}/tmp/gm-context.md
  to restore continuity from before the handoff.

  AI player responses are ready in tmp/.

  Read responses, incorporate into narrative, and continue.
```

### Weaving Parallel Responses

Because AI players respond in parallel without seeing each other's responses, the raw output can feel disjointed. **The GM has artistic license to weave parallel responses into coherent dialogue.**

When resuming the GM after AI player responses, the GM may:
- **Reorder dialogue** for natural conversational flow
- **Add reactions and interjections** between speakers
- **Have characters respond to each other** (even though written in parallel)
- **Merge overlapping descriptions** into unified narrative
- **Smooth transitions** between character moments

**What the GM must preserve:**
- The **substance** of each character's decision or action
- Key **dialogue content** (though phrasing may be adjusted for flow)
- **Character voice** and personality

The goal is a scene that reads naturally, not a sequence of isolated monologues.

**Why spawn fresh instead of resume?** The GM agent doesn't properly "complete" before yielding control - the "STOP" instruction is just prompt text, not an API-level mechanism. Resuming incomplete agents causes 400 errors. The architecture already supports fresh spawns via `gm-context.md`, which the GM writes before signaling.

## Handling Vetoes

In action mode, an AI player may veto with `[VETO - reason]` in their response file.

When you spawn a fresh GM, it will:
1. Read gm-context.md to restore continuity
2. Detect the veto in the response file
3. Write a new full-context prompt for that character
4. Signal `[AWAIT_AI_PLAYERS: {character}]` again

Just follow the normal flow - the GM handles veto logic.

## Session Loop

The full session follows this pattern:

```
/play {campaign}
    │
    ▼
Spawn GM ──────────────────────────────────────────┐
    │                                               │
    ▼                                               │
GM narrates, human acts                             │
    │                                               │
    ▼                                               │
[AWAIT_AI_PLAYERS: ...] ◄──── Action needed         │
    │                                               │
    ▼                                               │
Spawn AI players (ai-player-action)                 │
    │                                               │
    ▼                                               │
Spawn fresh GM (reads gm-context.md)                │
    │                                               │
    ▼                                               │
GM narrates outcome ────────────────────────────────┤
    │                                               │
    ├──→ auto-journal (background, fire-and-forget) │
    │    (journals all characters including human)  │
    │                                               │
    ▼                                               │
Continue session (don't wait for journals) ─────────┘
```

## Error Handling

### Missing Prompt File

If an AI player can't find their prompt file, they should respond with an error message in the response file. The GM will handle recovery.

### Partial Completion

If some AI players complete but others fail, resume the GM anyway. The GM can check which response files exist and handle missing ones.

### Stale Files

The GM is responsible for cleaning up tmp/ prompt and response files after incorporating responses. The GM does NOT clean up `*-notes-for-journal.md` files - those are handled by the auto-journal system.

## Important Notes

1. **Never pass campaign content through the orchestrator** - all context goes through files
2. **Always spawn in parallel** when multiple characters are listed
3. **Use ai-player-action agent** - NOT ai-player (which is deprecated)
4. **Journaling is automatic** - handled by auto-journal skill after GM returns narrative
5. **The GM handles all game logic** - you just orchestrate spawning
