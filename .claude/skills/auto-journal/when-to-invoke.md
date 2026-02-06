---
name: auto-journal/when-to-invoke
description: Load this file to understand WHEN to trigger auto-journaling. Contains MANDATORY checkpoint rules and detection guidance for orchestrators. Required reading before any post-AI-action narrative handling.
---

> **⚠️ DEPRECATED** — This skill is superseded by self-journaling in `player-teammate.md` in Teams mode (`/play-team`).
> It remains functional for legacy `/play` sessions. Will be removed in Phase 3.

# When to Invoke Auto-Journal

This document describes WHEN to trigger auto-journaling. For HOW to implement it, see `auto-journal/implementation`.

## Mandatory Checkpoint: Post-AI-Action Journaling

**CRITICAL**: After the GM narrates the results of an `[AWAIT_AI_PLAYERS]` cycle, you MUST trigger auto-journal.

### Detection Rule

If you just spawned a fresh GM after AI players responded, and the GM returned narrative (not another signal), this is a journaling checkpoint.

### The Trigger Sequence

1. GM signals `[AWAIT_AI_PLAYERS: char1, char2]`
2. AI players respond with actions
3. GM resumes and narrates what happened
4. **Orchestrator triggers auto-journal** (background, do not wait)
5. Continue with player interaction

### Why This Is Mandatory

- AI player memories depend on journaling
- Decision log captures significant choices for context reconstruction
- State and knowledge deltas must be processed before they become stale
- Skipping this step causes memory loss and inconsistency

**Do NOT skip this step.**

## Invocation Format

```
Skill: auto-journal
Args: {campaign} {char1},{char2},{char3},{char4}
```

**Example:**
```
Skill: auto-journal
Args: the-rot-beneath tilda-brannock,brother-aldric,mira-thornwood,korvin-blackwood
```

## Who Gets Journaled

Include ALL party members in the character list:
- All AI-controlled characters
- The human player's character

The human player's character is treated identically to AI characters for journaling purposes.

## Quick Reference: Trigger Conditions

| Condition | Trigger Auto-Journal? |
|-----------|----------------------|
| GM returns narrative after AI action cycle | YES - MANDATORY |
| GM returns another `[AWAIT_AI_PLAYERS]` signal | NO - handle signal first |
| GM asks for human player input | NO - wait for player |
| Session ends or saves | Journal should have already run |
| Context compaction detected | Check if journaling was pending |

## Integration with Play Orchestration

The play-orchestration skill handles the full game loop. Auto-journal is triggered at specific points in that loop - see the flow diagram in play-orchestration for the complete picture.
