---
description: Create a new D&D campaign through interactive worldbuilding
---

# /new-campaign

Create a new D&D campaign through interactive worldbuilding.

## What This Does

Launches the campaign-creator agent to help you design and set up a new campaign. The process involves:

1. **Discovery conversation** - Discussing tone, setting, themes, and what kind of game you want
2. **Proposal** - A campaign concept for your approval
3. **Generation** - Creating all foundational files

## Files Created

After completion, you'll have:
```
campaigns/{campaign-name}/
├── overview.md          # World, setting, plot, factions
├── story-state.md       # Starting situation
├── party/               # (empty, ready for characters)
├── npcs/
│   └── {starter-npcs}.md
├── locations/
│   └── {starting-location}.md
├── factions/
├── beats/
└── scenes/
```

## Usage

Simply run `/new-campaign` and answer the questions.

Once complete, you can:
- Create characters with `/new-character`
- Start playing with `/play {campaign-name}`

---

## Instructions for Claude

Use the `campaign-creator` agent with the **ask-user-orchestration skill**.

### Initial Prompt

```
Task: campaign-creator agent
Prompt: Help the user create a new D&D campaign. Read the templates first, then begin the discovery process by asking about tone, setting, and themes. Make sure the campaign directory name is lowercase with hyphens.
```

### Orchestration

Follow the `ask-user-orchestration` skill pattern:

1. Launch the agent
2. Watch for `ask-user` code blocks in output
3. Parse JSON and call AskUserQuestion
4. Resume agent with answers
5. Repeat until agent completes without asking questions

See the skill for detailed parsing and resumption examples.
