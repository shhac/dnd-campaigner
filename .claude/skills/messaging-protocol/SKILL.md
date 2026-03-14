---
name: messaging-protocol
description: >
  Canonical reference for the structured message protocol used by all Teams-based D&D agents.
  This overview file defines shared conventions and a quick reference table.
  Role-specific details are in separate files:
  gm-protocol.md, player-protocol.md, narrator-protocol.md, orchestrator-protocol.md.
  Message tags: [NARRATIVE], [GM_TO_PLAYER], [PLAYER_TO_GM], [PLAYER_TO_PLAYER],
  [PLAYER_TO_PARTY], [RELAY_TO_HUMAN], [SESSION_END], [SESSION_COMMAND], [COMMAND_ACK],
  [ASK_PLAYER], [NARRATOR_NOTE], [NARRATOR_REQUEST], [NPC_SPAWN_REQUEST], [NPC_SPAWNED],
  [NPC_DESPAWN_REQUEST], [NPC_DESPAWNED], [PROTOCOL_WARNING], [DICE_RESULT],
  [PLAYER_ANSWER], [CONTEXT_REFRESH], [HUMAN_DECISION], [MODE_SWITCH], [ACTIVITY].
---

# Messaging Protocol — Overview

Canonical reference for all structured message types used in Teams-based D&D sessions. All teammate communication uses structured YAML-like tags in `SendMessage` content.

**This skill is the single source of truth.** Role-specific files contain the details each agent needs.

## Protocol Conventions

- Tags appear on the **first line** of message content (e.g., `[NARRATIVE]`)
- Payload fields use **YAML-like** `key: value` syntax after the tag line
- Multi-line values use YAML block scalar syntax (`|`)
- Recipients parse the first line to determine message type
- Unrecognized tags should be treated as informal communication
- All messages use **full hyphenated character names** matching the character sheet filename (e.g., `tilda-brannock`, not `Tilda` or `Tilda Brannock`)

## Quick Reference Table

| Tag | Sender | Recipient | Transport |
|-----|--------|-----------|-----------|
| `[NARRATIVE]` | GM | All (broadcast) | broadcast |
| `[GM_TO_PLAYER]` | GM | Specific player | message |
| `[ASK_PLAYER]` | GM | Team lead | message |
| `[SESSION_END]` | GM | Team lead | message |
| `[COMMAND_ACK]` | GM | Team lead | message |
| `[NARRATOR_NOTE]` | GM or Player | Narrator | message |
| `[DICE_RESULT]` | Team lead | GM | message |
| `[PLAYER_ANSWER]` | Team lead | GM | message |
| `[SESSION_COMMAND]` | Team lead | GM | message |
| `[CONTEXT_REFRESH]` | Team lead | Any teammate | message |
| `[HUMAN_DECISION]` | Team lead | Human's player teammate | message |
| `[MODE_SWITCH]` | Team lead | Human's player teammate | message |
| `[PLAYER_TO_GM]` | Player teammate | GM | message |
| `[PLAYER_TO_PLAYER]` | Player teammate | Player teammate | message |
| `[PLAYER_TO_PARTY]` | Player teammate | All (broadcast) | broadcast |
| `[RELAY_TO_HUMAN]` | Human's player teammate | Team lead | message |
| `[NARRATOR_REQUEST]` | Narrator | GM | message |
| `[NPC_SPAWN_REQUEST]` | GM | Team lead | message |
| `[NPC_SPAWNED]` | Team lead | GM | message |
| `[NPC_DESPAWN_REQUEST]` | GM | Team lead | message |
| `[NPC_DESPAWNED]` | Team lead | GM | message |
| `[ACTIVITY]` | Player teammate | Team lead | message |
| `[PROTOCOL_WARNING]` | Any teammate | Any teammate | message |

## Role-Specific Files

| File | Who reads it | Contains |
|------|-------------|----------|
| `gm-protocol.md` | GM agent | Messages GM sends and receives, dice roll formatting, GM-specific rules |
| `player-protocol.md` | Player teammates (AI and human-relay) | Messages players send and receive, dice result formatting, veto/ICE rules |
| `narrator-protocol.md` | Narrator agent | Messages narrator observes, what to ignore, scene file conventions |
| `orchestrator-protocol.md` | Team lead | Messages team lead routes, session commands, NPC lifecycle, health checks |

## Standard Beat Sequence

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

## Dice Roll Conventions

Dice roll formatting (Roll Required blocks, roll results, NPC rolls) is documented in the role-specific files:
- **GM**: `gm-protocol.md` § Dice Roll Formatting
- **Players**: `player-protocol.md` § Reporting Roll Results

## Processing Order

When the GM sends multiple messages in sequence:

1. **Display first**: Always display `[NARRATIVE]` to the human immediately
2. **Then act**: Process `[ASK_PLAYER]`, `[RELAY_TO_HUMAN]`
