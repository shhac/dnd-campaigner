---
name: messaging-protocol
description: Canonical reference for the structured message protocol used by all Teams-based D&D agents. Defines every message tag, its sender/recipient, payload format, and routing rules. Referenced by GM, players, narrator, and team lead.
---

# Messaging Protocol

Canonical reference for all structured message types used in Teams-based D&D sessions. All teammate communication uses structured YAML-like tags in `SendMessage` content.

**This skill is the single source of truth.** All agents reference this skill for message format and routing rules.

## Protocol Conventions

- Tags appear on the **first line** of message content (e.g., `[NARRATIVE]`)
- Payload fields use **YAML-like** `key: value` syntax after the tag line
- Multi-line values use YAML block scalar syntax (`|`)
- Recipients parse the first line to determine message type
- Unrecognized tags should be treated as informal communication

---

## Quick Reference Table

| Tag | Sender | Recipient | Transport | Phase |
|-----|--------|-----------|-----------|-------|
| [`[NARRATIVE]`](#narrative) | GM | All (broadcast) | broadcast | 1+ |
| [`[GM_TO_PLAYER]`](#gm_to_player) | GM | Specific player | message (Phase 2) / Task prompt (Phase 1) | 1+ |
| [`[ASK_PLAYER]`](#ask_player) | GM | Team lead | message | 1+ |
| [`[STATE_UPDATED]`](#state_updated) | GM | Team lead | message | 1+ |
| [`[SESSION_END]`](#session_end) | GM | Team lead | message | 1+ |
| [`[NARRATOR_NOTE]`](#narrator_note) | GM or Player | Narrator | message | 1+ |
| [`[AWAIT_PLAYERS]`](#await_players) | GM | Team lead | message | **1 only** |
| [`[PLAYER_ACTION]`](#player_action) | Team lead | GM | message | 1+ |
| [`[DICE_RESULT]`](#dice_result) | Team lead | GM | message | 1+ |
| [`[PLAYER_ANSWER]`](#player_answer) | Team lead | GM | message | 1+ |
| [`[PLAYER_RESPONSES]`](#player_responses) | Team lead | GM | message | **1 only** |
| [`[SESSION_COMMAND]`](#session_command) | Team lead | GM | message | 1+ |
| [`[CONTEXT_REFRESH]`](#context_refresh) | Team lead | Any teammate | message | 1+ |
| [`[HUMAN_DECISION]`](#human_decision) | Team lead | Human's player teammate | message | **2+** |
| [`[MODE_SWITCH]`](#mode_switch) | Team lead | Human's player teammate | message | **2+** |
| [`[PLAYER_TO_GM]`](#player_to_gm) | Player teammate | GM | message | **2+** |
| [`[PLAYER_TO_PLAYER]`](#player_to_player) | Player teammate | Player teammate | message | **2+** |
| [`[RELAY_TO_HUMAN]`](#relay_to_human) | Human's player teammate | Team lead | message | **2+** |
| [`[NARRATOR_REQUEST]`](#narrator_request) | Narrator | GM | message | 1+ |
| [`[JOURNAL_CHECKPOINT]`](#journal_checkpoint) | Team lead | Player teammates | message | **2+** |

---

## Phase 1 Messages (Foundation)

These messages are available from Phase 1 onward. Some are retained across all phases; two are deprecated in Phase 2 (marked below).

---

### `[NARRATIVE]` {#narrative}

Player-facing narration broadcast to all teammates.

- **Sender**: GM
- **Recipient**: All teammates (broadcast)
- **Transport**: `SendMessage` with `type: broadcast`
- **Phase**: 1+ (all phases)

**Payload:**
```
[NARRATIVE]

{Full narrative prose using session's narrative style}

**What do you do?**
```

No structured fields — the entire content after the tag is free-form narrative prose.

**When sent:** After the GM narrates a scene beat, describes an outcome, or opens a new scene. The GM should include woven-in player actions and dialogue from the current beat.

**Expected responses:**
- Team lead: Strips tag, displays to human. If narrative ends with a prompt, collects human input and sends `[PLAYER_ACTION]`.
- Narrator: Captures to scene file.
- Player teammates (Phase 2): Receive scene awareness.

**Split party exception:** During split party scenarios, the GM sends `[NARRATIVE]` as a **direct message** to the team lead (not broadcast) to avoid leaking group-specific narrative to all players. Include a note indicating which group the narrative is for. Send `[NARRATOR_NOTE]` separately so the narrator can capture both threads.

---

### `[GM_TO_PLAYER]` {#gm_to_player}

Character-specific prompt sent to a single player.

- **Sender**: GM
- **Recipient**: Specific player teammate (Phase 2) or included in `[AWAIT_PLAYERS]` for ephemeral Tasks (Phase 1)
- **Transport**: `SendMessage` with `type: message` (Phase 2) / Task prompt (Phase 1)
- **Phase**: 1+ (transport differs by phase)

**Payload:**
```
[GM_TO_PLAYER]
request_type: QUICK_REACTION | FULL_CONTEXT | COMBAT_ACTION | SECRET_ACTION
scene_number: 005
scene_slug: the-warehouse-heist

## Scene
{Scene description from THIS character's perspective only}

## Just Happened
{What triggered this request}

## Request
{What the GM needs — brief reaction, full action, combat turn, etc.}
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `request_type` | Yes | One of: `QUICK_REACTION`, `FULL_CONTEXT`, `COMBAT_ACTION`, `SECRET_ACTION` |
| `scene_number` | Yes | Current scene number (zero-padded, e.g., `005`) |
| `scene_slug` | Yes | Scene slug (kebab-case, e.g., `the-warehouse-heist`) |

**When sent:** When the GM needs a specific character's input — reactions, combat actions, decisions, or secret actions.

**Information isolation (CRITICAL):** Include ONLY what this character would know. Never include content from `story-state.md`, other characters' secrets, or NPC hidden motivations.

**Expected response:**
- Phase 2: Player sends `[PLAYER_TO_GM]` directly to GM.
- Phase 1: Response comes bundled in `[PLAYER_RESPONSES]` from team lead.

---

### `[ASK_PLAYER]` {#ask_player}

Structured question for the human player, routed through team lead.

- **Sender**: GM
- **Recipient**: Team lead
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[ASK_PLAYER]
question: "Which character are you playing this session?"
header: "Character"
options:
  - label: "Corwin Voss"
    description: "Human rogue, haunted by his past"
  - label: "New character"
    description: "Create a new character for this campaign"
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `question` | Yes | The question text |
| `header` | Yes | Short label for the AskUserQuestion header |
| `options` | Yes | Array of `{label, description}` choices |

**When sent:** When the GM needs structured input from the human (character selection, binary choices, etc.).

**Expected response:** Team lead converts to `AskUserQuestion`, then sends `[PLAYER_ANSWER]` to GM.

---

### `[AWAIT_PLAYERS]` {#await_players}

Request for AI player input, sent to team lead for ephemeral Task spawning.

- **Sender**: GM
- **Recipient**: Team lead
- **Transport**: `SendMessage` with `type: message`
- **Phase**: **1 only** — deprecated in Phase 2

> **Deprecation notice:** In Phase 2, the GM messages player teammates directly with `[GM_TO_PLAYER]` instead of routing through the team lead. This message type is retained only for Phase 1 backward compatibility.

**Payload:**
```
[AWAIT_PLAYERS]
characters:
  - name: tilda-brannock
    request_type: QUICK_REACTION
    scene_context: |
      Inside dark warehouse, sneaking past guards.
    just_happened: |
      Aldric is signaling back about the trap.
    request: "Brief reaction or [VETO]."
  - name: grimjaw-ironforge
    request_type: QUICK_REACTION
    scene_context: |
      Inside dark warehouse. Aldric found the crate but there's a tripwire.
    just_happened: |
      Aldric paused and is gesturing about something on the ground.
    request: "Brief reaction or [VETO]."

scene_number: 005
scene_slug: the-warehouse-heist
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `characters` | Yes | Array of character request objects |
| `characters[].name` | Yes | Full hyphenated character name matching sheet filename |
| `characters[].request_type` | Yes | One of: `QUICK_REACTION`, `FULL_CONTEXT`, `COMBAT_ACTION`, `SECRET_ACTION` |
| `characters[].scene_context` | Yes | What this character perceives (isolated per character) |
| `characters[].just_happened` | Yes | What triggered this request (from this character's perspective) |
| `characters[].request` | Yes | What the GM needs from this character |
| `scene_number` | Yes | Current scene number |
| `scene_slug` | Yes | Current scene slug |

**When sent:** When the GM needs reactions from multiple AI characters in Phase 1.

**Expected response:** Team lead spawns ephemeral `ai-player-action` Tasks in parallel, collects responses, sends `[PLAYER_RESPONSES]` to GM. After sending, the GM **waits** for `[PLAYER_RESPONSES]` before continuing.

---

### `[STATE_UPDATED]` {#state_updated}

Signal that delta files have been written to disk.

- **Sender**: GM
- **Recipient**: Team lead
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[STATE_UPDATED]
deltas_written:
  - gm-state-delta.md
  - party-knowledge-delta.md
characters_involved:
  - tilda-brannock
  - grimjaw-ironforge
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `deltas_written` | Yes | List of delta files written to `campaigns/{campaign}/tmp/` |
| `characters_involved` | Yes | Characters affected by the state change |

**CRITICAL:** The GM must finish writing ALL delta files to disk BEFORE sending this message.

**When sent:** After the GM narrates an outcome that involves meaningful state changes (HP, knowledge, quest progress, etc.).

**Expected response:** Team lead spawns background agents:
- `state-delta-writer` (processes `gm-state-delta.md`)
- `knowledge-delta-writer` (processes `party-knowledge-delta.md`)
- Phase 1: `ai-player-journal` Tasks + `decision-log` (if AI action cycle preceded)
- Phase 2: `decision-log` only (players self-journal)

---

### `[SESSION_END]` {#session_end}

Session is complete.

- **Sender**: GM
- **Recipient**: Team lead
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[SESSION_END]
summary: |
  The party investigated the warehouse district, discovered the smuggling
  operation, and descended into the tunnels beneath the city.
state_saved: true
next_hook: "The tunnel stretches into darkness. Something is breathing down there."
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `summary` | Yes | Session summary for the human player |
| `state_saved` | Yes | Whether the GM performed a final save (`true`/`false`) |
| `next_hook` | Yes | Cliffhanger or hook for the next session |

**When sent:** After the GM finds a good stopping point, performs a final save, and writes comprehensive state.

**Expected response:** Team lead displays summary and hook to human, waits for background tasks, sends `shutdown_request` to all teammates, calls `TeamDelete`.

---

### `[PLAYER_ACTION]` {#player_action}

Human player's declared action, forwarded by the team lead.

- **Sender**: Team lead
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[PLAYER_ACTION]
character: corwin-voss
action: "I want to sneak through the shelves toward the back, looking for the crate."
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `character` | Yes | Full hyphenated character name |
| `action` | Yes | The human player's declared action (verbatim or lightly formatted) |

**When sent:** After the team lead collects human input following a `[NARRATIVE]` prompt.

**Expected response:** GM processes the action, narrates outcome, broadcasts `[NARRATIVE]`.

---

### `[DICE_RESULT]` {#dice_result}

Dice roll outcome sent by the team lead after rolling for the human player.

- **Sender**: Team lead
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[DICE_RESULT]
character: corwin-voss
check: Stealth
roll: "1d20+5 = [8]+5 = 13"
dc: 12
result: success
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `character` | Yes | Full hyphenated character name |
| `check` | Yes | Type of check (e.g., `Stealth`, `Attack`, `Perception`) |
| `roll` | Yes | Full roll notation with result |
| `dc` | No | Difficulty class (if known) |
| `result` | No | Outcome (`success`/`failure`/`critical_success`/`critical_failure`) |

**When sent:** After the team lead rolls dice (via `toss` CLI) for the human player.

---

### `[PLAYER_RESPONSES]` {#player_responses}

Bundled AI player responses collected by the team lead from ephemeral Tasks.

- **Sender**: Team lead
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`
- **Phase**: **1 only** — deprecated in Phase 2

> **Deprecation notice:** In Phase 2, player teammates respond directly to the GM with `[PLAYER_TO_GM]`. This message type is retained only for Phase 1 backward compatibility.

**Payload:**
```
[PLAYER_RESPONSES]
responses:
  - character: tilda-brannock
    response: |
      Tilda's hand drops to her sword. "Easy there."
  - character: grimjaw-ironforge
    response: |
      Grimjaw grunts and moves to block the door.
vetoes:
  - character: seraphine-duskhollow
    reason: "This NPC is connected to my backstory."
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `responses` | Yes | Array of `{character, response}` objects |
| `vetoes` | No | Array of `{character, reason}` for players who vetoed |

**When sent:** After the team lead collects all ephemeral AI player Task results.

**Expected response:** GM reads responses, weaves into narrative. If vetoes present, GM sends new `[AWAIT_PLAYERS]` with `request_type: FULL_CONTEXT` for vetoing characters.

---

### `[PLAYER_ANSWER]` {#player_answer}

Human's answer to a structured `[ASK_PLAYER]` question.

- **Sender**: Team lead
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[PLAYER_ANSWER]
question: "Which character are you playing?"
answer: "Corwin Voss"
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `question` | Yes | The original question (for reference) |
| `answer` | Yes | The human's selection or typed response |

**When sent:** After the team lead converts `[ASK_PLAYER]` to `AskUserQuestion` and receives the human's answer.

---

### `[SESSION_COMMAND]` {#session_command}

Human-initiated session control (save or end).

- **Sender**: Team lead
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[SESSION_COMMAND]
command: start | save | end
reason: "Player wants to stop for the night"
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `command` | Yes | One of: `start`, `save`, `end` |
| `reason` | No | Human-readable reason |

Additional fields for `start` command:
| Field | Required | Description |
|-------|----------|-------------|
| `campaign` | Yes | Campaign directory name |
| `player_character` | Yes | Human's character (full hyphenated name) |
| `narrative_style` | Yes | Session narrative style |
| `ai_characters` | Yes | List of AI-controlled character names |

**When sent:**
- `start`: At session beginning after team creation
- `save`: When human requests a mid-session save
- `end`: When human wants to end the session

**Expected response:**
- `save`: GM writes delta files, sends `[STATE_UPDATED]`
- `end`: GM finds stopping point, performs final save, sends `[SESSION_END]`

---

### `[CONTEXT_REFRESH]` {#context_refresh}

Post-compaction recovery signal.

- **Sender**: Team lead
- **Recipient**: Any teammate (GM, narrator, or player)
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[CONTEXT_REFRESH]
campaign: the-rot-beneath
current_scene: "005 - the-warehouse-heist"
last_narrative_summary: "Party discovered tripwire. Waiting for player action."
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `campaign` | Yes | Campaign directory name |
| `current_scene` | No | Latest scene number and slug |
| `last_narrative_summary` | No | Brief summary of last known state |

**When sent:** After context compaction, or when a teammate seems to have lost context.

**Expected response:** Recipient re-reads campaign files, resumes from latest state. GM responds with a `[NARRATIVE]` broadcast recapping the current situation.

---

### `[NARRATOR_NOTE]` {#narrator_note}

Emphasis request or supplementary scene information for the narrator.

- **Sender**: GM or any player teammate
- **Recipient**: Narrator
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[NARRATOR_NOTE]
from: gm
note: "Emphasize the emotional weight of this reunion scene."
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `from` | Yes | Sender identity (`gm`, or character name) |
| `note` | Yes | What to emphasize or capture |

**When sent:**
- GM wants the narrator to emphasize a specific moment
- GM responds to a `[NARRATOR_REQUEST]` with observable (non-secret) details
- A player wants a personal moment captured with emphasis

**Expected response:** Narrator incorporates emphasis into scene prose naturally.

---

### `[NARRATOR_REQUEST]` {#narrator_request}

Narrator requests missing information from the GM.

- **Sender**: Narrator
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`
- **Phase**: 1+ (all phases)

**Payload:**
```
[NARRATOR_REQUEST]
to: gm
request: "I have a gap in the warehouse scene — can you summarize what happened between the tripwire discovery and the combat start?"
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `to` | Yes | Always `gm` |
| `request` | Yes | What information is missing |

**When sent:** When the narrator detects a gap in the narrative (e.g., after context compaction, or when peer DM summaries were insufficient).

**Expected response:** GM sends `[NARRATOR_NOTE]` with observable (non-secret) details. GM must NOT include hidden motivations, secrets, or information from `story-state.md`.

---

## Phase 2 Messages (Full Teammates)

These messages are introduced in Phase 2 when all characters become persistent teammates.

---

### `[PLAYER_TO_GM]` {#player_to_gm}

Player teammate's action, reaction, or veto sent directly to the GM.

- **Sender**: Player teammate (AI or human-relay)
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`
- **Phase**: **2+**

**Payload (action/reaction):**
```
[PLAYER_TO_GM]
type: ACTION | REACTION
character: tilda-brannock

Tilda's hand drops to her sword. "Easy there," she warns the stranger.

(Requesting Intimidation check if needed)
```

**Payload (veto):**
```
[PLAYER_TO_GM]
type: VETO
character: tilda-brannock

This touches my backstory — the mercenary band that killed my family.
I need full context to respond properly.
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | One of: `ACTION`, `REACTION`, `VETO` |
| `character` | Yes | Full hyphenated character name |

Free-form content follows the fields.

**When sent:** After receiving `[GM_TO_PLAYER]` from the GM.

**Expected response:**
- `ACTION`/`REACTION`: GM weaves into narrative, broadcasts `[NARRATIVE]`
- `VETO`: GM sends new `[GM_TO_PLAYER]` with `request_type: FULL_CONTEXT`

---

### `[PLAYER_TO_PLAYER]` {#player_to_player}

In-character dialogue between player teammates.

- **Sender**: Player teammate
- **Recipient**: Another player teammate
- **Transport**: `SendMessage` with `type: message`
- **Phase**: **2+**

**Payload:**
```
[PLAYER_TO_PLAYER]
from: tilda-brannock
to: grimjaw-ironforge

*whispers* "Watch the left flank. Something moved."
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `from` | Yes | Sender's full hyphenated character name |
| `to` | Yes | Recipient's full hyphenated character name |

Free-form in-character content follows the fields.

**Rules:**
- **In-character ONLY** — no out-of-game table talk
- GM sees all player-to-player messages via peer DM visibility
- Narrator captures via peer DM visibility for scene files
- Out-of-game character discussions use the `/chat` command instead

---

### `[RELAY_TO_HUMAN]` {#relay_to_human}

Human's character teammate requests human input via the team lead.

- **Sender**: Human's player teammate
- **Recipient**: Team lead
- **Transport**: `SendMessage` with `type: message`
- **Phase**: **2+**

**Payload:**
```
[RELAY_TO_HUMAN]
character: corwin-voss

## Scene
{What the character perceives}

## Decision Needed
{What the GM is asking}

## Suggested Options
- Sneak past the guards (Stealth check)
- Create a distraction
- (freeform always available)
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `character` | Yes | Full hyphenated character name |

Followed by structured sections: Scene, Decision Needed, Suggested Options.

**When sent:** When the human's character teammate receives `[GM_TO_PLAYER]` and needs human input to respond.

**Expected response:** Team lead shows to human (via `AskUserQuestion` or display), then sends `[HUMAN_DECISION]` back to the character teammate.

---

### `[HUMAN_DECISION]` {#human_decision}

Human's response relayed to their character teammate.

- **Sender**: Team lead
- **Recipient**: Human's player teammate
- **Transport**: `SendMessage` with `type: message`
- **Phase**: **2+**

**Payload:**
```
[HUMAN_DECISION]
character: corwin-voss

"I try to sneak past. If spotted, I'll bluff my way through."
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `character` | Yes | Full hyphenated character name |

Free-form human input follows.

**When sent:** After the team lead collects the human's response to a `[RELAY_TO_HUMAN]` request.

**Expected response:** Character teammate translates human intent into in-character action, sends `[PLAYER_TO_GM]` to GM.

---

### `[MODE_SWITCH]` {#mode_switch}

Switch the human's character teammate between relay and autonomous modes.

- **Sender**: Team lead
- **Recipient**: Human's player teammate
- **Transport**: `SendMessage` with `type: message`
- **Phase**: **2+**

**Payload:**
```
[MODE_SWITCH]
mode: AUTONOMOUS | HUMAN_RELAY
reason: "Player stepped away"
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `mode` | Yes | One of: `AUTONOMOUS`, `HUMAN_RELAY` |
| `reason` | No | Why the switch is happening |

**When sent:** When the human player steps away (switch to `AUTONOMOUS`) or returns (switch to `HUMAN_RELAY`).

**Expected response:**
- `AUTONOMOUS`: Character teammate makes decisions based on personality, informs human of actions taken when mode switches back
- `HUMAN_RELAY`: Character teammate resumes relaying, provides "while you were away" summary

---

### `[JOURNAL_CHECKPOINT]` {#journal_checkpoint}

Signal for persistent player teammates to write journal entries.

- **Sender**: Team lead
- **Recipient**: All player teammates
- **Transport**: `SendMessage` with `type: message` (to each player individually)
- **Phase**: **2+**

**Payload:**
```
[JOURNAL_CHECKPOINT]
campaign: the-rot-beneath
scene_number: 005
scene_slug: the-warehouse-heist
trigger: state_updated | session_end | manual
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `campaign` | Yes | Campaign directory name |
| `scene_number` | Yes | Current scene number |
| `scene_slug` | Yes | Current scene slug |
| `trigger` | Yes | What triggered the checkpoint |

**When sent:** After `[STATE_UPDATED]` (if preceded by player action cycle), at session end, or when manually triggered.

**Expected response:** Each player teammate writes a journal entry to their own journal file (`party/{character}-journal.md`).

---

## Message Sequencing

### Standard Beat (Phase 1)

```
1. GM broadcasts [NARRATIVE]          → Team lead displays, narrator captures
2. Team lead sends [PLAYER_ACTION]    → Human's action to GM
3. GM processes, sends [AWAIT_PLAYERS] → Team lead spawns ephemeral Tasks
4. Team lead sends [PLAYER_RESPONSES]  → Bundled AI responses to GM
5. GM broadcasts [NARRATIVE]          → Outcome with woven player actions
6. GM sends [STATE_UPDATED]           → Team lead spawns background writers
```

### Standard Beat (Phase 2)

```
1. GM broadcasts [NARRATIVE]          → All teammates receive
2. GM sends [GM_TO_PLAYER] to each    → Character-specific prompts
3. Human's teammate sends [RELAY_TO_HUMAN] → Team lead shows to human
4. Team lead sends [HUMAN_DECISION]   → Back to human's teammate
5. All players send [PLAYER_TO_GM]    → Direct to GM
6. GM broadcasts [NARRATIVE]          → Outcome with woven player actions
7. GM sends [STATE_UPDATED]           → Team lead spawns background writers
8. Team lead sends [JOURNAL_CHECKPOINT] → Players self-journal
```

### Processing Order

When the GM sends multiple messages in sequence:

1. **Display first**: Always display `[NARRATIVE]` to the human immediately
2. **Then act**: Process `[AWAIT_PLAYERS]`, `[STATE_UPDATED]`, `[ASK_PLAYER]`
3. **Parallel where possible**: Spawn AI Tasks AND collect human input simultaneously

---

## Character Naming Convention

All messages use **full hyphenated character names** matching the character sheet filename (e.g., `tilda-brannock`, not `Tilda` or `Tilda Brannock`). This ensures unambiguous routing and file lookups.

---

## Deprecation Schedule

| Message | Introduced | Deprecated | Replacement |
|---------|-----------|------------|-------------|
| `[AWAIT_PLAYERS]` | Phase 1 | Phase 2 | GM sends `[GM_TO_PLAYER]` directly to each player |
| `[PLAYER_RESPONSES]` | Phase 1 | Phase 2 | Players send `[PLAYER_TO_GM]` directly to GM |
