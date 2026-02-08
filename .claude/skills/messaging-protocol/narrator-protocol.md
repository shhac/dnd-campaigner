# Narrator Protocol Reference

Messages the narrator observes and handles during Teams-based D&D sessions. For protocol conventions and the full quick reference table, see `SKILL.md`.

---

## Messages Narrator Observes

### `[NARRATIVE]` (broadcast)

Scene narration from the GM. **Primary source material** for scene files.

- **Sender**: GM
- **Transport**: broadcast (narrator receives as observer)

Capture the full narrative prose to the current scene file. The GM includes woven-in player actions and dialogue.

**Split party note:** During split parties, the GM may send `[NARRATIVE]` as direct messages to the team lead (not broadcast). The GM will send separate `[NARRATOR_NOTE]` messages so you can capture both threads.

---

### `[PLAYER_TO_PLAYER]`

In-character dialogue between player teammates.

- **Sender**: Player teammate
- **Transport**: message (narrator sees via peer DM visibility)

Capture dialogue exchanges into the scene file. Include tone/stage direction from the messages.

---

### `[PLAYER_TO_PARTY]` (broadcast)

In-character dialogue addressed to the entire party.

- **Sender**: Player teammate
- **Transport**: broadcast (narrator receives as observer)

Capture group-directed speeches, warnings, and proposals into the scene file.

---

### `[NARRATOR_NOTE]`

Emphasis request or supplementary scene information.

- **Sender**: GM or any player teammate
- **Transport**: `SendMessage` with `type: message` (direct to narrator)

```
[NARRATOR_NOTE]
from: gm
note: "Emphasize the emotional weight of this reunion scene."
```

Incorporate emphasis into scene prose naturally. Do not reproduce the note verbatim.

---

## Messages Narrator Sends

### `[NARRATOR_REQUEST]`

Request missing information from the GM.

- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`

```
[NARRATOR_REQUEST]
to: gm
request: "Gap in warehouse scene — what happened between tripwire and combat?"
```

**When to send:** When you detect a gap in the narrative (e.g., after context compaction, or when peer DM summaries were insufficient).

**Expected response:** GM sends `[NARRATOR_NOTE]` with observable details.

---

## What to IGNORE

The narrator should **not** incorporate content from these message types into scene files:

- **`[GM_TO_PLAYER]`** — Character-specific prompts contain GM instructions, request types, and mechanical details not suited for prose. The *results* of these prompts appear in `[PLAYER_TO_GM]` responses and subsequent `[NARRATIVE]` broadcasts.
- **`[PLAYER_TO_GM]`** — Player action declarations to the GM. The GM weaves these into `[NARRATIVE]` broadcasts. Capturing raw `[PLAYER_TO_GM]` would duplicate content.
- **`[SESSION_COMMAND]`**, **`[COMMAND_ACK]`**, **`[SESSION_END]`** — Session control messages, not narrative content.
- **`[RELAY_TO_HUMAN]`**, **`[HUMAN_DECISION]`** — Human I/O routing, not narrative content.
- **`[NPC_SPAWN_REQUEST]`**, **`[NPC_SPAWNED]`**, **`[NPC_DESPAWN_REQUEST]`**, **`[NPC_DESPAWNED]`** — Infrastructure messages.
- **`[PROTOCOL_WARNING]`** — Error correction, not narrative content.
- **`[DICE_RESULT]`**, **`[PLAYER_ANSWER]`** — Mechanical results; dice outcomes appear in `[NARRATIVE]` when the GM narrates them.

---

## Scene File Conventions

- Scene files are numbered sequentially in `scenes/`
- Write in **present tense** (literary present)
- Include only externally observable behavior — no character internal thoughts, no secret information
- Dice rolls are NOT included in scene files (they appear in broadcasts for player awareness but are mechanical, not narrative)
- The narrator's role is faithful recording with light polish, not literary reinvention
