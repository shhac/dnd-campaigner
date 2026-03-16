---
name: save-point
description: Manages session state persistence for D&D campaigns. Use when the GM needs to save game state. Defines mandatory save triggers, file update checklists, and ensures AI player memory continuity.
---

# Save Point Management

Ensures game state is persisted correctly so players maintain continuity.

## Why Save Points Matter

Persistent player teammates retain full session context, but saves are still critical for:
- Surviving context compaction (teammates re-read saved state to recover)
- Session resume (between play sessions, teammates start fresh)
- The narrator's scene files (durable record of what happened)

`{playthrough}/story-state.md` and `{playthrough}/party-knowledge.md` are the canonical game state. Always keep them current.

## How State Updates Work

The GM updates `{playthrough}/story-state.md` and `{playthrough}/party-knowledge.md` directly after each scene closes (or when meaningful state changes accumulate). No intermediate delta files or background agents are needed — the GM writes to the canonical files as part of the normal play loop.

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

### `{playthrough}/story-state.md` (GM Only)

Contains GM secrets. AI players NEVER read this.

**Update with:**
- Current situation and quest progress
- Active threats and timelines
- NPC hidden motivations
- Upcoming planned events
- Party resources (HP, gold, spell slots)
- Session number and timestamp

### `{playthrough}/party-knowledge.md` (Shared)

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
[ ] {playthrough}/story-state.md updated
[ ] {playthrough}/party-knowledge.md updated
[ ] {playthrough}/relationships.md updated (if social dynamics changed)
[ ] Write NPC interaction updates to {playthrough}/npcs/{npc}-interactions.md (NOT the campaign NPC file)
[ ] Update {playthrough}/faction-standings.md if any faction-relevant decisions were made
[ ] Update {playthrough}/tmp/dashboard.md with current scene, party status, quest progress
```

At session end (in addition to above):

```
[ ] Update each character's `{playthrough}/party/{character}-relationships.md` based on significant interactions this session. Adjust trust scores and add key moments.
```

## Detailed Procedures

- For complete save point checklist, see [checklist.md](checklist.md)
- For mid-session save protocol, see [mid-session.md](mid-session.md)

## Related Skills

- **play-orchestration**: Core session loop and lifecycle management
