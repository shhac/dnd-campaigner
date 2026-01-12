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

Use the `campaign-creator` agent with the **question orchestration pattern**.

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
- Tone: "Dark and gritty"
- Setting: "Original homebrew"

Continue with campaign creation based on these preferences.
```

### Initial Prompt

```
Task: campaign-creator agent
Prompt: Help the user create a new D&D campaign. Read the templates first, then begin the discovery process by asking about tone, setting, and themes. Make sure the campaign directory name is lowercase with hyphens.
```

### Example Flow

1. Launch agent → Agent outputs ask-user block with tone/setting questions
2. Parse block → Call AskUserQuestion with those questions
3. User answers → Resume agent with "User chose: Dark and gritty, Original homebrew"
4. Agent continues → May ask more questions or propose campaign
5. Repeat until agent generates files and completes
