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
└── sessions/
```

## Usage

Simply run `/new-campaign` and answer the questions.

Once complete, you can:
- Create characters with `/new-character`
- Start playing with `/play {campaign-name}`

---

## Instructions for Claude

Use the `campaign-creator` agent to run this process.

```
Task: campaign-creator agent
Prompt: Help the user create a new D&D campaign. Use the discovery process outlined in your instructions - ask about tone, setting, themes, party composition, etc. Once you have enough information, propose a campaign concept. After approval, generate all the campaign files using the templates in templates/.
```

The agent should:
1. Read templates first to understand the expected format
2. Ask questions conversationally (not as a checklist)
3. Propose before generating
4. Create complete, usable files

Make sure the campaign directory name is lowercase with hyphens (e.g., `curse-of-strahd`, `lost-mines`).
