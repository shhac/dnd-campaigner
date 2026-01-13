# Campaign Preferences: {Campaign Name}

> This file stores player preferences for a campaign.
> It is created during session setup (first `/play` or explicit configuration).
> The orchestration system reads this to customize the play experience.

---

## Narrative Style

**dialogue_format**: {script|novel|hybrid|minimal}

### Format Options

| Format | Description |
|--------|-------------|
| `script` | Structured with speaker labels, Unicode markers, easy to scan |
| `novel` | Prose-based, dialogue woven into narration, literary feel |
| `hybrid` | Balanced approach--clear speakers with flowing prose |
| `minimal` | Clean, less markup, streamlined presentation |

> See the `narrative-formatting` skill for full formatting examples.

---

## Player Character

**name**: {Character Name}
**file**: party/{character-filename}.md

> The human player's character. AI players are all other party members.

---

## Session Preferences

> Optional settings for session behavior. These may be extended over time.

**auto_save**: {true|false}

> Whether to auto-save state at natural breakpoints (combat end, scene transitions).

### Future Options

{Placeholder for additional session-level preferences as the system evolves}

- `combat_detail_level`: How verbose combat narration should be
- `rest_prompts`: Whether to prompt for long/short rests automatically
- `journal_frequency`: When AI players update their journals
