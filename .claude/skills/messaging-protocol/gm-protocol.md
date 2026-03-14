# GM Protocol Reference

Messages the GM sends and receives. For conventions and quick reference, see `SKILL.md`.

## Messages GM Sends

### `[NARRATIVE]` — broadcast

Scene narration broadcast to all teammates. Free-form prose after the tag, no structured fields.

```
[NARRATIVE]

{Narrative prose with woven-in player actions and dialogue}
```

**Rules:**
- Do NOT include "What do you do?" — save action prompts for `[GM_TO_PLAYER]`
- Broadcasts are for scene awareness only
- **Split party:** Send as direct message to team lead (not broadcast) to prevent leaks. Send `[NARRATOR_NOTE]` separately for narrator coverage.
- **Party Activity Footer**: After narrative prose, append a `## Party Activity` section summarizing what each character did during this beat. Include:
  - Actions taken (with skill check results if any)
  - Inter-player dialogue (brief note, not full text)
  - Notable internal moments (ICE activations, journaling)
  - Current state if relevant (watching door, meditating, etc.)
  This is the human player's primary window into AI character actions.

### `[GM_TO_PLAYER]` — message to specific player

```
[GM_TO_PLAYER]
request_type: QUICK_REACTION | FULL_CONTEXT | COMBAT_ACTION | SECRET_ACTION | OPTIONAL_REACTION | REFLECTION | INTERACTION
scene_number: 005
scene_slug: the-warehouse-heist

## Scene
{THIS character's perspective only}

## Just Happened
{Trigger}

## Request
{What the GM needs}
```

**Request types:** QUICK_REACTION (1-2 sentences, vetoable), FULL_CONTEXT (full engagement), COMBAT_ACTION (combat turn), SECRET_ACTION (private opportunity), OPTIONAL_REACTION (skip-safe), REFLECTION (internal, not action), INTERACTION (talk to party via `[PLAYER_TO_PLAYER]`).

**Information isolation (CRITICAL):** Include ONLY what this character would know. Never include `story-state.md` content, other characters' secrets, or NPC hidden motivations.

**`## Dice` section (REQUIRED for FULL_CONTEXT and COMBAT_ACTION):**

Every `[GM_TO_PLAYER]` with `request_type: FULL_CONTEXT` or `COMBAT_ACTION` MUST include a `## Dice` section:

```
## Dice
- Roll Required: Persuasion (1d20+3)
```
OR
```
## Dice
- No Roll Needed: "information is freely available"
```

If this section is missing, players are instructed to flag it: "(Requesting [check] — should there be a roll here?)"

Player responds with `[PLAYER_TO_GM]`.

### `[ASK_PLAYER]` — message to team lead

Structured question for the human, routed through team lead. Fields: `question`, `header`, `options` (array of `{label, description}`). Team lead responds with `[PLAYER_ANSWER]`.

### `[SESSION_END]` — message to team lead

```
[SESSION_END]
summary: |
  {Session summary}
state_saved: true
next_hook: "Cliffhanger for next session."
```

### `[COMMAND_ACK]` — message to team lead

Acknowledge receipt of `[SESSION_COMMAND]`. **Must send immediately** before any other action. Fields: `command` (echo), `estimated_turns` (0-3, optional), `message` (optional status).

### `[NARRATOR_NOTE]` — message to narrator

Fields: `from: gm`, `note: "{emphasis or observable details}"`. Send when emphasizing a moment or responding to `[NARRATOR_REQUEST]` with non-secret details.

### `[NPC_SPAWN_REQUEST]` — message to team lead

Request dedicated NPC teammate. Fields: `npc`, `npc_file`, `reason`, `knowledge_boundary`, `scene_context`. Team lead responds with `[NPC_SPAWNED]`.

### `[NPC_DESPAWN_REQUEST]` — message to team lead

Shut down NPC teammate. Fields: `npc`, `reason` (optional). Team lead responds with `[NPC_DESPAWNED]`.

### `[PROTOCOL_WARNING]` — message to offending agent

Fields: `violation`, `expected`, `severity` (low/medium/high). Common violations: player responding to broadcast, malformed tags, OOC in IC messages, secret leakage.

---

## Messages GM Receives

### `[PLAYER_TO_GM]` — from player teammates

Fields: `type` (ACTION/REACTION/VETO), `character`. Free-form content follows.
- ACTION/REACTION: Weave into narrative, broadcast `[NARRATIVE]`
- VETO: Resend `[GM_TO_PLAYER]` with `request_type: FULL_CONTEXT`

### `[PLAYER_TO_PARTY]` — broadcast from player

In-character group speech. Received via broadcast. May incorporate into narrative or prompt specific characters.

### `[SESSION_COMMAND]` — from team lead

Fields: `command` (start/save/end), `reason` (optional). Start also includes: `campaign`, `player_character`, `narrative_style`, `ai_characters`.
- `start`: Read campaign files, send opening `[NARRATIVE]`
- `save`: Update `story-state.md` and `party-knowledge.md`
- `end`: Send `[COMMAND_ACK]` immediately, find stopping point, final save, send `[SESSION_END]`

### `[NARRATOR_REQUEST]` — from narrator

Fields: `to: gm`, `request`. Respond with `[NARRATOR_NOTE]` containing observable (non-secret) details only.

---

## Dice Roll Formatting

### Roll Requests (in `[GM_TO_PLAYER]`)

Append a `## Roll Required` block. DC is NOT sent to the player.

```
## Roll Required
- Check: Arcana
- Dice: 1d20+6
```

### Player Roll Results (in `[PLAYER_TO_GM]`)

Players append: `**Roll**: Arcana 1d20+6 = [14]+6 = 20`

### GM-Side Rolls (in `[NARRATIVE]`)

Format NPC/environmental rolls: `**NPC Attack Roll**: 1d20+5 = [14]+5 = 19 vs AC 15 -- Hit!`

### Player-Requested Rolls

Players may request rolls (e.g., `(Requesting Persuasion check)`). If uncertain and stakes exist, send follow-up `[GM_TO_PLAYER]` with `## Roll Required`.

---

## Verbosity Behavior

The GM receives a `verbosity` field in the `[SESSION_COMMAND] start` message. Adjust output accordingly:

- **quiet**: Shorter narrative broadcasts. Fewer environmental details. Focus on actions and dialogue.
- **normal** (default): Standard narrative richness. Full scene descriptions, NPC characterization.
- **verbose**: Include GM reasoning notes in `[NARRATOR_NOTE]` messages. More detailed scene-setting. Useful for debugging sessions.
