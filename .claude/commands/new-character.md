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

Use the `character-creator` agent with the **question orchestration pattern**.

### Orchestration Pattern

The agent cannot call AskUserQuestion directly. Instead:

1. **Launch the agent** with the Task tool
2. **Check the response** for ```ask-user code blocks
3. **If found**: Parse the JSON and call AskUserQuestion with those questions
4. **Resume the agent** with the user's answers
5. **Repeat** until the agent completes without asking questions

### Parsing ask-user Blocks

Look for code blocks with the `ask-user` language tag:
````
```ask-user
{
  "questions": [...]
}
```
````

Parse the JSON and pass it directly to AskUserQuestion's `questions` parameter.

### Resuming with Answers

When resuming, tell the agent what the user chose:
```
The user answered your questions:
- Type: "Player Character (PC)"
- Stats: "Roll dice"

Continue with character creation based on these preferences.
```

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

### Example Flow

1. Launch agent → Agent outputs ask-user block asking PC vs NPC
2. Parse block → Call AskUserQuestion
3. User answers "PC" → Resume agent with answer
4. Agent asks about concept/class → Parse and ask user
5. Continue until character file is generated
