---
name: ask-user-orchestration
description: Orchestrates agents that need to ask users questions. Use when spawning campaign-creator or character-creator agents, or any agent that outputs ask-user blocks. Handles parsing JSON questions, calling AskUserQuestion, and resuming agents with answers.
---

# Ask-User Orchestration

Guides the orchestrator (main conversation) through handling agents that need to ask users questions interactively.

## When This Skill Applies

Use this pattern when spawning agents that:
- Need to gather user preferences through multiple questions
- Output `ask-user` code blocks with JSON question definitions
- Require iterative conversation before completing their task

**Agents using this pattern:**
- `campaign-creator` - Asks about tone, setting, themes
- `character-creator` - Asks about class, race, personality

## Quick Reference

### The Orchestration Loop

```
1. Spawn agent with initial prompt
2. Agent outputs ask-user block → STOP
3. Parse JSON from block
4. Call AskUserQuestion with parsed questions
5. User answers
6. Resume agent with: "User answered: {answers}"
7. Repeat until agent completes without ask-user block
```

### Detecting Ask-User Blocks

Look for fenced code blocks with `ask-user` language identifier:

~~~
```ask-user
{
  "questions": [...]
}
```
~~~

### Calling AskUserQuestion

Pass the `questions` array directly to the AskUserQuestion tool. The JSON format matches exactly.

### Resuming the Agent

Format user answers as natural language:

```
User answered:
- Tone: Dark and gritty
- Setting: Original homebrew world
- Theme: Political intrigue
```

## Detailed Patterns

- For JSON format specification, see [json-format.md](json-format.md)
- For complete orchestration examples, see [examples.md](examples.md)

## Error Handling

**Malformed JSON**: If the ask-user block contains invalid JSON, inform the user and ask them to retry.

**No ask-user block**: If agent output has no ask-user block, the agent is either:
- Done (completed its task)
- Providing information (relay to user, await input)
- Stuck (may need guidance)
