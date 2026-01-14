# File Formats

Specifications for files used in GM ↔ AI player communication.

## Directory Structure

```
campaigns/{campaign}/
├── tmp/                              # Temporary communication files
│   ├── gm-context.md                 # GM's own notes for continuity across handoffs
│   ├── {character}-prompt.md         # GM → AI player (action mode)
│   ├── {character}-response.md       # AI player → GM (action mode)
│   ├── narrative-for-journal.md      # Shared narrative for auto-journal
│   └── {character}-notes-for-journal.md # Character's action notes for journaling
├── party/
│   ├── {character}.md                # Character sheet (read by AI player)
│   ├── {character}-journal.md        # Character journal (updated by AI player)
│   └── ...
├── party-knowledge.md                # Shared knowledge (read by AI player)
├── story-state.md                    # GM secrets (NEVER read by AI player)
└── ...
```

## GM Context Notes

### Context File: `tmp/gm-context.md`

Written by GM before signaling, read when resumed. Provides continuity across AI player handoffs.

```markdown
## Expecting
[What the GM hopes/expects from AI player responses]

## Contingencies
- If veto: [planned response]
- If they agree: [next beat]
- If combat starts: [approach]

## NPC Reactions
[How NPCs will react to various outcomes]

## Scene Direction
[Where the scene is heading, tone notes]
```

Keep it brief (5-10 lines max). This is a scratch pad, not a detailed plan.

**Lifecycle:**
1. GM writes `tmp/gm-context.md` BEFORE signaling `[AWAIT_AI_PLAYERS]`
2. GM reads it when resumed after AI players complete
3. GM deletes it after incorporating (or updates it before next signal)

## Action Mode Files

### Prompt File: `tmp/{character}-prompt.md`

Written by GM before signaling `[AWAIT_AI_PLAYERS]`.

```markdown
---
request_type: QUICK_REACTION | COMBAT_ACTION | FULL_CONTEXT | SECRET_ACTION
---

## Scene
[Current situation from character's perspective]

## Just Happened
[What triggered this request]

## Request
[What the GM needs - be specific about expected response format]
```

**Request types:**
- `QUICK_REACTION` - Brief 1-2 sentence response expected
- `COMBAT_ACTION` - Combat turn declaration
- `FULL_CONTEXT` - Full response after a veto
- `SECRET_ACTION` - Private action opportunity

### Response File: `tmp/{character}-response.md`

Written by AI player after reading prompt.

**Normal response:**
```markdown
[In-character action, dialogue, or decision]

(Optional: mechanical notes in parentheses)
```

**Veto response:**
```markdown
[VETO - need more input]

[Reason why more context is needed - reference character sheet elements]
```

## Auto-Journal Files

Journaling happens automatically in the background after GM narrative returns. See the `auto-journal` skill for orchestration details.

### Narrative File: `tmp/narrative-for-journal.md`

Written by orchestrator before spawning journal agents. Contains the scene description all characters just experienced.

```markdown
[The GM's narrative for this scene - what all characters witnessed]
```

**Lifecycle:**
- Overwritten each time auto-journal is triggered
- Read by all journal agents spawned for that cycle
- Not deleted (overwritten on next cycle)

### Action Notes: `tmp/{character}-notes-for-journal.md`

Written by AI player action agent during their turn. Contains first-person notes about what the character did and their internal thoughts.

```markdown
[Character's internal notes about their actions and thoughts during this scene]
```

**Lifecycle:**
- Written by action agent during `[AWAIT_AI_PLAYERS]` cycle
- Read and deleted by journal agent when processing
- If missing, journal agent uses only the shared narrative

### Character Journal: `party/{character}-journal.md`

Appended by journal agent. Each entry:

```markdown
---

### [Event/Scene Title]

- What happened: [Summary]
- What I did: [Actions taken]
- What I learned: [New information]
- How I feel: [Emotional response]
- Notes: [Observations]
```

## File Lifecycle

### Action Mode

```
1. GM creates tmp/gm-context.md (own continuity notes)
2. GM creates tmp/{character}-prompt.md
3. GM signals [AWAIT_AI_PLAYERS: ...]
4. AI player reads prompt + character files
5. AI player creates tmp/{character}-response.md
6. GM reads tmp/gm-context.md to recall plans
7. GM reads response files
8. GM deletes tmp/gm-context.md, tmp/{character}-prompt.md, and tmp/{character}-response.md
```

### Auto-Journal Mode

```
1. Orchestrator writes tmp/narrative-for-journal.md (shared narrative)
2. Orchestrator spawns ai-player-journal agents in background for each character
3. Each journal agent reads narrative + their action notes (if exists)
4. Each journal agent appends to party/{character}-journal.md
5. Each journal agent deletes their tmp/{character}-notes-for-journal.md (if it existed)
```

## Cleanup Rules

The GM is responsible for action mode cleanup:

- **After incorporating action responses:** Delete `gm-context.md`, prompt files, and response files
- **Before writing new prompts:** Check for and delete any stale files
- **At session end:** Ensure tmp/ is empty (except `narrative-for-journal.md` which is overwritten each cycle)

Auto-journal cleanup is handled by the journal agents themselves:
- Each journal agent deletes its own `{character}-notes-for-journal.md` after processing
- `narrative-for-journal.md` is overwritten each cycle (not deleted)

## Character Name Convention

**CRITICAL**: Character names use the **full hyphenated format** matching the character sheet filename.

| Character Sheet | Signal Name | File Names |
|-----------------|-------------|------------|
| `party/tilda-brannock.md` | `tilda-brannock` | `tilda-brannock-prompt.md`, `tilda-brannock-response.md` |
| `party/gideon-harrowmoor.md` | `gideon-harrowmoor` | `gideon-harrowmoor-prompt.md`, `gideon-harrowmoor-response.md` |
| `party/seraphine-dawnwhisper.md` | `seraphine-dawnwhisper` | `seraphine-dawnwhisper-prompt.md`, `seraphine-dawnwhisper-response.md` |

**Rules:**
- Always lowercase
- Always hyphenated (no spaces)
- Always full name (not just first name)
- Must match the character sheet filename (minus `.md` extension)
- Remove apostrophes and special characters

**Edge case examples:**
| Character Name | File Name |
|----------------|-----------|
| Sir Edmund the Bold | `sir-edmund-the-bold-prompt.md` |
| O'Brien | `obrien-prompt.md` |

The GM and AI players must use consistent naming throughout.

## Error Handling

### Missing Prompt File

If AI player can't find prompt file:
```markdown
[ERROR: Prompt file not found]

Expected: campaigns/{campaign}/tmp/{character}-prompt.md
```

### Malformed Prompt

If prompt file lacks required sections:
```markdown
[ERROR: Malformed prompt]

Missing required section: {section name}
```

The GM will handle recovery when resumed.
