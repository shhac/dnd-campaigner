---
name: auto-journal
description: Background journaling for AI player characters after GM narrative. Load auto-journal/implementation for the two-step process (writing narrative file, spawning agents). Load auto-journal/when-to-invoke for MANDATORY trigger conditions and checkpoint rules.
autoLoad: false
---

> **⚠️ DEPRECATED** — This skill is superseded by self-journaling in `player-teammate.md` in Teams mode (`/play-team`).
> It remains functional for legacy `/play` sessions. Will be removed in Phase 3.

# Auto-Journal Skill

Automatically triggers character journaling after GM narrative returns. Runs in background without blocking story progression.

## Sub-Files

This skill is split into focused documents. Load what you need:

| File | Load When |
|------|-----------|
| `auto-journal/when-to-invoke` | You need to know WHEN to trigger journaling (checkpoint rules, detection guidance) |
| `auto-journal/implementation` | You need to know HOW to implement journaling (two-step process, agent spawning) |

## Quick Reference

**Invocation:**
```
Skill: auto-journal
Args: {campaign} {char1},{char2},{char3},{char4}
```

**Trigger:** After GM narrates results of an `[AWAIT_AI_PLAYERS]` cycle.

**Process:**
1. Write narrative file (foreground)
2. Spawn journal agents (background, parallel)
3. Continue immediately

## Related

- `play-orchestration` - Core game loop that invokes auto-journal
- `invoke-ai-players` - Handles the AI player action cycle that precedes journaling
