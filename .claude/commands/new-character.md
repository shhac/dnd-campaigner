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

Use the `character-creator` agent.

First, determine:
1. Which campaign (list available if not specified)
2. PC or NPC

Then run the agent:
```
Task: character-creator agent
Prompt: Help the user create a {PC/NPC} for the {campaign} campaign. Read the campaign overview first to understand the setting. Then guide them through character creation conversationally. For PCs, offer stat generation options (standard array, point buy, or 4d6k3). Generate a complete character file using the appropriate template.
```

Pass to the agent:
- Campaign name
- Character type (PC/NPC)
- Campaign overview path for context

The agent should read existing party members to suggest good fits and avoid overlap.
