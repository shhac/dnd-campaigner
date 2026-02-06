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
5. Spawn GM teammate
6. Spawn Narrator teammate
7. Determine AI-controlled characters
8. Send session-start to GM
9. Wait for opening [NARRATIVE]
10. Display to human, begin core loop
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
If "Resume": Skip to step 8 (re-read team config to find existing teammates).

#### 5. Spawn GM Teammate

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

#### 7. Determine AI Characters

```
List: campaigns/{campaign}/party/*.md (exclude *-journal.md)
Remove: {player_character} from list
Result: AI-controlled character list
```

#### 8. Send Session-Start

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

#### 9-10. Wait and Display

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
3. If this follows an AI action cycle, trigger auto-journaling:
   a. Spawn `narrative-writer` (foreground, brief)
   b. Spawn journal agents for all characters (background)
   c. Spawn `decision-log` (background)
4. Continue the session immediately — do not wait for background tasks

### Tracking AI Action Cycles

To determine if journaling is needed, maintain a simple flag:
- Set `last_turn_had_ai_actions = true` when you process `[AWAIT_PLAYERS]` and send `[PLAYER_RESPONSES]`
- Set `last_turn_had_ai_actions = false` after triggering auto-journal
- When `[STATE_UPDATED]` arrives, check this flag

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
3. **Process any pending [STATE_UPDATED]**: Ensure delta writers and journals are spawned
4. **Wait for background tasks**: Give background agents time to complete (check periodically)
5. **Shutdown teammates**:

```
SendMessage:
  type: shutdown_request
  recipient: gm
  content: "Session ended. Shutting down."

SendMessage:
  type: shutdown_request
  recipient: narrator
  content: "Session ended. Shutting down."
```

6. **Wait for shutdown confirmations** from both teammates
7. **Delete team**:

```
TeamDelete
```

8. **Final message to human**: "Session saved. See you next time!"

### Abrupt End (Error Recovery)

If the session needs to end unexpectedly (error, crash, etc.):

1. Send `[SESSION_COMMAND] command: end` to GM if it's still responsive
2. If GM responds with `[SESSION_END]`, follow normal shutdown
3. If GM is unresponsive:
   - Check if delta files exist in `tmp/` and process them manually
   - Force shutdown teammates
   - TeamDelete
   - Inform the human that the session ended abnormally and state may not be fully saved

## Context Compaction Recovery

### Detecting Compaction

You may lose context during long sessions. Signs:
- You don't remember the campaign name or preferences
- You don't remember which characters are AI-controlled
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

5. **Resume core loop**: The GM will broadcast a `[NARRATIVE]` recap

### Teammate Compaction Recovery

Teammates may also experience compaction. The team lead does not need to detect this — each teammate handles its own recovery:
- **GM**: Re-reads campaign files and scene files. May ask for a `[CONTEXT_REFRESH]` if confused.
- **Narrator**: Re-reads existing scene files and continues numbering.
- **AI players** (Phase 1): Ephemeral Tasks, so compaction doesn't apply.

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
| (context compacted) | Re-read files, send `[CONTEXT_REFRESH]` to GM |
| (GM unresponsive) | Try `[CONTEXT_REFRESH]`, then respawn if needed |
