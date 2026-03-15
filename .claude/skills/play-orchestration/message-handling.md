# Message Handling

Detailed procedures for handling each message type in the core loop.

## Messages the Team Lead Handles

Reference: **messaging-protocol** skill for full message protocol (all tag formats, fields, and routing rules).

| Tag | Source | Action |
|-----|--------|--------|
| `[NARRATIVE]` | GM (broadcast or direct) | Display to human |
| `[RELAY_TO_HUMAN]` | Human's player teammate | Show to human, collect input, send `[HUMAN_DECISION]` back |
| `[ASK_PLAYER]` | GM (direct) | Convert to AskUserQuestion, send `[PLAYER_ANSWER]` to GM |
| `[SESSION_END]` | GM (direct) | Display summary, shutdown team |
| `[ACTIVITY]` | Player teammate | Update activity display |

## Messages the Team Lead Does NOT Handle

These flow directly between GM and players — the team lead is not involved:

| Tag | Flow | Notes |
|-----|------|-------|
| `[GM_TO_PLAYER]` | GM -> Player teammate | GM prompts players directly |
| `[PLAYER_TO_GM]` | Player teammate -> GM | Players respond directly |
| `[PLAYER_TO_PLAYER]` | Player -> Player | In-character crosstalk |

**Note on `[NARRATIVE]` delivery**: Normally the GM broadcasts `[NARRATIVE]` to all teammates. However, during **split party** scenarios, the GM sends `[NARRATIVE]` as a **direct message** to the team lead (not broadcast) to avoid leaking group-specific narrative to all players. Handle both delivery methods identically — strip the tag and display to the human.

## Handling [NARRATIVE] Broadcasts

When the GM broadcasts a `[NARRATIVE]` message:

1. **Strip the `[NARRATIVE]` tag** from the content
2. **Display the FULL narrative to the human** — show everything, summarize nothing
3. Use proper formatting (see Formatting Guidelines below)

**Note**: The team lead does NOT collect human input after narrative. The GM sends `[GM_TO_PLAYER]` directly to the human's player teammate, which handles relaying to the human via `[RELAY_TO_HUMAN]`.

### Formatting Guidelines

| Content Type | Format | Example |
|-------------|--------|---------|
| **Character speech** | Blockquote with bold name | > **Gideon**: "Shall we investigate?" |
| **GM narration** | Plain text, italics for emphasis | The tavern falls quiet. *Something about his bearing demands attention.* |
| **Character actions** | Italics | *Mira reaches for her blade.* |
| **Dice results** | Code formatting | `Perception check: 14 + 3 = 17` |
| **GM notes/mechanics** | Parenthetical | (DC 15 - Success) |

## Handling [RELAY_TO_HUMAN]

When the human's player teammate sends `[RELAY_TO_HUMAN]`, it needs the human's input.

### Parse the Message

Parse the `[RELAY_TO_HUMAN]` payload (see **messaging-protocol** skill for format). Extract the Scene, Decision Needed, and Suggested Options sections.

### Show to Human

Use AskUserQuestion to present the decision:

```
AskUserQuestion:
  question: "{Decision Needed text}"
  header: "Action"
  options:
    - label: "{Option A label}"
      description: "{Option A description}"
    - label: "{Option B label}"
      description: "{Option B description}"
```

The player can always type a custom response via "Other".

### Send Human's Response Back

```
SendMessage:
  type: message
  recipient: {player_character}
  content: |
    [HUMAN_DECISION]
    character: {player_character}

    {human's selection or typed response}
  summary: "{player_character} decides"
```

The human's player teammate translates the response into in-character action and sends `[PLAYER_TO_GM]` directly to the GM.

### Dice Rolling for Human

When the human's player teammate or the GM needs dice rolled for the human's character, the team lead performs the roll using the `toss` CLI (via the dice-roll skill) and sends the result:

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [DICE_RESULT]
    character: {player_character}
    check: Stealth
    roll: "1d20+5 = [8]+5 = 13"
    dc: 12
    result: success
  summary: "{player_character} rolls {check}"
```

## Handling [ASK_PLAYER]

When the GM sends `[ASK_PLAYER]`, convert it to an AskUserQuestion call. See **messaging-protocol** skill for payload format.

### Convert to AskUserQuestion

Map the fields directly:

```
AskUserQuestion:
  question: {question}
  header: {header}
  options: {options array}
```

### Send Answer to GM

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [PLAYER_ANSWER]
    question: "{original question}"
    answer: "{human's selection or typed response}"
  summary: "Player answered: {brief answer}"
```

## Handling [SESSION_END]

When the GM sends `[SESSION_END]`, see [session-lifecycle.md](session-lifecycle.md) for the full shutdown procedure.

Quick reference:
1. Display the session summary to the human
2. Display the next hook (cliffhanger for next session)
3. Spawn decision-log agent (background) to record final session decisions
4. Send `shutdown_request` to all teammates
5. After all teammates confirm shutdown, call TeamDelete

## Handling [NPC_SPAWN_REQUEST]

When the GM sends `[NPC_SPAWN_REQUEST]`, spawn a dedicated NPC teammate:

### Parse the Request

```
[NPC_SPAWN_REQUEST]
npc: koresh-rath
npc_file: campaigns/the-dimming/npcs/koresh-rath.md
reason: "Extended interrogation — NPC has secrets"
knowledge_boundary: |
  Knows: [list]
  Does NOT know: [list]
scene_context: |
  [Current situation]
```

### Spawn the NPC Teammate

```
Task:
  subagent_type: npc-teammate
  team_name: dnd-{campaign}
  name: npc-{npc-name}
  prompt: |
    Campaign: {campaign}
    NPC: {npc-name}
    NPC File: {npc_file}

    Knowledge Boundary:
    {knowledge_boundary}

    Scene Context:
    {scene_context}

    Read your NPC file and party-knowledge.md. You are entering an active scene.
    Wait for the GM or players to address you.
```

### Confirm to GM

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [NPC_SPAWNED]
    npc: {npc-name}
    teammate_name: npc-{npc-name}
  summary: "NPC {npc-name} spawned"
```

## Handling [NPC_DESPAWN_REQUEST]

When the GM sends `[NPC_DESPAWN_REQUEST]`:

```
SendMessage:
  type: shutdown_request
  recipient: npc-{npc-name}
  content: "Interaction concluded. Shutting down."
```

After shutdown confirmation, notify the GM:

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [NPC_DESPAWNED]
    npc: {npc-name}
  summary: "NPC {npc-name} despawned"
```

## Handling [MODE_SWITCH] (Human Player Away/Back)

When the human player steps away or returns, send a mode switch to their character teammate:

### Player Steps Away

```
SendMessage:
  type: message
  recipient: {player_character}
  content: |
    [MODE_SWITCH]
    mode: AUTONOMOUS
    reason: "Player stepped away"
  summary: "Switching to autonomous mode"
```

The human's character teammate will begin making its own decisions.

### Player Returns

```
SendMessage:
  type: message
  recipient: {player_character}
  content: |
    [MODE_SWITCH]
    mode: HUMAN_RELAY
    reason: "Player returned"
  summary: "Switching back to human relay"
```

The character teammate will send a `[RELAY_TO_HUMAN]` with a "While you were away" summary. Display this to the human.

## Human-Initiated Session Commands

The human player can request saves or session end at any time.

### "Let's save"

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [SESSION_COMMAND]
    command: save
    reason: "Player requested save"
  summary: "Player requests save"
```

The GM will update `story-state.md` and `party-knowledge.md` directly.

### "I want to stop" / "Let's end the session"

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [SESSION_COMMAND]
    command: end
    reason: "Player wants to end the session"
  summary: "Player requests session end"
```

The GM will find a good stopping point, save state directly to campaign files, and send `[SESSION_END]`.
