# State File Ownership

Campaign state files have **exclusive write ownership** to prevent concurrent write corruption. No two agents should ever write to the same file.

During play, `campaigns/{campaign}/` is **read-only** (design material). All mutable state lives in `{playthrough}/` (the active playthrough directory under `playthroughs/{campaign}/{game-name}/`).

## Write Ownership Rules

| File | Owner | Location |
|------|-------|----------|
| `{playthrough}/story-state.md` | GM | Playthrough (GM-only read/write) |
| `{playthrough}/party-knowledge.md` | GM | Playthrough (read by players) |
| `{playthrough}/relationships.md` | GM | Playthrough |
| `{playthrough}/faction-standings.md` | GM | Playthrough |
| `{playthrough}/party/{character}-journal.md` | That character's player teammate | Playthrough |
| `{playthrough}/party/{character}-relationships.md` | GM (at session end) | Playthrough |
| `{playthrough}/scenes/*.md` | Narrator | Playthrough |
| `{playthrough}/npcs/{npc}-interactions.md` | GM | Playthrough (NPC base stays in campaign) |
| `{playthrough}/tmp/dashboard.md` | GM | Playthrough |
| `{playthrough}/preferences.md` | Team lead | Playthrough (seeded from campaign) |
| `campaigns/{campaign}/party/*.md` | Read-only during play | Campaign (template) |
| `campaigns/{campaign}/npcs/*.md` | Read-only during play | Campaign (base definitions) |

## Enforcement

- The **team lead never writes** to `{playthrough}/story-state.md`, `{playthrough}/party-knowledge.md`, or `{playthrough}/relationships.md` — these are exclusively GM-owned
- Each **player teammate writes only** to their own journal file in `{playthrough}/party/`
- The **narrator writes only** to `{playthrough}/scenes/` directory
- Campaign files under `campaigns/{campaign}/` are **read-only** during play — no agent writes to them
- If two agents need to update the same file, that is a design error — flag it

## Recommended Write Pattern

When writing state files, agents should use an atomic write pattern to avoid partial writes on crash:

```
1. Write content to a temporary file: {filename}.tmp
2. Rename temp file to target: mv {filename}.tmp {filename}
```

Rename is atomic on POSIX systems, so readers will always see either the old complete file or the new complete file, never a partial write.
