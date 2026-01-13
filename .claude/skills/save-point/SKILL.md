---
name: save-point
description: Manages session state persistence for D&D campaigns. Use when the GM needs to save game state. Defines mandatory save triggers, file update checklists, and ensures AI player memory continuity.
---

# Save Point Management

Ensures game state is persisted correctly so AI players maintain continuity between invocations.

## Why Save Points Matter

AI players are spawned as fresh Tasks with no memory. They rely on:
- `party-knowledge.md` for shared context
- Their personal journal for memories

**If you don't save, AI players won't know what happened.**

## Mandatory Save Triggers

You MUST save at these moments:

| Trigger | Why |
|---------|-----|
| End of combat | Record HP, resources spent, what happened |
| End of scene | When location changes or situation shifts significantly |
| Major discovery | When the party learns important information |
| After NPC conversations | When significant information is exchanged |
| Before rests | Capture state before healing |
| Player requests | "Let's save" should always work |
| End of session | Always, no exceptions |

## The Two State Files

### `story-state.md` (GM Only)

Contains GM secrets. AI players NEVER read this.

**Update with:**
- Current situation and quest progress
- Active threats and timelines
- NPC hidden motivations
- Upcoming planned events
- Party resources (HP, gold, spell slots)
- Session number and timestamp

### `party-knowledge.md` (Shared)

AI players READ this for context. Keep it current.

**Update with:**
- Current situation (party's perspective)
- Active quests and known objectives
- NPCs they've met and relationships
- Locations visited
- Facts the party has learned
- Recent session summary

## Quick Checklist

At each save point:

```
[ ] story-state.md updated
[ ] party-knowledge.md updated
[ ] Session log appended (if significant event)
```

## Detailed Procedures

- For complete save point checklist, see [checklist.md](checklist.md)
- For mid-session save protocol, see [mid-session.md](mid-session.md)
