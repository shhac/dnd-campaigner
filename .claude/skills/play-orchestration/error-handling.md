# Error Handling and Health Checks

Monitoring, recovery, and error handling procedures for the team lead.

## Agent Health Checks (Heartbeat)

The team lead monitors critical teammates for liveness during the session. This prevents silent crashes from stalling gameplay indefinitely.

**Tracked agents** (critical):
- GM
- Human-relay player (if present)

**Health check rules**:
- Track the timestamp of the last message received from each critical teammate
- After any period of **120 seconds** with no message from a critical teammate, take action:
  1. Send a `[CONTEXT_REFRESH]` to the silent teammate
  2. Wait 30 seconds for a response
  3. If still silent, assume the teammate has crashed — respawn it (see "Teammate Goes Down" below)
- Non-critical teammates (AI players, narrator) do not need proactive health checks — the GM will notice if a player stops responding and can request help

**When to check**: After processing each incoming message, note the current time. If more than 120 seconds have elapsed since the last message from a critical teammate AND the session is mid-scene (not during expected idle periods like human input), trigger the health check.

**Expected idle periods** (do NOT trigger health checks during these):
- While waiting for human input via `[RELAY_TO_HUMAN]` / AskUserQuestion
- During session startup (teammates loading campaign files)
- After sending `[SESSION_COMMAND] end` (GM is wrapping up)

## Player Response Timeout

When the GM sends `[GM_TO_PLAYER]` prompts, players should respond within a reasonable window. The team lead monitors for stalls.

**Timeout rules**:
- **90 seconds** after a `[GM_TO_PLAYER]` is sent to any player: If no `[PLAYER_TO_GM]` response has been received, send a nudge to the silent player:

```
SendMessage:
  type: message
  recipient: {silent_player}
  content: |
    [CONTEXT_REFRESH]
    campaign: {campaign}
    note: "The GM is waiting for your response. Please reply with your action."
  summary: "Nudge {silent_player} to respond"
```

- **180 seconds** with no response: Assume the player teammate has crashed. Trigger respawn (see "Teammate Goes Down" below). Notify the GM:

```
SendMessage:
  type: message
  recipient: gm
  content: |
    [SYSTEM_NOTE]
    agent: {silent_player}
    status: respawning
    reason: "No response for 180 seconds. Agent is being respawned."
  summary: "{silent_player} being respawned"
```

**Note**: The team lead does not directly observe `[GM_TO_PLAYER]` messages (they flow directly between GM and players). The team lead infers player responsiveness by monitoring whether the session is progressing. If the GM reports a stalled player, or if the GM itself goes silent after sending prompts, the team lead should investigate.

## GM Doesn't Respond

If the GM doesn't send any message after 120 seconds (and no expected idle period applies):
1. Send a `[CONTEXT_REFRESH]` message
2. Wait 30 seconds for a response
3. If still no response, respawn the GM with session context (see "Teammate Goes Down")

## Player Teammate Stops Responding

If a player teammate goes silent and the GM reports a stall:
1. Send `[CONTEXT_REFRESH]` to the player
2. Wait 30 seconds for a response
3. If still silent, respawn with character context. The player's journal serves as durable memory.

## Teammate Goes Down

If a teammate stops unexpectedly or fails to respond after health check + nudge:
- **GM**: Respawn with `[CONTEXT_REFRESH]`. GM re-reads campaign files and scene files to recover.
- **Narrator**: Respawn with campaign context. Narrator reads existing scene files to continue numbering.
- **Player teammate**: Respawn with character identity. Re-reads character sheet, party-knowledge, and journal.

After respawning any teammate, log the event:
```
[Health Check] {teammate_name} respawned at {timestamp} — reason: {no response / crash detected}
```

## Unrecognized Messages

If a message from a teammate doesn't start with a recognized tag:
- Treat it as informal communication
- Display it to the human if it seems player-facing
- Log a note that an untagged message was received
