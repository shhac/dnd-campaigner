# Team Lead (Orchestrator) Protocol Reference

Messages the team lead handles. The team lead routes human I/O, manages session lifecycle, and handles NPC spawning. It does NOT relay GM-player messages — they communicate directly. For conventions and quick reference, see `SKILL.md`.

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

### `[RELAY_TO_HUMAN]`

Human's character requests human input. Fields: `character`. Followed by Scene, Decision Needed, Suggested Options sections.

**Action:** Show to human via `AskUserQuestion` or display. Send response as `[HUMAN_DECISION]` to character teammate.

---

## Messages Team Lead Sends

### `[SESSION_COMMAND]` — to GM

```
[SESSION_COMMAND]
command: start | save | end
reason: "Player wants to stop for the night"
```

Start command additional fields: `campaign`, `player_character`, `narrative_style`, `ai_characters`.

### `[HUMAN_DECISION]` — to human's player teammate

Fields: `character`. Free-form human input follows.

### `[MODE_SWITCH]` — to human's player teammate

Fields: `mode` (AUTONOMOUS/HUMAN_RELAY), `reason` (optional).

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

## Timeout Rules

- No `[COMMAND_ACK]` within **60 seconds**: resend `[SESSION_COMMAND]`
- Send ONE start command and wait; do not nudge unless GM idle >60s
- `[SESSION_COMMAND] end` with no `[SESSION_END]` within 3 exchanges: resend end command

## Processing Order

1. **Display first**: Always show `[NARRATIVE]` to human immediately
2. **Then act**: Process `[ASK_PLAYER]`, `[RELAY_TO_HUMAN]`
