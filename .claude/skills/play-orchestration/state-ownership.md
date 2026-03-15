# State File Ownership

Campaign state files have **exclusive write ownership** to prevent concurrent write corruption. No two agents should ever write to the same file.

## Write Ownership Rules

| File | Owner | Other Agents |
|------|-------|-------------|
| `story-state.md` | GM | Read-only (GM only reads it too — players never access) |
| `party-knowledge.md` | GM | Read-only |
| `relationships.md` | GM | Read-only |
| `party/{character}-journal.md` | That character's player teammate | Read-only for others |
| `scenes/scene-*.md` | Narrator | Read-only for others |
| `preferences.md` | Team lead | Read-only during session |
| `decision-log.md` | Decision-log agent (post-session) | Read-only |

## Enforcement

- The **team lead never writes** to `story-state.md`, `party-knowledge.md`, or `relationships.md` — these are exclusively GM-owned
- Each **player teammate writes only** to their own journal file
- The **narrator writes only** to `scenes/` directory
- If two agents need to update the same file, that is a design error — flag it

## Recommended Write Pattern

When writing state files, agents should use an atomic write pattern to avoid partial writes on crash:

```
1. Write content to a temporary file: {filename}.tmp
2. Rename temp file to target: mv {filename}.tmp {filename}
```

Rename is atomic on POSIX systems, so readers will always see either the old complete file or the new complete file, never a partial write.
