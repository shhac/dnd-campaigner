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

### Step 2: Spawn Journal Agents (Background, Parallel)

For each character in the comma-separated list, spawn an `ai-player-journal` agent:

```
Task: ai-player-journal
run_in_background: true
Prompt: |
  Campaign: {campaign}
  Character: {character}
```

**Critical**:
- Use `run_in_background: true` for all spawns
- Spawn all agents in parallel (single message with multiple Task calls)

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

## Notes

- Journal agents handle their own file reading and cleanup
- If a character has no action notes file, the journal agent still processes the narrative
- Background execution means journal quality doesn't affect story pacing
