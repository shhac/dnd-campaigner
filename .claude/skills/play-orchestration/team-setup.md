# Team Setup and Spawning

Detailed procedures for creating the team and spawning all teammates.

## Step 1: Load Preferences

Before creating the team, check for and load player preferences.

### Read Preferences File

Check if `campaigns/{campaign}/preferences.md` exists.

If the file exists, read it to extract:
- `narrative_style`: The formatting style for dialogue and scenes
- `player_character`: Which character the player controls
- `verbosity`: Output verbosity level (`quiet`, `normal`, or `verbose`)

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

### Handle Verbosity

Verbosity controls how much output the team lead displays to the human during the session.

If `verbosity` is set in preferences:
- Use the stored value

If `verbosity` is NOT set:
- Default to `normal` (do not prompt — this is a power-user setting)

Verbosity can also be passed as a `/play` argument: `/play {campaign} --verbose` or `/play {campaign} --quiet`

**Verbosity levels**:

| Level | Team Lead Displays | Notes |
|-------|-------------------|-------|
| `quiet` | `[NARRATIVE]` text and player prompts only | No system messages, no health check logs, no agent spawn confirmations |
| `normal` | Narrative + prompts + agent lifecycle messages (spawn, shutdown) | Default behavior — current standard |
| `verbose` | Everything in `normal` + health check events, message routing notes, file access audit logs | Debug mode for diagnosing session issues |

The team lead adjusts its own output based on verbosity. It also passes the verbosity level to the GM in the session-start message so the GM can adjust its broadcast detail level.

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

### Spawn Player Teammates

All characters use the same `player-teammate` agent type. The `Control` field determines whether the character is human-controlled (uses `ask_player` MCP for input) or AI-controlled (decides autonomously).

**Human-controlled character** (the player character from preferences):

```
Task:
  subagent_type: player-teammate
  team_name: dnd-{campaign}
  name: {player_character}
  prompt: |
    Campaign: {campaign}
    Character: {player_character}
    Control: HUMAN

    You are {player_character} in the "{campaign}" campaign.
    You are controlled by a human player. When the GM sends you
    [GM_TO_PLAYER], use the ask_player MCP tool to get their input,
    then translate it into in-character actions.

    Read your character files and wait for the session to begin.
```

**AI-controlled characters** (all others):

```
Task:
  subagent_type: player-teammate
  team_name: dnd-{campaign}
  name: {character}
  prompt: |
    Campaign: {campaign}
    Character: {character}
    Control: AI

    You are {character} in the "{campaign}" campaign.
    Read your character files and wait for the session to begin.
```

**Spawn all player teammates in a single message with multiple Task calls** (parallel). The human's character is spawned alongside AI characters — there is no separate agent type.

### File Access Audit (Information Isolation Verification)

After spawning player teammates, the team lead should verify information isolation by logging which files each agent reads at startup. This is a defense-in-depth measure — agents are instructed not to read forbidden files, but the audit catches violations.

**Expected file access per agent**:

| Agent | Allowed Reads | Forbidden Reads |
|-------|--------------|-----------------|
| GM | All campaign files | (none — GM sees everything) |
| Narrator | `preferences.md`, `scenes/`, peer DM activity | `story-state.md`, `npcs/`, character sheets |
| Player teammate | Own character sheet, own journal, `party-knowledge.md`, `world-primer.md` | `story-state.md`, other character sheets, `npcs/`, `beats/` |

**Audit behavior**:
- At `verbose` verbosity: Log each agent's file reads as they are observed (e.g., from teammate idle summaries or tool call reports)
- At `normal` verbosity: Only log if a violation is detected
- At `quiet` verbosity: Only log violations

**If a violation is detected** (player reads `story-state.md`, another character's sheet, or NPC files):
1. Display a warning to the human: `[ISOLATION VIOLATION] {agent} read {forbidden_file}`
2. Consider respawning the agent with a stronger isolation reminder
3. Do NOT shut down the session — the violation may have been harmless (e.g., agent read a filename but not its contents)

**Note**: This audit relies on observing agent behavior through available channels (idle summaries, peer DM visibility). It is not a hard technical enforcement layer — it is a monitoring and alerting system.

### Dashboard Setup

At session start, inform the human:
"A live dashboard is available at `campaigns/{campaign}/tmp/dashboard.md`. Open it in a markdown previewer (VS Code, Obsidian, or browser) for an at-a-glance view of party status, quests, and scene context."

The GM updates this file after each beat.

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
    verbosity: {verbosity}
    ai_characters:
      - {char1}
      - {char2}
      - {char3}
  summary: "Starting session for {campaign}"
```

Wait for the GM's opening `[NARRATIVE]` broadcast.
