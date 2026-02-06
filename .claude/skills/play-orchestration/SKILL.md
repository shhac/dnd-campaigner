---
name: play-orchestration
description: Core orchestration loop for Teams-based D&D play sessions. Use when orchestrating D&D play sessions via Claude Code Teams, when the GM sends messages to process, when handling human relay I/O, when asking the player questions via AskUserQuestion, or when context may have been compacted during a long session. This skill survives context compaction.
---

# Play Orchestration Skill

Core orchestration logic for running D&D sessions using Claude Code Teams. The team lead is a **lightweight delegate** — it creates the team, spawns all teammates (GM, Narrator, and player characters), handles human I/O via the human-relay player, manages session lifecycle, and spawns background agents. The GM and players communicate directly; the team lead does NOT relay messages between them.

All characters (AI and human) are persistent teammates. The GM messages players directly. The team lead is a lightweight orchestrator in delegate mode.

## When This Skill Activates

Use this skill when:
- Starting a new D&D play session via `/play`
- A teammate sends a message to the team lead (GM state updates, human relay requests, session end)
- Context has been compacted during a long session (re-invoke to restore orchestration patterns)

## Quick Reference: The Orchestration Loop

```
/play {campaign}
    |
    v
Clean up orphaned delta files (rm -f tmp/*-delta.md)
    |
    v
Load Preferences (or ask player)
    |
    v
TeamCreate: dnd-{campaign}
    |
    v
Spawn GM teammate (gm agent, persistent)
Spawn Narrator teammate (narrator agent, persistent)
Spawn Player teammates:
  - human-relay-player for human's character
  - player-teammate for each AI character
    |
    v
Send session-start to GM ──────────────────────────────┐
    |                                                   |
    v                                                   |
GM broadcasts [NARRATIVE] -> Display to human           |
    |                                                   |
    v                                                   |
GM sends [GM_TO_PLAYER] directly to players             |
    |                                                   |
    v                                                   |
Human's teammate sends [RELAY_TO_HUMAN] ->              |
    Team lead shows to human via AskUserQuestion         |
    Team lead sends [HUMAN_DECISION] back                |
    |                                                   |
    v                                                   |
All players send [PLAYER_TO_GM] directly to GM          |
    |                                                   |
    v                                                   |
GM broadcasts [NARRATIVE] (with woven player actions)   |
    |                                                   |
    +---> [STATE_UPDATED] handler:                      |
    |     - state-delta-writer (background)             |
    |     - knowledge-delta-writer (background)         |
    |     - decision-log (background)                   |
    |     - [JOURNAL_CHECKPOINT] to player teammates    |
    |                                                   |
    v                                                   |
Display narrative to human  ────────────────────────────┘
    |
    v
Loop until [SESSION_END]
```

## Message Sequencing Rules

**CRITICAL**: When the GM sends multiple messages in sequence, process them in this order:

1. **Display first**: Always display `[NARRATIVE]` to the human immediately upon receipt
2. **Then act**: Process `[STATE_UPDATED]`, `[ASK_PLAYER]`, or `[RELAY_TO_HUMAN]` messages
3. **No relay needed for player I/O**: The GM and players communicate directly

The GM will send messages in this canonical order:
1. `[NARRATIVE]` broadcast (for display, narrator capture, and player awareness)
2. `[GM_TO_PLAYER]` directly to players (team lead NOT involved)
3. `[STATE_UPDATED]` to team lead (if delta files were written)

## Step 0: Session Start Cleanup

Before loading preferences, clean up orphaned files from previous sessions:

```bash
# Delete any orphaned delta files from previous sessions
rm -f campaigns/{campaign}/tmp/*-delta.md 2>/dev/null || true
```

**Rationale**: Stale deltas from previous sessions may contain outdated information.

## Step 1: Load Preferences

Before creating the team, check for and load player preferences.

### Read Preferences File

Check if `campaigns/{campaign}/preferences.md` exists.

If the file exists, read it to extract:
- `narrative_style`: The formatting style for dialogue and scenes
- `player_character`: Which character the player controls

### Handle Narrative Style

If `narrative_style` is set in preferences:
- Note it for passing to the GM

If `narrative_style` is NOT set:
- Use AskUserQuestion to ask the player:

```
AskUserQuestion:
  question: "What narrative style would you like for this session?"
  header: "Style"
  options:
    - label: "Script"
      description: "Clean dialogue format with speaker names, minimal prose"
    - label: "Novel"
      description: "Rich prose with woven dialogue, like reading a fantasy novel"
    - label: "Hybrid"
      description: "Mix of both - prose narration with clear dialogue formatting"
    - label: "Minimal"
      description: "Brief, functional descriptions focused on game mechanics"
```

- Save their choice to `campaigns/{campaign}/preferences.md`

### Handle Player Character

If `player_character` is set in preferences:
- Note it for session start message to GM

If `player_character` is NOT set:
- List character files in `campaigns/{campaign}/party/`
- Use AskUserQuestion with the character names as options
- Save to `campaigns/{campaign}/preferences.md`

## Step 2: Create Team and Spawn Teammates

### Create the Team

```
TeamCreate:
  team_name: dnd-{campaign}
  description: "D&D session for {campaign}"
```

**Conflict check**: If a team `dnd-{campaign}` already exists, warn the player and ask if they want to take over the existing session or start fresh. Starting fresh means deleting the old team first.

### Determine AI-Controlled Characters

List all character sheets in `campaigns/{campaign}/party/` (excluding journal files `*-journal.md`). Remove the player_character from the list. The remaining characters are AI-controlled.

### Spawn GM Teammate

```
Task:
  subagent_type: gm
  team_name: dnd-{campaign}
  name: gm
  prompt: |
    You are the Game Master for the "{campaign}" campaign.
    Use {narrative_style} formatting style.
    The human player controls {player_character}.

    Read your campaign files and wait for the session-start message.
```

### Spawn Narrator Teammate

```
Task:
  subagent_type: narrator
  team_name: dnd-{campaign}
  name: narrator
  prompt: |
    You are the Narrator for the "{campaign}" campaign.
    Observe all broadcasts and peer DM activity.
    Write scene files to campaigns/{campaign}/scenes/.

    Read campaigns/{campaign}/preferences.md for narrative style.
    Check campaigns/{campaign}/scenes/ for existing scene files
    and continue numbering from the highest existing number + 1.
```

### Spawn Human-Relay Player Teammate

```
Task:
  subagent_type: human-relay-player
  team_name: dnd-{campaign}
  name: {player_character}
  prompt: |
    Campaign: {campaign}
    Character: {player_character}
    Mode: HUMAN_RELAY

    You are {player_character} in the "{campaign}" campaign.
    The human player controls you. Relay GM prompts to the team lead
    for human input, then translate the human's decisions into
    in-character actions.

    Read your character files and wait for the session to begin.
```

### Spawn AI Player Teammates

For each AI-controlled character:

```
Task:
  subagent_type: player-teammate
  team_name: dnd-{campaign}
  name: {character}
  prompt: |
    Campaign: {campaign}
    Character: {character}

    You are {character} in the "{campaign}" campaign.
    Read your character files and wait for the session to begin.
```

**Spawn all player teammates in a single message with multiple Task calls** (parallel).

### Send Session-Start Message to GM

After all teammates are spawned:

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [SESSION_COMMAND]
    command: start
    campaign: {campaign}
    player_character: {player_character}
    narrative_style: {narrative_style}
    ai_characters:
      - {char1}
      - {char2}
      - {char3}
  summary: "Starting session for {campaign}"
```

Wait for the GM's opening `[NARRATIVE]` broadcast.

## Step 3: Core Message Loop

The team lead receives messages from teammates. Most player-GM communication happens directly — the team lead handles only a focused set of messages.

### Messages the Team Lead Handles

Reference: **messaging-protocol** skill for full message protocol (all tag formats, fields, and routing rules).

| Tag | Source | Action |
|-----|--------|--------|
| `[NARRATIVE]` | GM (broadcast or direct) | Display to human |
| `[RELAY_TO_HUMAN]` | Human's player teammate | Show to human, collect input, send `[HUMAN_DECISION]` back |
| `[ASK_PLAYER]` | GM (direct) | Convert to AskUserQuestion, send `[PLAYER_ANSWER]` to GM |
| `[STATE_UPDATED]` | GM (direct) | Spawn background delta writers, send `[JOURNAL_CHECKPOINT]` to players |
| `[SESSION_END]` | GM (direct) | Display summary, shutdown team |

### Messages the Team Lead Does NOT Handle

These flow directly between GM and players — the team lead is not involved:

| Tag | Flow | Notes |
|-----|------|-------|
| `[GM_TO_PLAYER]` | GM → Player teammate | GM prompts players directly |
| `[PLAYER_TO_GM]` | Player teammate → GM | Players respond directly |
| `[PLAYER_TO_PLAYER]` | Player → Player | In-character crosstalk |

**Note on `[NARRATIVE]` delivery**: Normally the GM broadcasts `[NARRATIVE]` to all teammates. However, during **split party** scenarios, the GM sends `[NARRATIVE]` as a **direct message** to the team lead (not broadcast) to avoid leaking group-specific narrative to all players. Handle both delivery methods identically — strip the tag and display to the human.

## Step 4: Handling [NARRATIVE] Broadcasts

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

## Step 5: Handling [RELAY_TO_HUMAN]

When the human's player teammate sends `[RELAY_TO_HUMAN]`, it needs the human's input.

### Parse the Message

```
[RELAY_TO_HUMAN]
character: {character}

## Scene
{What the character perceives}

## Decision Needed
{What the GM is asking}

## Suggested Options
- Option A (brief description)
- Option B (brief description)
- (freeform always available)
```

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

## Step 6: Handling [ASK_PLAYER]

When the GM sends `[ASK_PLAYER]`, convert it to an AskUserQuestion call.

### Parse the Message

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

## Step 7: Handling [STATE_UPDATED]

When the GM sends `[STATE_UPDATED]`, it means delta files have been written to `campaigns/{campaign}/tmp/`. Spawn background agents to process them and signal players to journal.

### Parse the Message

```
[STATE_UPDATED]
deltas_written:
  - gm-state-delta.md
  - party-knowledge-delta.md
characters_involved:
  - tilda-brannock
  - grimjaw-ironforge
```

### Spawn Background Agents

Spawn ALL of these in a single message (parallel, all `run_in_background: true`):

**State Delta Writer:**
```
Task:
  subagent_type: state-delta-writer
  run_in_background: true
  prompt: "Campaign: {campaign}"
```

**Knowledge Delta Writer:**
```
Task:
  subagent_type: knowledge-delta-writer
  run_in_background: true
  prompt: "Campaign: {campaign}"
```

**Decision-Log (if player actions preceded this state update):**
```
Task:
  subagent_type: decision-log
  run_in_background: true
  prompt: |
    Campaign: {campaign}
    Scene: {scene_number} - {scene_slug}
    Characters involved: {characters_involved list}
```

### Send Journal Checkpoints to Player Teammates

After spawning background agents, signal all player teammates to write journal entries:

```
SendMessage:
  type: message
  recipient: {character-1}
  content: |
    [JOURNAL_CHECKPOINT]
    campaign: {campaign}
    scene_number: {scene_number}
    scene_slug: {scene_slug}
    trigger: state_updated
  summary: "Journal checkpoint"
```

Send one `[JOURNAL_CHECKPOINT]` to each player teammate (AI and human-relay). Each player writes their own journal entry. **Do not wait for journal confirmations** — they are fire-and-forget from the team lead's perspective.

### When to Skip Journaling

- If `[STATE_UPDATED]` arrives without a preceding player action cycle (e.g., pure atmospheric narration with a state save), still spawn delta writers but skip `[JOURNAL_CHECKPOINT]`
- Track whether the most recent beat involved player actions to determine this

## Step 8: Handling [SESSION_END]

When the GM sends `[SESSION_END]`:

### Parse the Message

```
[SESSION_END]
summary: |
  The party investigated the warehouse district, discovered the smuggling
  operation, and descended into the tunnels beneath the city.
state_saved: true
next_hook: "The tunnel stretches into darkness. Something is breathing down there."
```

### Shutdown Sequence

See [session-lifecycle.md](session-lifecycle.md) for the full shutdown procedure.

Quick reference:
1. Display the session summary to the human
2. Display the next hook (cliffhanger for next session)
3. Send final `[JOURNAL_CHECKPOINT]` with `trigger: session_end` to all player teammates
4. Wait for any running background tasks to complete
5. Send `shutdown_request` to all teammates (GM, Narrator, all player teammates)
6. After all teammates confirm shutdown, call TeamDelete

## Step 9: Handling [MODE_SWITCH] (Human Player Away/Back)

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

The GM will write delta files and send `[STATE_UPDATED]`.

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

The GM will find a good stopping point, perform a final save, and send `[SESSION_END]`.

## Post-Compaction Recovery

If this skill is invoked after context compaction:

1. You are the team lead for a D&D session using Claude Code Teams
2. Re-read `campaigns/{campaign}/preferences.md` to restore narrative style and player character
3. Read the team config at `~/.claude/teams/dnd-{campaign}/config.json` to verify teammates are still active
4. All teammates (GM, Narrator, player characters) should still be running as persistent teammates
5. Resume the message loop — wait for the next teammate message
6. If unclear what state the session is in, send a `[CONTEXT_REFRESH]` to the GM:

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [CONTEXT_REFRESH]
    campaign: {campaign}
    current_scene: "{latest scene number from scenes/ directory}"
    last_narrative_summary: "Context was compacted. Please recap the current situation."
  summary: "Context refresh after compaction"
```

The GM will re-read its campaign files and provide a recap via `[NARRATIVE]` broadcast.

7. Also send `[CONTEXT_REFRESH]` to any player teammates that seem to have lost context:

```
SendMessage:
  type: message
  recipient: {character}
  content: |
    [CONTEXT_REFRESH]
    campaign: {campaign}
    current_scene: "{scene number}"
    last_narrative_summary: "Context was compacted. Re-read your files."
  summary: "Context refresh for {character}"
```

## Error Handling

### GM Doesn't Respond

If the GM doesn't send any message after a reasonable wait:
1. Send a `[CONTEXT_REFRESH]` message
2. If still no response, check team config to verify GM is active
3. If GM is not active, respawn it with session context

### Player Teammate Stops Responding

If a player teammate goes silent:
1. Check team config to verify it's active
2. If active, send `[CONTEXT_REFRESH]`
3. If not active, respawn with character context. The player's journal serves as durable memory.

### Teammate Goes Down

If a teammate stops unexpectedly:
- **GM**: Respawn with `[CONTEXT_REFRESH]`. GM re-reads campaign files and scene files to recover.
- **Narrator**: Respawn with campaign context. Narrator reads existing scene files to continue numbering.
- **Player teammate**: Respawn with character identity. Re-reads character sheet, party-knowledge, and journal.

### Unrecognized Messages

If a message from a teammate doesn't start with a recognized tag:
- Treat it as informal communication
- Display it to the human if it seems player-facing
- Log a note that an untagged message was received

## Parallelization Guidelines

### What Runs in Parallel

| Task Type | Details |
|-----------|---------|
| **Player teammate spawning** | All player teammates spawn simultaneously at session start |
| **Background agents** | Delta writers, decision-log all spawn in parallel |
| **Journal checkpoints** | All player teammates receive checkpoints simultaneously |
| **GM + Player communication** | Happens directly; team lead not involved |

### What Must Be Sequential

| Dependency | Reason |
|-----------|--------|
| **Team creation before teammate spawning** | Team must exist before spawning members |
| **GM spawned before session-start message** | GM must be active to receive messages |
| **Narrative displayed before human input collected** | Human must read the scene before deciding |
| **Delta files written before journal checkpoints** | Players may re-read party-knowledge during journaling |

### Fire-and-Forget Tasks

These run in background without blocking the session:
- **Decision-log**: Records player decisions
- **Delta writers**: Merge state/knowledge changes
- **Journal entries**: Players self-journal (no orchestration needed beyond the checkpoint signal)

## Scene Flow: PC Actions Before NPC Responses

When the player chooses an action or dialogue approach:

1. **Player chooses approach** -> "I'll try flattery"
2. **GM shows PC's actual words/actions** -> *"Your reputation precedes you, Captain..."*
3. **Then NPC responds** -> The captain's weathered face creases into a half-smile...

Always show what the PC says/does before showing NPC reactions.

## Related Skills

- **messaging-protocol**: Canonical message format reference (all tags, fields, routing)
- **save-point**: Manages session state persistence
- **combat-orchestration**: Special handling for combat encounters
- **quick-or-veto**: AI player reaction pattern (transport-agnostic)
- **narrative-formatting**: Output formatting for narrative display

## Session Lifecycle

For detailed startup, save, and shutdown procedures, see [session-lifecycle.md](session-lifecycle.md).
