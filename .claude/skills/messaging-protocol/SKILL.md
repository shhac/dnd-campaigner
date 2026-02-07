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

| Tag | Sender | Recipient | Transport |
|-----|--------|-----------|-----------|
| [`[NARRATIVE]`](#narrative) | GM | All (broadcast) | broadcast |
| [`[GM_TO_PLAYER]`](#gm_to_player) | GM | Specific player | message |
| [`[ASK_PLAYER]`](#ask_player) | GM | Team lead | message |
| [`[SESSION_END]`](#session_end) | GM | Team lead | message |
| [`[NARRATOR_NOTE]`](#narrator_note) | GM or Player | Narrator | message |
| [`[DICE_RESULT]`](#dice_result) | Team lead | GM | message |
| [`[PLAYER_ANSWER]`](#player_answer) | Team lead | GM | message |
| [`[SESSION_COMMAND]`](#session_command) | Team lead | GM | message |
| [`[CONTEXT_REFRESH]`](#context_refresh) | Team lead | Any teammate | message |
| [`[HUMAN_DECISION]`](#human_decision) | Team lead | Human's player teammate | message |
| [`[MODE_SWITCH]`](#mode_switch) | Team lead | Human's player teammate | message |
| [`[PLAYER_TO_GM]`](#player_to_gm) | Player teammate | GM | message |
| [`[PLAYER_TO_PLAYER]`](#player_to_player) | Player teammate | Player teammate | message |
| [`[RELAY_TO_HUMAN]`](#relay_to_human) | Human's player teammate | Team lead | message |
| [`[NARRATOR_REQUEST]`](#narrator_request) | Narrator | GM | message |

---

## GM → Team Messages

---

### `[NARRATIVE]` {#narrative}

Player-facing narration broadcast to all teammates.

- **Sender**: GM
- **Recipient**: All teammates (broadcast)
- **Transport**: `SendMessage` with `type: broadcast`
**Payload:**
```
[NARRATIVE]

{Full narrative prose using session's narrative style}
```

No structured fields — the entire content after the tag is free-form narrative prose.

**IMPORTANT:** Do not include action prompts ("What do you do?") in broadcasts. Use `[GM_TO_PLAYER]` for action requests. Broadcasts are for scene awareness only.

**When sent:** After the GM narrates a scene beat, describes an outcome, or opens a new scene. The GM should include woven-in player actions and dialogue from the current beat.

**Expected responses:**
- Team lead: Strips tag, displays to human.
- Narrator: Captures to scene file.
- Player teammates: Receive scene awareness. **Players must NOT respond to broadcasts — they wait for direct `[GM_TO_PLAYER]` prompts.**

**Split party exception:** During split party scenarios, the GM sends `[NARRATIVE]` as a **direct message** to the team lead (not broadcast) to avoid leaking group-specific narrative to all players. Include a note indicating which group the narrative is for. Send `[NARRATOR_NOTE]` separately so the narrator can capture both threads.

---

### `[GM_TO_PLAYER]` {#gm_to_player}

Character-specific prompt sent to a single player.

- **Sender**: GM
- **Recipient**: Specific player teammate
- **Transport**: `SendMessage` with `type: message`

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
| `request_type` | Yes | One of: `QUICK_REACTION`, `FULL_CONTEXT`, `COMBAT_ACTION`, `SECRET_ACTION`, `OPTIONAL_REACTION`, `REFLECTION`, `INTERACTION` |
| `scene_number` | Yes | Current scene number (zero-padded, e.g., `005`) |
| `scene_slug` | Yes | Scene slug (kebab-case, e.g., `the-warehouse-heist`) |

**Request type descriptions:**
- **QUICK_REACTION** — Brief 1-2 sentence response. Player can veto for full context.
- **FULL_CONTEXT** — Full engagement. Player takes their time making decisions.
- **COMBAT_ACTION** — Player's combat turn. State action, target, abilities.
- **SECRET_ACTION** — Private action opportunity. Player responds honestly based on character.
- **OPTIONAL_REACTION** — Respond if you have something to add; fine to skip entirely.
- **REFLECTION** — Share internal experience, not action. Character development moment.
- **INTERACTION** — Talk to party members via `[PLAYER_TO_PLAYER]`, not to the GM.

**When sent:** When the GM needs a specific character's input — reactions, combat actions, decisions, or secret actions.

**Information isolation (CRITICAL):** Include ONLY what this character would know. Never include content from `story-state.md`, other characters' secrets, or NPC hidden motivations.

**Expected response:** Player sends `[PLAYER_TO_GM]` directly to GM.

---

### `[ASK_PLAYER]` {#ask_player}

Structured question for the human player, routed through team lead.

- **Sender**: GM
- **Recipient**: Team lead
- **Transport**: `SendMessage` with `type: message`

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

### `[SESSION_END]` {#session_end}

Session is complete.

- **Sender**: GM
- **Recipient**: Team lead
- **Transport**: `SendMessage` with `type: message`

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

### `[DICE_RESULT]` {#dice_result}

Dice roll outcome sent by the team lead after rolling for the human player.

- **Sender**: Team lead
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`

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

### `[PLAYER_ANSWER]` {#player_answer}

Human's answer to a structured `[ASK_PLAYER]` question.

- **Sender**: Team lead
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`

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
- `save`: GM updates `story-state.md` and `party-knowledge.md` directly
- `end`: GM finds stopping point, performs final save, sends `[SESSION_END]`

---

### `[CONTEXT_REFRESH]` {#context_refresh}

Post-compaction recovery signal.

- **Sender**: Team lead
- **Recipient**: Any teammate (GM, narrator, or player)
- **Transport**: `SendMessage` with `type: message`

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

## Player → GM Messages

---

### `[PLAYER_TO_GM]` {#player_to_gm}

Player teammate's action, reaction, or veto sent directly to the GM.

- **Sender**: Player teammate (AI or human-relay)
- **Recipient**: GM
- **Transport**: `SendMessage` with `type: message`

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

## Message Sequencing

### Standard Beat

```
1. GM broadcasts [NARRATIVE]          → All teammates receive (awareness only)
2. GM sends [GM_TO_PLAYER] to each    → Character-specific prompts
3. Human's teammate sends [RELAY_TO_HUMAN] → Team lead shows to human
4. Team lead sends [HUMAN_DECISION]   → Back to human's teammate
5. All players send [PLAYER_TO_GM]    → Direct to GM
6. GM broadcasts [NARRATIVE]          → Outcome with woven player actions
7. GM updates story-state.md and party-knowledge.md directly
```

Players journal autonomously at natural beat boundaries — no external signal needed.

### Processing Order

When the GM sends multiple messages in sequence:

1. **Display first**: Always display `[NARRATIVE]` to the human immediately
2. **Then act**: Process `[ASK_PLAYER]`, `[RELAY_TO_HUMAN]`

---

## Character Naming Convention

All messages use **full hyphenated character names** matching the character sheet filename (e.g., `tilda-brannock`, not `Tilda` or `Tilda Brannock`). This ensures unambiguous routing and file lookups.

