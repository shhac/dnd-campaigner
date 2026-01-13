---
name: invoke-ai-players
description: Orchestrates AI player agent spawning for D&D sessions. Use when the GM signals [AWAIT_AI_PLAYERS] or [JOURNAL_UPDATE] to spawn ai-player agents in action or journal mode. Handles file-based communication between GM and AI players.
---

# Invoke AI Players Skill

Orchestrates spawning of ai-player agents during D&D sessions. The GM agent cannot spawn subagents directly, so this skill guides the main conversation (orchestrator) through the process.

## When This Skill Activates

The GM agent outputs signals when it needs AI player input:

| Signal | Mode | Purpose |
|--------|------|---------|
| `[AWAIT_AI_PLAYERS: char1, char2]` | Action | Get character actions/responses |
| `[JOURNAL_UPDATE: char1, char2]` | Journal | Update character journals |

## Quick Reference

### Action Mode Flow

1. GM wrote context notes to `campaigns/{campaign}/tmp/gm-context.md` (for its own continuity)
2. GM wrote prompt files to `campaigns/{campaign}/tmp/{character}-prompt.md`
3. GM output `[AWAIT_AI_PLAYERS: tilda, grimjaw]`
4. **You spawn ai-player agents** (in parallel):
   ```
   Task: ai-player (for each character)
   Prompt: |
     Campaign: {campaign}
     Character: {character}
     Mode: action
   ```
5. AI players read prompts, write responses to `tmp/{character}-response.md`
6. Resume GM to continue (GM reads its context notes, then responses)

### Journal Mode Flow

1. GM wrote journal prompts to `campaigns/{campaign}/tmp/{character}-journal-prompt.md`
2. GM output `[JOURNAL_UPDATE: corwin, tilda, grimjaw]`
3. **You spawn ai-player agents** (in parallel):
   ```
   Task: ai-player (for each character)
   Prompt: |
     Campaign: {campaign}
     Character: {character}
     Mode: journal
   ```
4. AI players update their journals
5. Resume GM to continue

## Detailed Patterns

- For action mode details, see [action-mode.md](action-mode.md)
- For journal mode details, see [journal-mode.md](journal-mode.md)
- For file format specifications, see [file-formats.md](file-formats.md)

## Spawning AI Players

### Parallel Spawning

When multiple characters are listed, spawn ALL agents in a single message with multiple Task tool calls:

```
[AWAIT_AI_PLAYERS: tilda, grimjaw, seraphine]
```

Spawn three ai-player Tasks simultaneously - do NOT spawn sequentially.

### Task Parameters

```yaml
subagent_type: ai-player
prompt: |
  Campaign: the-rot-beneath
  Character: tilda
  Mode: action
```

The ai-player agent will:
1. Parse campaign, character, and mode from the prompt
2. Read appropriate files based on mode
3. Respond or update journal
4. Complete

### Resuming the GM

After all AI player agents complete, resume the GM:

```yaml
subagent_type: gm
prompt: |
  Continue the session for {campaign}.

  Mode: {action or journal} complete.
  Response files are ready in tmp/ (if action mode).

  Read responses if applicable, incorporate into narrative, and continue.
```

## Handling Vetoes

In action mode, an AI player may veto with `[VETO - reason]` in their response file.

When you resume the GM, it will:
1. Detect the veto in the response file
2. Write a new full-context prompt for that character
3. Signal `[AWAIT_AI_PLAYERS: {character}]` again

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
Spawn AI players (action mode)                      │
    │                                               │
    ▼                                               │
Resume GM                                           │
    │                                               │
    ▼                                               │
GM narrates outcome                                 │
    │                                               │
    ▼                                               │
[JOURNAL_UPDATE: ...] ◄──── Record memories         │
    │                                               │
    ▼                                               │
Spawn AI players (journal mode)                     │
    │                                               │
    ▼                                               │
Resume GM ─────────────────────────────────────────┘
    │
    ▼
Loop until session ends
```

## Error Handling

### Missing Prompt File

If an AI player can't find their prompt file, they should respond with an error message in the response file. The GM will handle recovery.

### Partial Completion

If some AI players complete but others fail, resume the GM anyway. The GM can check which response files exist and handle missing ones.

### Stale Files

The GM is responsible for cleaning up tmp/ files after incorporating responses. If stale files exist, the GM should delete them before writing new prompts.

## Important Notes

1. **Never pass campaign content through the orchestrator** - all context goes through files
2. **Always spawn in parallel** when multiple characters are listed
3. **Journal mode includes human player's character** - they get a journal too
4. **The GM handles all game logic** - you just orchestrate spawning
