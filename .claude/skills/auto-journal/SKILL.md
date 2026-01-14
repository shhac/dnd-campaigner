---
name: auto-journal
description: Automatically triggers character journaling after GM narrative returns. Runs in background without blocking story progression.
---

# Auto-Journal Skill

Automatically triggers character journaling after GM narrative returns. Runs in background without blocking story progression.

## When to Use

Invoke this skill after the GM returns narrative following an `[AWAIT_AI_PLAYERS]` cycle. The orchestrator calls this with campaign name and character list.

## Invocation Format

```
Skill: auto-journal
Args: {campaign} {char1},{char2},{char3},{char4}
```

**Example:**
```
Skill: auto-journal
Args: the-rot-beneath tilda-brannock,brother-aldric,mira-thornwood,korvin-blackwood
```

## Implementation Steps

When this skill is invoked, the orchestrator follows a two-step process to avoid verbose file-writing output.

### Step 1: Write Narrative File (Foreground)

Spawn a `narrative-writer` agent (NOT in background) to write the narrative:

```
Task: narrative-writer
Prompt: |
  Campaign: {campaign}

  ## Narrative

  {paste the full GM narrative here}
```

This agent has `tools: Write` and will write to `campaigns/{campaign}/tmp/narrative-for-journal.md`.

**Wait for this to complete** before proceeding to Step 2.

### Step 2: Spawn Background Agents (Parallel)

After the narrative file is written, spawn all background agents in a single message.

**Journal Agents** (for each character in the comma-separated list):

```
Task: ai-player-journal
run_in_background: true
Prompt: |
  Campaign: {campaign}
  Character: {character}
```

**Decision Log Agent**:

```
Task: decision-log
run_in_background: true
Prompt: |
  Campaign: {campaign}
```

**State Delta Writer** (updates story-state.md):

```
Task: state-delta-writer
run_in_background: true
Prompt: |
  Campaign: {campaign}
```

**Knowledge Delta Writer** (updates party-knowledge.md):

```
Task: knowledge-delta-writer
run_in_background: true
Prompt: |
  Campaign: {campaign}
```

**Critical**:
- Use `run_in_background: true` for all spawns
- Spawn all agents in parallel (single message with multiple Task calls)
- Delta writers will skip gracefully if no delta files exist

### Step 3: Continue Immediately

After spawning all journal agents, continue with player interaction. Do not wait for journals to complete.

## Why This Approach

- **Token efficient**: Narrative is passed once (to narrative-writer), not 4 times
- **No verbose Write output**: The foreground task shows a brief summary, not diffs
- **Proper ordering**: File is written before journal agents try to read it
- **Parallel journals**: All journal agents run concurrently in background

## File Lifecycle

| File | Written By | Read By | Lifecycle |
|------|------------|---------|-----------|
| `tmp/narrative-for-journal.md` | narrative-writer | All journal agents | Overwritten each cycle |
| `tmp/{char}-notes-for-journal.md` | Action agent | Journal agent (then deletes) | Consumed once per action |
| `tmp/gm-state-delta.md` | GM (when closing beat) | state-delta-writer | Deleted after processing |
| `tmp/party-knowledge-delta.md` | GM (when closing beat) | knowledge-delta-writer | Deleted after processing |

## Notes

- Journal agents handle their own file reading and cleanup
- If a character has no action notes file, the journal agent still processes the narrative
- Background execution means journal quality doesn't affect story pacing
- Delta writers skip gracefully if no delta files exist (the GM only writes deltas when meaningful state changes occur)
- Delta files are deleted immediately after successful processing to prevent duplicate updates
