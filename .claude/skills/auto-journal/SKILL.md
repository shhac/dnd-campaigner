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

When this skill is invoked, the orchestrator must:

### 1. Write Narrative to Shared File

Write the current GM narrative (already in orchestrator context) to the campaign's temp directory:

```
campaigns/{campaign}/tmp/narrative-for-journal.md
```

This file is:
- Written fresh each cycle (overwrite existing)
- Read by all journal agents spawned in step 2
- Contains the scene description the characters just experienced

### 2. Spawn Journal Agents (Background, Parallel)

For each character in the comma-separated list, spawn an `ai-player-journal` agent:

```
Task: ai-player-journal
run_in_background: true
Prompt: |
  Campaign: {campaign}
  Character: {character}
```

**Critical**: Use `run_in_background: true` for all spawns. These agents run independently and the orchestrator does not wait for them.

### 3. Continue Immediately

After spawning all journal agents, continue with player interaction. Do not wait for journals to complete.

## File Lifecycle

| File | Written By | Read By | Lifecycle |
|------|------------|---------|-----------|
| `tmp/narrative-for-journal.md` | Orchestrator | All journal agents | Overwritten each cycle |
| `tmp/{char}-notes-for-journal.md` | Action agent | Journal agent (then deletes) | Consumed once per action |

## Notes

- Journal agents handle their own file reading and cleanup
- If a character has no action notes file, the journal agent still processes the narrative
- Background execution means journal quality doesn't affect story pacing
