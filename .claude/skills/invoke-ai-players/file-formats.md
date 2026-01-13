# File Formats

Specifications for files used in GM ↔ AI player communication.

## Directory Structure

```
campaigns/{campaign}/
├── tmp/                              # Temporary communication files
│   ├── {character}-prompt.md         # GM → AI player (action mode)
│   ├── {character}-response.md       # AI player → GM (action mode)
│   └── {character}-journal-prompt.md # GM → AI player (journal mode)
├── party/
│   ├── {character}.md                # Character sheet (read by AI player)
│   ├── {character}-journal.md        # Character journal (updated by AI player)
│   └── ...
├── party-knowledge.md                # Shared knowledge (read by AI player)
├── story-state.md                    # GM secrets (NEVER read by AI player)
└── ...
```

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

## Journal Mode Files

### Journal Prompt: `tmp/{character}-journal-prompt.md`

Written by GM before signaling `[JOURNAL_UPDATE]`.

```markdown
---
mode: journal
---

## Scene Before
[Context before the action]

## Your Action
[What this character did]

## What Happened
[Outcome as narrated by GM]

## Update Your Journal
Record this from your perspective. What did you learn? How do you feel?
```

### Character Journal: `party/{character}-journal.md`

Appended by AI player. Each entry:

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
1. GM creates tmp/{character}-prompt.md
2. GM signals [AWAIT_AI_PLAYERS: ...]
3. AI player reads prompt + character files
4. AI player creates tmp/{character}-response.md
5. GM reads response
6. GM deletes tmp/{character}-prompt.md and tmp/{character}-response.md
```

### Journal Mode

```
1. GM creates tmp/{character}-journal-prompt.md
2. GM signals [JOURNAL_UPDATE: ...]
3. AI player reads journal prompt
4. AI player appends to party/{character}-journal.md
5. GM deletes tmp/{character}-journal-prompt.md
```

## Cleanup Rules

The GM is responsible for cleanup:

- **After incorporating action responses:** Delete prompt and response files
- **After journal updates complete:** Delete journal prompt files
- **Before writing new prompts:** Check for and delete any stale files
- **At session end:** Ensure tmp/ is empty

## Character Name Normalization

File names use lowercase character names:

| Character Name | File Name |
|----------------|-----------|
| Tilda | `tilda-prompt.md` |
| Grimjaw | `grimjaw-prompt.md` |
| Corwin the Bold | `corwin-prompt.md` (first name only) |

The GM and AI players must use consistent naming.

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
