---
name: play-orchestration
description: Core orchestration loop for Teams-based D&D play sessions. Use when orchestrating D&D play sessions via Claude Code Teams, when the GM sends messages to process, when asking the player questions via AskUserQuestion, or when context may have been compacted during a long session. This skill survives context compaction.
---

# Play Orchestration Skill

Core orchestration logic for running D&D sessions using Claude Code Teams. The team lead is a **lightweight delegate** — it creates the team, spawns all teammates (GM, Narrator, and player characters), displays narrative to the human, and manages session lifecycle. Human input for player characters is handled by the player agent via the `ask_player` CLI (Bash tool). The GM and players communicate directly; the team lead does NOT relay messages between them.

## When This Skill Activates

Use this skill when:
- Starting a new D&D play session via `/play`
- A teammate sends a message to the team lead (session end, activity pings)
- Context has been compacted during a long session (re-invoke to restore orchestration patterns)

## Quick Reference: The Orchestration Loop

```
/play {campaign}
    |
    v
Load Preferences (or ask player)
    |
    v
TeamCreate: dnd-{campaign}
    |
    v
Spawn GM, Narrator, Player teammates
    |
    v
Send session-start to GM
    |
    v
Core Message Loop:
  [NARRATIVE]      -> Display to human
  [ASK_PLAYER]     -> Convert to AskUserQuestion, send answer
  [SESSION_END]    -> Shutdown sequence
  [ACTIVITY]       -> Update activity display
    |
    v
Loop until [SESSION_END]
```

## Message Sequencing Rules

**CRITICAL**: When the GM sends multiple messages in sequence, process them in this order:

1. **Display first**: Always display `[NARRATIVE]` to the human immediately upon receipt
2. **Then act**: Process `[ASK_PLAYER]` and other actionable messages
3. **No relay needed for player I/O**: The GM and players communicate directly. Human input is handled by the player agent via the `ask_player` CLI.

## Detailed Procedures

Load the relevant sub-file based on what you need:

| Procedure | File | When to Load |
|-----------|------|-------------|
| Team creation and spawning | [team-setup.md](team-setup.md) | Session startup |
| Message handling (all types) | [message-handling.md](message-handling.md) | Core loop, processing any message |
| Error handling and health checks | [error-handling.md](error-handling.md) | When a teammate is unresponsive |
| Activity visualization | [activity-display.md](activity-display.md) | Between narrative beats |
| Full-auto mode (all AI) | [full-auto.md](full-auto.md) | When running without a human player |
| State file ownership | [state-ownership.md](state-ownership.md) | When checking who writes what |
| Session lifecycle (startup/save/end) | [session-lifecycle.md](session-lifecycle.md) | Session start, save, end, recovery |

## Parallelization Guidelines

### What Runs in Parallel

| Task Type | Details |
|-----------|---------|
| **Player teammate spawning** | All player teammates spawn simultaneously at session start |
| **GM + Player communication** | Happens directly; team lead not involved |

### What Must Be Sequential

| Dependency | Reason |
|-----------|--------|
| **Team creation before teammate spawning** | Team must exist before spawning members |
| **GM spawned before session-start message** | GM must be active to receive messages |
| **Narrative displayed before human input collected** | Human must read the scene before deciding |

## Scene Flow: PC Actions Before NPC Responses

When the player chooses an action or dialogue approach:

1. **Player chooses approach** -> "I'll try flattery"
2. **GM shows PC's actual words/actions** -> *"Your reputation precedes you, Captain..."*
3. **Then NPC responds** -> The captain's weathered face creases into a half-smile...

Always show what the PC says/does before showing NPC reactions.

## Post-Compaction Recovery

If this skill is invoked after context compaction:

1. You are the team lead for a D&D session using Claude Code Teams
2. Re-read `campaigns/{campaign}/preferences.md` to restore narrative style and player character
3. All teammates (GM, Narrator, player characters) should still be running as persistent teammates
4. Resume the message loop — wait for the next teammate message
5. If unclear what state the session is in, send a `[CONTEXT_REFRESH]` to the GM
6. See [session-lifecycle.md](session-lifecycle.md) for full compaction recovery details

## Related Skills

- **messaging-protocol**: Canonical message format reference (all tags, fields, routing)
- **save-point**: Manages session state persistence
- **combat-orchestration**: Special handling for combat encounters
- **quick-or-veto**: AI player reaction pattern (transport-agnostic)
- **narrative-formatting**: Output formatting for narrative display
