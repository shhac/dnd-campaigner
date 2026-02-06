---
name: team-play-orchestration
description: Core orchestration loop for Teams-based D&D play sessions. Use when orchestrating D&D play sessions via Claude Code Teams, when the GM sends messages to process, when handling [AWAIT_PLAYERS] signals, when asking the player questions via AskUserQuestion, or when context may have been compacted during a long session. This skill survives context compaction.
---

# Team Play Orchestration Skill

Core orchestration logic for running D&D sessions using Claude Code Teams. The team lead creates a persistent team with a GM and Narrator, relays human input, handles structured messages from the GM, spawns ephemeral AI player Tasks, and manages session lifecycle.

**This is a Phase 1 skill.** AI players are ephemeral Tasks. The GM and Narrator are persistent teammates. The team lead is a full orchestrator that handles message routing, AI player coordination, and human I/O.

## When This Skill Activates

Use this skill when:
- Starting a new D&D play session via `/play-team`
- The GM sends a message to the team lead
- Context has been compacted during a long session (re-invoke to restore orchestration patterns)

## Quick Reference: The Orchestration Loop

```
/play-team {campaign}
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
Spawn GM teammate (gm-team agent, persistent)
Spawn Narrator teammate (narrator agent, persistent)
    |
    v
Send session-start to GM ──────────────────────────────┐
    |                                                   |
    v                                                   |
GM broadcasts [NARRATIVE] -> Display to human           |
    |                                                   |
    v                                                   |
Human responds -> Send [PLAYER_ACTION] to GM            |
    |                                                   |
    v                                                   |
GM sends [AWAIT_PLAYERS] -> Spawn ephemeral AI Tasks    |
    |                        Collect responses           |
    v                        Send [PLAYER_RESPONSES]     |
                             to GM                       |
GM broadcasts [NARRATIVE] (with woven AI actions)       |
    |                                                   |
    +---> [STATE_UPDATED] handler:                      |
    |     - state-delta-writer (background)             |
    |     - knowledge-delta-writer (background)         |
    |     - auto-journal (background)                   |
    |     - decision-log (background)                   |
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
2. **Then act**: Process `[AWAIT_PLAYERS]`, `[STATE_UPDATED]`, or `[ASK_PLAYER]` messages
3. **Parallel where possible**: Spawn AI player Tasks AND collect human input simultaneously when both are needed in the same turn

The GM will send messages in this canonical order:
1. `[NARRATIVE]` broadcast (for display and narrator capture)
2. `[AWAIT_PLAYERS]` to team lead (if AI player input needed) OR the narrative ends with a prompt for the human
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

### Spawn GM Teammate

```
Task:
  subagent_type: gm-team
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

### Determine AI-Controlled Characters

List all character sheets in `campaigns/{campaign}/party/` (excluding journal files `*-journal.md`). Remove the player_character from the list. The remaining characters are AI-controlled.

Store this list for use when handling `[AWAIT_PLAYERS]` messages.

### Send Session-Start Message to GM

After both teammates are spawned:

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

The team lead receives messages from teammates (primarily the GM). Process each message based on its tag.

### Receiving Messages

Messages arrive automatically from teammates. Each message from the GM will start with a tag on its own line. Parse the first line to determine the message type.

### Message Dispatch Table

| Tag | Source | Action |
|-----|--------|--------|
| `[NARRATIVE]` | GM (broadcast or direct) | Display to human, collect input if prompted |
| `[AWAIT_PLAYERS]` | GM (direct) | Spawn ephemeral AI Tasks, collect responses, send `[PLAYER_RESPONSES]` to GM |
| `[ASK_PLAYER]` | GM (direct) | Convert to AskUserQuestion, send `[PLAYER_ANSWER]` to GM |
| `[STATE_UPDATED]` | GM (direct) | Spawn background delta writers + journal agents |
| `[SESSION_END]` | GM (direct) | Display summary, shutdown team |

**Note on `[NARRATIVE]` delivery**: Normally the GM broadcasts `[NARRATIVE]` to all teammates. However, during **split party** scenarios, the GM sends `[NARRATIVE]` as a **direct message** to the team lead (not broadcast) to avoid leaking group-specific narrative to all players. Handle both delivery methods identically — strip the tag and display to the human.

## Step 4: Handling [NARRATIVE] Broadcasts

When the GM broadcasts a `[NARRATIVE]` message:

1. **Strip the `[NARRATIVE]` tag** from the content
2. **Display the FULL narrative to the human** — show everything, summarize nothing
3. Use proper formatting (see Formatting Guidelines below)
4. **If the narrative ends with a prompt** (e.g., "What do you do?"):
   - Use AskUserQuestion to collect the human's response
   - Send the response to the GM as `[PLAYER_ACTION]`

### Formatting Guidelines

| Content Type | Format | Example |
|-------------|--------|---------|
| **Character speech** | Blockquote with bold name | > **Gideon**: "Shall we investigate?" |
| **GM narration** | Plain text, italics for emphasis | The tavern falls quiet. *Something about his bearing demands attention.* |
| **Character actions** | Italics | *Mira reaches for her blade.* |
| **Dice results** | Code formatting | `Perception check: 14 + 3 = 17` |
| **GM notes/mechanics** | Parenthetical | (DC 15 - Success) |

### Sending Human Input to GM

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [PLAYER_ACTION]
    character: {player_character}
    action: "{human's response}"
  summary: "{player_character} acts"
```

### Sending Dice Results to GM

When the team lead rolls dice for the human player (e.g., ability checks, attack rolls), send the result to the GM:

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

Use the `toss` CLI (via the dice-roll skill) to perform the roll, then format and send the result.

### AskUserQuestion for Player Actions

When the narrative prompts for player input:

```
AskUserQuestion:
  question: "What do you do?"
  header: "Action"
  options:
    - label: "Investigate"
      description: "Look around, search for clues"
    - label: "Talk"
      description: "Speak to someone present"
    - label: "Attack"
      description: "Initiate combat"
    - label: "Move"
      description: "Go somewhere else"
```

The player can always type a custom response via "Other".

## Step 5: Handling [AWAIT_PLAYERS] (Phase 1 — Ephemeral AI Tasks)

When the GM sends `[AWAIT_PLAYERS]`, it contains structured data for each AI character that needs to respond.

### Parse the Message

The `[AWAIT_PLAYERS]` message contains YAML-like structured data:

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

### Spawn Ephemeral AI Player Tasks

For each character in the `[AWAIT_PLAYERS]` message, spawn an `ai-player-action` Task. **Spawn ALL characters in a single message with multiple Task tool calls** (parallel).

```
Task (for each character):
  subagent_type: ai-player-action
  prompt: |
    Campaign: {campaign}
    Character: {character_name}
    Scene: {scene_number} - {scene_slug}

    [GM_TO_PLAYER]
    request_type: {request_type}
    scene_number: {scene_number}
    scene_slug: {scene_slug}

    ## Scene
    {scene_context}

    ## Just Happened
    {just_happened}

    ## Request
    {request}
```

**Information isolation**: The team lead passes ONLY the per-character context from the `[AWAIT_PLAYERS]` message. Each AI player receives only what the GM determined they should know.

### Collect Responses

Wait for all AI player Tasks to complete. Each returns a response (action, dialogue, or veto).

### Send Bundled Responses to GM

```
SendMessage:
  type: message
  recipient: gm
  content: |
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
  summary: "AI player responses collected"
```

If any player vetoed, include them in the `vetoes` section. The GM will handle re-prompting by sending a new `[AWAIT_PLAYERS]` for just that character with `request_type: FULL_CONTEXT`.

### Decision-Log (Fire-and-Forget)

After collecting AI responses and before sending `[PLAYER_RESPONSES]` to the GM, spawn a decision-log agent in the background:

```
Task:
  subagent_type: decision-log
  run_in_background: true
  prompt: |
    Campaign: {campaign}
    Characters involved: {character_list}
    Scene: {scene_number} - {scene_slug}

    Record the following AI player decisions:

    {paste each character's response here}
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

When the GM sends `[STATE_UPDATED]`, it means delta files have been written to `campaigns/{campaign}/tmp/`. Spawn background agents to process them.

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

### Auto-Journaling (Phase 1)

When `[STATE_UPDATED]` arrives after an AI action cycle (i.e., after the GM processed `[PLAYER_RESPONSES]` and broadcast narrative), trigger auto-journaling.

**Step 1: Write Narrative File (Foreground)**

Spawn a `narrative-writer` agent (NOT background) to write the most recent GM narrative:

```
Task:
  subagent_type: narrative-writer
  prompt: |
    Campaign: {campaign}

    ## Narrative

    {paste the full GM narrative from the most recent [NARRATIVE] broadcast}
```

Wait for this to complete.

**Step 2: Spawn Journal Agents (Background)**

For each character in the party (AI-controlled AND human-controlled):

```
Task:
  subagent_type: ai-player-journal
  run_in_background: true
  prompt: |
    Campaign: {campaign}
    Character: {character}
    Scene: {scene_number} - {scene_slug}
```

### When to Skip Journaling

- If `[STATE_UPDATED]` arrives without a preceding AI action cycle (e.g., pure human-GM interaction with a state save), still spawn delta writers but skip journal agents
- Track whether the most recent turn involved AI players to determine this

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
3. Wait for any running background tasks to complete
4. Send `shutdown_request` to GM
5. Send `shutdown_request` to Narrator
6. After all teammates confirm shutdown, call TeamDelete

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
4. The GM and Narrator should still be running as persistent teammates
5. Resume the message loop — wait for the next GM message
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

## Error Handling

### GM Doesn't Respond

If the GM doesn't send any message after a reasonable wait:
1. Send a `[CONTEXT_REFRESH]` message
2. If still no response, check team config to verify GM is active
3. If GM is not active, respawn it with session context

### AI Player Task Fails

If some AI player Tasks fail or timeout:
- Send `[PLAYER_RESPONSES]` with available responses only
- Note which characters failed to respond
- The GM will handle missing responses narratively

### Teammate Goes Down

If a teammate stops unexpectedly:
- **GM**: Respawn with `[CONTEXT_REFRESH]`. GM re-reads campaign files and scene files to recover.
- **Narrator**: Respawn with campaign context. Narrator reads existing scene files to continue numbering.

### Unrecognized Messages

If a message from the GM doesn't start with a recognized tag:
- Treat it as informal communication
- Display it to the human if it seems player-facing
- Log a note that an untagged message was received

## Parallelization Guidelines

### What Runs in Parallel

| Task Type | Details |
|-----------|---------|
| **AI player Tasks** | All characters in an `[AWAIT_PLAYERS]` batch spawn simultaneously |
| **Background agents** | Delta writers, journal agents, decision-log all spawn in parallel |
| **Human input + AI Tasks** | When GM needs both, collect human input and spawn AI Tasks simultaneously |

### What Must Be Sequential

| Dependency | Reason |
|-----------|--------|
| **Team creation before teammate spawning** | Team must exist before spawning members |
| **GM spawned before session-start message** | GM must be active to receive messages |
| **Narrative displayed before input collected** | Human must read the scene before deciding |
| **AI responses collected before sending to GM** | GM needs all responses to continue |
| **Narrative file written before journal agents** | Journals need the narrative content |

### Fire-and-Forget Tasks

These run in background without blocking the session:
- **Decision-log**: Records AI decisions
- **Journal agents**: Write character memories
- **Delta writers**: Merge state/knowledge changes
- **Narrative-writer**: Writes narrative file for journals (foreground, but brief)

## Scene Flow: PC Actions Before NPC Responses

When the player chooses an action or dialogue approach:

1. **Player chooses approach** -> "I'll try flattery"
2. **GM shows PC's actual words/actions** -> *"Your reputation precedes you, Captain..."*
3. **Then NPC responds** -> The captain's weathered face creases into a half-smile...

Always show what the PC says/does before showing NPC reactions.

## Related Skills

- **save-point**: Manages session state persistence
- **combat-orchestration**: Special handling for combat encounters
- **quick-or-veto**: AI player reaction pattern (transport-agnostic)
- **narrative-formatting**: Output formatting for narrative display
- **auto-journal**: Background journaling process (still used in Phase 1 for ephemeral players)
- **invoke-ai-players**: Legacy AI player spawning (NOT used in Teams mode — replaced by direct Task spawning from `[AWAIT_PLAYERS]` data)

## Session Lifecycle

For detailed startup, save, and shutdown procedures, see [session-lifecycle.md](session-lifecycle.md).
