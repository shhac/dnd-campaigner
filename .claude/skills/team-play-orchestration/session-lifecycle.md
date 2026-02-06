---
name: team-play-orchestration/session-lifecycle
description: Startup, save, end, and cleanup sequences for Teams-based D&D sessions. Detailed procedures for session lifecycle management.
---

# Session Lifecycle

Detailed procedures for starting, saving, ending, and recovering D&D sessions using Claude Code Teams.

## Session Startup

### Full Startup Sequence

```
1. Validate campaign
2. Load preferences (or ask player)
3. Clean orphaned files
4. Create team
5. Determine AI-controlled characters
6. Spawn GM teammate
7. Spawn Narrator teammate
8. Spawn human-relay player teammate
9. Spawn AI player teammates (parallel)
10. Send session-start to GM
11. Wait for opening [NARRATIVE]
12. Display to human, begin core loop
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

Save any new preferences to the file.

#### 3. Clean Orphaned Files

```bash
rm -f campaigns/{campaign}/tmp/*-delta.md 2>/dev/null || true
```

Do NOT delete `gm-context.md` if it exists — it may contain continuity notes from a previous session that the GM can use.

#### 4. Create Team

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

#### 5. Determine AI Characters

```
List: campaigns/{campaign}/party/*.md (exclude *-journal.md)
Remove: {player_character} from list
Result: AI-controlled character list
```

#### 6. Spawn GM Teammate

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

#### 7. Spawn Narrator Teammate

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

#### 8. Spawn Human-Relay Player Teammate

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

#### 9. Spawn AI Player Teammates

For each AI-controlled character, spawn in parallel:

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

**Spawn all AI player teammates in a single message with multiple Task calls** (parallel).

#### 10. Send Session-Start

```
SendMessage → gm:
  [SESSION_COMMAND]
  command: start
  campaign: {campaign}
  player_character: {player_character}
  narrative_style: {narrative_style}
  ai_characters:
    - {char1}
    - {char2}
```

#### 11-12. Wait and Display

Wait for the GM's opening `[NARRATIVE]` broadcast. Display it to the human. Begin the core loop.

## Session Save

Saves can be triggered by:
- **Human request**: Player says "let's save"
- **GM initiative**: GM determines a save point (end of combat, scene transition, etc.)
- **Automatic**: GM sends `[STATE_UPDATED]` after writing deltas

### Human-Requested Save

When the human asks to save:

```
SendMessage → gm:
  [SESSION_COMMAND]
  command: save
  reason: "Player requested save"
```

The GM will:
1. Write delta files to `tmp/`
2. Send `[STATE_UPDATED]` to team lead
3. Continue the session

### GM-Initiated Save

The GM sends `[STATE_UPDATED]` on its own at save points. The team lead handles it identically to a human-requested save response.

### Processing [STATE_UPDATED]

1. Spawn `state-delta-writer` (background)
2. Spawn `knowledge-delta-writer` (background)
3. Spawn `decision-log` (background, if player actions preceded)
4. Send `[JOURNAL_CHECKPOINT]` to each player teammate (all characters, AI and human-relay):
   ```
   SendMessage → {character}:
     [JOURNAL_CHECKPOINT]
     campaign: {campaign}
     scene_number: {scene_number}
     scene_slug: {scene_slug}
     trigger: state_updated
   ```
5. Continue the session immediately — do not wait for background tasks or journal confirmations

### Tracking Player Action Cycles

To determine if journaling and decision-log are needed:
- Set `last_beat_had_player_actions = true` when you observe that the GM has been receiving `[PLAYER_TO_GM]` messages (via teammate activity indicators or when `[STATE_UPDATED]` arrives after a beat that involved player prompts)
- Set `last_beat_had_player_actions = false` after sending `[JOURNAL_CHECKPOINT]`
- When `[STATE_UPDATED]` arrives, check this flag to decide whether to send checkpoints

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
2. Perform a final save (write deltas, update story-state.md directly)
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
3. **Process any pending [STATE_UPDATED]**: Ensure delta writers are spawned
4. **Send final journal checkpoints**: Send `[JOURNAL_CHECKPOINT]` with `trigger: session_end` to all player teammates
5. **Wait for background tasks**: Give background agents time to complete (check periodically)
6. **Shutdown all teammates**:

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

7. **Wait for shutdown confirmations** from all teammates
8. **Delete team**:

```
TeamDelete
```

9. **Final message to human**: "Session saved. See you next time!"

### Abrupt End (Error Recovery)

If the session needs to end unexpectedly (error, crash, etc.):

1. Send `[SESSION_COMMAND] command: end` to GM if it's still responsive
2. If GM responds with `[SESSION_END]`, follow normal shutdown
3. If GM is unresponsive:
   - Check if delta files exist in `tmp/` and process them manually
   - Force shutdown all teammates
   - TeamDelete
   - Inform the human that the session ended abnormally and state may not be fully saved

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

The `tmp/` directory may still have files from background agents that completed after shutdown. These are harmless and will be cleaned at next session start.

## Quick Reference: Lifecycle Commands

| Human Says | Team Lead Action |
|------------|-----------------|
| "/play-team {campaign}" | Full startup sequence |
| "Let's save" | Send `[SESSION_COMMAND] save` to GM |
| "I want to stop" | Send `[SESSION_COMMAND] end` to GM |
| "I need to step away" | Send `[MODE_SWITCH] AUTONOMOUS` to human's player |
| "I'm back" | Send `[MODE_SWITCH] HUMAN_RELAY` to human's player |
| (context compacted) | Re-read files, send `[CONTEXT_REFRESH]` to GM and players |
| (GM unresponsive) | Try `[CONTEXT_REFRESH]`, then respawn if needed |
