# Player Protocol Reference

Messages player teammates send and receive. Applies to all player teammates (AI-controlled and human-controlled). For conventions and quick reference, see `SKILL.md`.

**Human input**: Human-controlled characters use the `ask_player` MCP tool to get human input. This is handled internally by the player agent — no protocol messages are needed for human relay.

## Messages Players Send

### `[PLAYER_TO_GM]` — message to GM

Action, reaction, or veto. Fields: `type` (ACTION/REACTION/VETO), `character`. Free-form content follows.

```
[PLAYER_TO_GM]
type: ACTION
character: tilda-brannock

Tilda's hand drops to her sword. "Easy there," she warns the stranger.
(Requesting Intimidation check if needed)
```

Veto example:
```
[PLAYER_TO_GM]
type: VETO
character: tilda-brannock

This touches my backstory. I need full context to respond properly.
```

- Send after receiving `[GM_TO_PLAYER]`
- VETO when a QUICK_REACTION request touches backstory or requires full context; GM will resend with FULL_CONTEXT

### `[PLAYER_TO_PLAYER]` — message to another player

In-character 1:1 dialogue. Fields: `from`, `to` (both full hyphenated names). Free-form IC content follows.

```
[PLAYER_TO_PLAYER]
from: tilda-brannock
to: grimjaw-ironforge

*whispers* "Watch the left flank. Something moved."
```

**In-character ONLY.** GM sees via peer DM visibility. Narrator captures for scene files.

### `[PLAYER_TO_PARTY]` — broadcast to all

In-character group-addressed dialogue. Fields: `from`. Free-form IC content follows.

```
[PLAYER_TO_PARTY]
from: korimeth-talyss

"We should rest before entering. I don't like how quiet this place is."
```

**In-character ONLY.** Use for speeches, warnings, proposals to the group. For private 1:1, use `[PLAYER_TO_PLAYER]`.

### `[ACTIVITY]` — message to team lead

Lightweight status ping. Fire-and-forget — no confirmation needed.

Fields: `character`, `doing` (brief phrase).

Send before notable actions:
- Before rolling dice (GM-requested or ICE)
- Before sending `[PLAYER_TO_PLAYER]` messages
- Before journaling

Do NOT send for: thinking, reading GM prompts, composing responses.
Max 1-2 pings per beat.

```
[ACTIVITY]
character: eamon-lightward
doing: rolling Arcana to examine the artifact
```

### `[NARRATOR_NOTE]` — message to narrator

Fields: `from` (character name), `note`. Send when you want a personal moment captured with emphasis.

---

## Messages Players Receive

### `[NARRATIVE]` (broadcast from GM)

Scene narration. Receive for **awareness only**.

**CRITICAL: Do NOT respond to `[NARRATIVE]` broadcasts.** Wait for your direct `[GM_TO_PLAYER]` prompt before sending `[PLAYER_TO_GM]`.

### `[GM_TO_PLAYER]` (message from GM)

Character-specific prompt. Key fields:
- `request_type`: QUICK_REACTION (1-2 sentences, vetoable), FULL_CONTEXT (full engagement), COMBAT_ACTION (combat turn), SECRET_ACTION (private), OPTIONAL_REACTION (skip-safe), REFLECTION (internal experience), INTERACTION (talk to party via `[PLAYER_TO_PLAYER]`)
- `scene_number`, `scene_slug`: For journaling reference

Respond with `[PLAYER_TO_GM]` sent directly to GM.

### `[CONTEXT_REFRESH]` (from team lead)

Post-compaction recovery. Fields: `campaign`, `current_scene`, `last_narrative_summary`. Re-read own character sheet, journal, and party-knowledge.md.

---

## Dice Result Formatting

When reporting rolls in `[PLAYER_TO_GM]`, append: `**Roll**: Arcana 1d20+6 = [14]+6 = 20`

You may request rolls — e.g., `(Requesting Persuasion check)`. GM sends follow-up `[GM_TO_PLAYER]` with `## Roll Required` if appropriate.

## Protocol Rules

- **Never respond to `[NARRATIVE]` broadcasts** — wait for `[GM_TO_PLAYER]`
- **In-character only** in `[PLAYER_TO_PLAYER]` and `[PLAYER_TO_PARTY]`
- **Veto format**: `type: VETO` in `[PLAYER_TO_GM]` when quick reaction is insufficient
- **ICE signaling**: Internal Conflict Engine rolls are invisible to other agents; only resulting behavior appears in `[PLAYER_TO_GM]`
