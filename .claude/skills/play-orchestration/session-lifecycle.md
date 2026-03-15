---
name: play-orchestration/session-lifecycle
description: Startup, save, end, and cleanup sequences for Teams-based D&D sessions. Detailed procedures for session lifecycle management.
---

# Session Lifecycle

Detailed procedures for starting, saving, ending, and recovering D&D sessions using Claude Code Teams.

## Session Startup

### Full Startup Sequence

```
1. Validate campaign
2. Load preferences (or ask player) — includes verbosity setting
3. Create team
4. Determine AI-controlled characters
5. Spawn GM teammate
6. Spawn Narrator teammate
7. Spawn all player teammates (parallel) — human's character uses Control: HUMAN, AI characters use Control: AI
8. File access audit (verify information isolation)
9. Send session-start to GM (includes verbosity)
10. Wait for opening [NARRATIVE]
11. Display to human, begin core loop + health checks
```

### Step-by-Step

#### 1. Validate Campaign

```
Check: campaigns/{campaign}/ directory exists
Read: campaigns/{campaign}/overview.md (confirm valid campaign)
```

If the campaign doesn't exist, inform the player and suggest `/new-campaign`.

#### 2. Load Preferences

Read `campaigns/{campaign}/preferences.md` for:
- `narrative_style` — if missing, ask via AskUserQuestion
- `player_character` — if missing, list party members and ask via AskUserQuestion
- `verbosity` — if missing, default to `normal` (do not prompt; can be overridden via `/play` argument: `--quiet` or `--verbose`)

Save any new preferences to the file.

#### 3. Create Team

```
TeamCreate:
  team_name: dnd-{campaign}
  description: "D&D session for {campaign}"
```

**If team already exists**: Ask the player:

```
AskUserQuestion:
  question: "A session for this campaign is already active. What would you like to do?"
  header: "Session"
  options:
    - label: "Resume"
      description: "Reconnect to the existing session"
    - label: "Start fresh"
      description: "End the old session and start a new one"
```

If "Start fresh": TeamDelete the old team first, then TeamCreate.
If "Resume": Skip to step 10 (re-read team config to find existing teammates).

#### 4. Determine AI Characters

```
List: campaigns/{campaign}/party/*.md (exclude *-journal.md)
Remove: {player_character} from list
Result: AI-controlled character list
```

#### 5. Spawn GM Teammate

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

#### 6. Spawn Narrator Teammate

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

#### 7. Spawn All Player Teammates

Spawn all player teammates in parallel. The human's character and AI characters both use the `player-teammate` agent type. The human's character is distinguished by `Control: HUMAN` (it uses the `ask_player` MCP tool to get human input).

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
    The human player controls you. Use the ask_player MCP tool
    to get human input when the GM prompts you, then translate
    the human's decisions into in-character actions.

    Read your character files and wait for the session to begin.
```

For each AI-controlled character:

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

**Spawn all player teammates in a single message with multiple Task calls** (parallel).

#### 8. Send Session-Start

```
SendMessage → gm:
  [SESSION_COMMAND]
  command: start
  campaign: {campaign}
  player_character: {player_character}
  narrative_style: {narrative_style}
  verbosity: {verbosity}
  ai_characters:
    - {char1}
    - {char2}
```

#### 9-10. Wait and Display

Wait for the GM's opening `[NARRATIVE]` broadcast. Display it to the human. Begin the core loop.

## Session Save

Saves are handled directly by the GM:
- **Human request**: Player says "let's save" — team lead sends `[SESSION_COMMAND] save` to GM
- **GM initiative**: GM saves at natural beat boundaries (end of combat, scene transition, etc.)

The GM updates `story-state.md` and `party-knowledge.md` directly. No intermediate delta files or background agents are needed for state persistence.

**Write ownership**: The GM is the sole writer of `story-state.md`, `party-knowledge.md`, and `relationships.md`. The team lead never writes these files. See "State File Ownership" in the main orchestration skill for the full ownership table and recommended atomic write pattern.

### Human-Requested Save

When the human asks to save:

```
SendMessage → gm:
  [SESSION_COMMAND]
  command: save
  reason: "Player requested save"
```

The GM will update `story-state.md` and `party-knowledge.md` directly and continue the session.

## Session End

### Graceful End (Human-Initiated)

When the human says "I want to stop" or "let's end the session":

```
SendMessage → gm:
  [SESSION_COMMAND]
  command: end
  reason: "Player wants to end the session"
```

The GM will:
1. Find a narratively appropriate stopping point
2. Update `story-state.md` and `party-knowledge.md` directly
3. Send `[SESSION_END]` with summary and next_hook

### Processing [SESSION_END]

```
[SESSION_END]
summary: |
  The party investigated the warehouse district, discovered the smuggling
  operation, and descended into the tunnels beneath the city.
state_saved: true
next_hook: "The tunnel stretches into darkness. Something is breathing down there."
```

1. **Display summary**: Show the session summary to the human
2. **Display next hook**: Show the cliffhanger/hook for the next session
3. **Spawn decision-log** (background): Record session decisions for context reconstruction
4. **Shutdown all teammates**:

```
SendMessage:
  type: shutdown_request
  recipient: gm
  content: "Session ended. Shutting down."

SendMessage:
  type: shutdown_request
  recipient: narrator
  content: "Session ended. Shutting down."

SendMessage:
  type: shutdown_request
  recipient: {player_character_1}
  content: "Session ended. Shutting down."

SendMessage:
  type: shutdown_request
  recipient: {player_character_2}
  content: "Session ended. Shutting down."

(... for each player teammate)
```

5. **Wait for shutdown confirmations** from all teammates
6. **Delete team**:

```
TeamDelete
```

7. **Final message to human**: "Session saved. See you next time!"

### Abrupt End (Error Recovery)

If the session needs to end unexpectedly (error, crash, etc.):

1. Send `[SESSION_COMMAND] command: end` to GM if it's still responsive
2. If GM responds with `[SESSION_END]`, follow normal shutdown
3. If GM is unresponsive (detected by health check — no response for 120+ seconds, then no response to `[CONTEXT_REFRESH]` after 30 seconds):
   - Force shutdown all teammates
   - TeamDelete
   - Inform the human that the session ended abnormally and state may not be fully saved

**Note**: Health checks (see main orchestration skill) may trigger this path automatically if the GM crashes mid-session and cannot be respawned.

## Context Compaction Recovery

### Detecting Compaction

You may lose context during long sessions. Signs:
- You don't remember the campaign name or preferences
- You don't remember which characters are player teammates
- You don't remember what the last narrative was about

### Recovery Procedure

1. **Re-read preferences**: `campaigns/{campaign}/preferences.md`
2. **Re-read team config**: `~/.claude/teams/dnd-{campaign}/config.json` to verify teammates
3. **Re-read latest scene file**: `campaigns/{campaign}/scenes/` (highest numbered file)
4. **Send context refresh to GM**:

```
SendMessage → gm:
  [CONTEXT_REFRESH]
  campaign: {campaign}
  current_scene: "{scene number from scenes/}"
  last_narrative_summary: "Context compacted. Please recap."
```

5. **Send context refresh to player teammates** if needed:

```
SendMessage → {character}:
  [CONTEXT_REFRESH]
  campaign: {campaign}
  current_scene: "{scene number}"
  last_narrative_summary: "Context was compacted. Re-read your files."
```

6. **Resume core loop**: The GM will broadcast a `[NARRATIVE]` recap

### Teammate Compaction Recovery

Teammates may also experience compaction. Each teammate handles its own recovery:
- **GM**: Re-reads campaign files and scene files. May ask for a `[CONTEXT_REFRESH]` if confused.
- **Narrator**: Re-reads existing scene files and continues numbering.
- **Player teammates**: Re-read character sheet, party-knowledge, and journal. Journal entries serve as durable memory across context boundaries.

## Team Cleanup

After TeamDelete, verify cleanup:

```
Check: ~/.claude/teams/dnd-{campaign}/ should not exist
Check: ~/.claude/tasks/dnd-{campaign}/ should not exist
```

Campaign files (`campaigns/{campaign}/`) are NOT deleted — they persist between sessions.

## Quick Reference: Lifecycle Commands

| Human Says | Team Lead Action |
|------------|-----------------|
| "/play {campaign}" | Full startup sequence |
| "/play {campaign} --quiet" | Startup with quiet verbosity (narrative + prompts only) |
| "/play {campaign} --verbose" | Startup with verbose verbosity (debug output) |
| "Let's save" | Send `[SESSION_COMMAND] save` to GM |
| "I want to stop" | Send `[SESSION_COMMAND] end` to GM |
| (context compacted) | Re-read files, send `[CONTEXT_REFRESH]` to GM and players |
| (GM unresponsive) | Try `[CONTEXT_REFRESH]`, then respawn if needed |

## Quick Reference: Automated Monitoring

| Condition | Timeout | Action |
|-----------|---------|--------|
| GM silent (mid-scene) | 120s | Send `[CONTEXT_REFRESH]`, wait 30s, then respawn |
| Player no response to GM prompt | 90s | Nudge with `[CONTEXT_REFRESH]` |
| Player still no response | 180s | Respawn agent, notify GM via `[SYSTEM_NOTE]` |
| File isolation violation detected | immediate | Warn human, consider respawn |
