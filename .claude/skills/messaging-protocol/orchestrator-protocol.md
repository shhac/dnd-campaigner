# Team Lead (Orchestrator) Protocol Reference

Messages the team lead handles. The team lead manages session lifecycle, displays narrative to the human, and handles NPC spawning. It does NOT relay GM-player messages — they communicate directly. Human input for player characters is handled by the player agent via the `ask_player` CLI (Bash tool). For conventions and quick reference, see `SKILL.md`.

## Messages Received from GM

### `[NARRATIVE]` (broadcast or direct during split party)

**Action:** Strip tag, display prose to human immediately.

### `[ASK_PLAYER]`

Structured question for human. Fields: `question`, `header`, `options` (array of `{label, description}`).

**Action:** Convert to `AskUserQuestion`. Send human's answer as `[PLAYER_ANSWER]` to GM.

### `[SESSION_END]`

Fields: `summary`, `state_saved`, `next_hook`.

**Action:** Display summary and hook to human. Shut down all teammates. Call `TeamDelete`.

### `[COMMAND_ACK]`

GM acknowledges `[SESSION_COMMAND]`. Fields: `command`, `estimated_turns` (optional), `message` (optional).

**Action:** Note acknowledgment. If none received within 60s of `[SESSION_COMMAND]`, resend.

### `[NPC_SPAWN_REQUEST]`

Fields: `npc`, `npc_file`, `reason`, `knowledge_boundary`, `scene_context`.

**Action:** Spawn NPC teammate per play-orchestration skill. Confirm with `[NPC_SPAWNED]` (fields: `npc`, `teammate_name`).

### `[NPC_DESPAWN_REQUEST]`

Fields: `npc`, `reason` (optional).

**Action:** Send `shutdown_request` to NPC teammate. Confirm with `[NPC_DESPAWNED]` (fields: `npc`).

---

## Messages Received from Players

### `[ACTIVITY]` — from player teammates

Lightweight status ping. Fields: `character`, `doing`.
Action: Update activity display (see Activity Visualization in play-orchestration skill).
Fire-and-forget — no confirmation needed.

### `[PLAYER_TO_PARTY]` — from player teammates (broadcast)

In-character speech addressed to the whole group. Fields: `character`, `content`.
Action: Display to human as in-character speech (see message-handling.md).
Fire-and-forget — no confirmation needed.

---

## Messages Team Lead Sends

### `[SESSION_COMMAND]` — to GM

```
[SESSION_COMMAND]
command: start | save | end
reason: "Player wants to stop for the night"
```

Start command additional fields: `campaign`, `player_character`, `narrative_style`, `ai_characters`.

### `[PLAYER_ANSWER]` — to GM

Fields: `question` (original), `answer` (human's selection).

### `[DICE_RESULT]` — to GM

Roll outcome for human player. Fields: `character`, `check`, `roll`, `dc` (optional), `result` (optional: success/failure/critical_success/critical_failure).

### `[CONTEXT_REFRESH]` — to any teammate

Post-compaction recovery. Fields: `campaign`, `current_scene` (optional), `last_narrative_summary` (optional). Recipient re-reads campaign files and resumes.

### `[NPC_SPAWNED]` — to GM

Fields: `npc`, `teammate_name` (always `npc-{name}`).

### `[NPC_DESPAWNED]` — to GM

Fields: `npc`.

---

## Message Delivery Confirmation Pattern

The protocol uses **lightweight confirmation for critical-path messages only**. Most messages (narratives, player actions, crosstalk) are fire-and-forget. Confirmations exist only where a missed message would stall or break the session.

### What Gets Confirmed

| Message | Confirmation | Timeout | Escalation |
|---------|-------------|---------|------------|
| `[SESSION_COMMAND]` | `[COMMAND_ACK]` from GM | 60s | Resend the command |
| `[SESSION_COMMAND] end` | `[SESSION_END]` from GM | 3 exchanges | Resend end command |
| GM liveness (mid-scene) | Any GM message | 120s | `[CONTEXT_REFRESH]`, then respawn after 30s |
| Player liveness (after prompt) | `[PLAYER_TO_GM]` | 90s | Nudge, then respawn after 180s total |

### What Does NOT Get Confirmed

- `[NARRATIVE]` broadcasts -- no ACK needed, fire-and-forget
- `[GM_TO_PLAYER]` prompts -- tracked indirectly via player response timeout
- `[PLAYER_TO_GM]` responses -- GM processes or ignores, no ACK
- `[PLAYER_TO_PLAYER]` crosstalk -- no delivery guarantee needed
### Timeout Behavior

**Session commands** (`[SESSION_COMMAND]`):
1. Team lead sends `[SESSION_COMMAND]` to GM
2. GM must reply with `[COMMAND_ACK]` immediately (before any other action)
3. If no `[COMMAND_ACK]` within **60 seconds**: resend the same `[SESSION_COMMAND]`
4. If still no ACK after second attempt: treat as GM crash, trigger health check (respawn)

**Session end** (`[SESSION_COMMAND] end`):
1. After `[COMMAND_ACK]`, GM finds a stopping point and sends `[SESSION_END]`
2. If no `[SESSION_END]` within **3 GM exchanges** (GM sends other messages but not `[SESSION_END]`): resend `[SESSION_COMMAND] end`
3. This handles the known issue where the GM sends reflection prompts or extra narrative beats instead of shutting down

**General rules**:
- Send ONE start command and wait; do not nudge unless GM idle >60s
- Never spam commands -- one resend attempt before escalating to health check
- During expected idle periods (human input, startup, end-wrapping), suppress timeout checks

### Design Rationale

The pattern is intentionally minimal. Adding ACKs to every message would double the message volume and slow gameplay. The confirmation targets are chosen based on observed failure modes:
- **Session commands**: GM has ignored `end` commands in 3/3 playtests (documented in MEMORY.md)
- **GM liveness**: Silent GM crash stalls the entire session with no recovery path
- **Player liveness**: One unresponsive player can block all other players if GM waits indefinitely

For non-critical messages, the system relies on the natural flow of gameplay -- if a player doesn't respond, the GM notices and can act. If a narrative doesn't display, the human can see something is wrong. These are self-correcting without explicit ACKs.

## Processing Order

1. **Display first**: Always show `[NARRATIVE]` to human immediately
2. **Then act**: Process `[ASK_PLAYER]` and other actionable messages
