---
description: Create a new player character (PC) or NPC for a campaign
argument-hint: [campaign] [pc|npc]
---

# /new-character

Create a new player character (PC) or non-player character (NPC) for a campaign.

## Arguments

- `campaign` (optional): Which campaign this character belongs to
- `type` (optional): `pc` or `npc`

## What This Does

Launches the character-creator agent to help you design a character through conversation:

1. **Determine type** - PC (full sheet) or NPC (roleplay-focused)
2. **Concept discussion** - Race, class, background, personality
3. **Stat generation** - For PCs: standard array, point buy, or rolled
4. **Backstory & voice** - History, motivations, how they speak
5. **Generation** - Complete character file

## Files Created

**For PCs:**
```
campaigns/{campaign}/party/{character-name}.md
```

**For NPCs:**
```
campaigns/{campaign}/npcs/{npc-name}.md
```

## Usage

```
/new-character                          # Will ask which campaign
/new-character curse-of-strahd          # Specify campaign
/new-character curse-of-strahd npc      # Create an NPC
```

## Tips

- For AI-played party members, pay special attention to the "Character Voice" section
- NPCs don't need full stat blocks unless they'll be in combat
- Consider party balance when creating PCs (check existing party members)

---

## Instructions for Claude

Use the `character-creator` agent with the **ask-user-orchestration skill**.

### Initial Setup

First, determine:
1. Which campaign (list available if not specified, or ask user)
2. PC or NPC (if not specified, the agent will ask)

### Initial Prompt

```
Task: character-creator agent
Prompt: Help the user create a character for the {campaign} campaign. Read the campaign overview first to understand the setting. If character type wasn't specified, start by asking PC vs NPC. Guide them through creation conversationally.
```

Pass to the agent:
- Campaign name
- Character type (PC/NPC) if known
- Campaign overview path for context

The agent should read existing party members to suggest good fits and avoid overlap.

### Orchestration

Follow the `ask-user-orchestration` skill pattern:

1. Launch the agent
2. Watch for `ask-user` code blocks in output
3. Parse JSON and call AskUserQuestion
4. Resume agent with answers
5. Repeat until agent completes without asking questions

See the skill for detailed parsing and resumption examples.
