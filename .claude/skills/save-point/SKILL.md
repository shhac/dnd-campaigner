---
name: save-point
description: Manages session state persistence for D&D campaigns. Use when the GM needs to save game state. Defines mandatory save triggers, file update checklists, and ensures AI player memory continuity.
---

# Save Point Management

Ensures game state is persisted correctly so players maintain continuity.

## Why Save Points Matter

Saved state serves multiple purposes depending on the play mode:

**Legacy mode (`/play`):** AI players are spawned as fresh Tasks with no memory. They rely on `party-knowledge.md` for shared context and their personal journal for memories. If you don't save, AI players won't know what happened.

**Teams mode (`/play-team`):** Persistent player teammates retain full session context, but saves are still critical for:
- Surviving context compaction (teammates re-read saved state to recover)
- Session resume (between play sessions, teammates start fresh)
- The narrator's scene files (durable record of what happened)
- Background delta writers that merge incremental updates

**In both modes:** `story-state.md` and `party-knowledge.md` are the canonical game state. Always keep them current.

## Automatic State Updates

State updates happen automatically when the GM writes delta files:
- **Teams mode**: GM sends `[STATE_UPDATED]` to the team lead after writing delta files. The team lead spawns background `state-delta-writer` and `knowledge-delta-writer` Tasks to merge changes.
- **Legacy mode**: The auto-journal flow triggers delta writers when the GM closes a narrative beat.

In both cases, background agents merge changes into `story-state.md` and `party-knowledge.md` without blocking play.

**Manual saves are still available** for situations where you need immediate updates or want to save outside the normal flow. The triggers below remain valid for manual intervention.

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
```

## Detailed Procedures

- For complete save point checklist, see [checklist.md](checklist.md)
- For mid-session save protocol, see [mid-session.md](mid-session.md)

## Related Skills

- **invoke-ai-players**: Handles `[AWAIT_AI_PLAYERS]` signals for AI player turn coordination (legacy mode)
- **team-play-orchestration**: Handles `[STATE_UPDATED]` messaging and background task spawning (Teams mode)
- **auto-journal**: Handles automatic journaling after GM narrative returns (legacy mode)
