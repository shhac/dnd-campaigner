---
description: Export a campaign as a standalone project
argument-hint: <campaign-name> [destination]
---

# /eject

Export a campaign as a standalone project that can be played independently of this repository.

## Arguments

- `campaign` (required): The campaign name to eject
- `destination` (optional): Where to create the standalone project

## What This Does

Creates a fully self-contained D&D campaign project with:
- All campaign content (characters, NPCs, locations, etc.)
- All necessary Claude agents, skills, and commands
- A standalone CLAUDE.md configured for that campaign
- Everything needed to play without the parent repo

## Usage

```
/eject curse-of-strahd
/eject curse-of-strahd ~/projects/curse-of-strahd
```

If no destination is provided, you'll be asked where to put it.

## What Gets Copied

### Campaign Content
```
{destination}/
├── overview.md
├── story-state.md
├── party-knowledge.md         # Shared knowledge for AI players
├── preferences.md             # Narrative style, player character
├── party/
│   ├── {character}.md         # Character sheets
│   └── {character}-journal.md # AI character memories
├── npcs/
├── locations/
├── factions/
├── items/
└── sessions/
```

### Claude Infrastructure
```
{destination}/.claude/
├── agents/
│   ├── gm.md
│   ├── ai-player-action.md
│   ├── ai-player-journal.md
│   ├── character-creator.md    # For adding new characters
│   └── dnd-enthusiast.md       # For rules/design feedback
├── skills/
│   ├── dice-roll/SKILL.md
│   ├── ability-check/SKILL.md
│   ├── name-generator/SKILL.md
│   ├── random-events/SKILL.md  # Weather, encounters, rumors
│   ├── ask-user-orchestration/SKILL.md  # GM question handling
│   ├── save-point/SKILL.md     # Session state persistence
│   ├── quick-or-veto/SKILL.md  # AI player reaction pattern
│   ├── combat-orchestration/SKILL.md    # Combat management
│   ├── invoke-ai-players/SKILL.md       # AI player spawning
│   ├── play-orchestration/SKILL.md      # Session orchestration
│   └── narrative-formatting/            # Scene formatting styles
└── commands/
    ├── play.md                 # Modified for standalone use
    └── new-character.md        # Modified for standalone use
```

### Templates
```
{destination}/templates/
├── npc.md                      # For creating new NPCs
├── session-log.md              # For session logging
├── item.md                     # For notable items
├── location.md                 # For new locations
├── faction.md                  # For factions
├── relationships.md            # For tracking party dynamics
├── character-journal.md        # For AI character memory files
├── party-knowledge.md          # For shared party knowledge
└── preferences.md              # Campaign preferences template
```

### Standalone CLAUDE.md
A new CLAUDE.md configured specifically for this campaign:
- References files in root (not campaigns/{name}/)
- Removes campaign creation commands
- Focused on playing this specific campaign

## After Ejection

The ejected project is completely independent:
- Play with `/play` (no campaign name needed)
- Add characters with `/new-character`
- All paths reference local files

The original campaign remains in this repo unchanged.

## Use Cases

- **Gift a campaign**: Send someone a ready-to-play campaign
- **Archive**: Snapshot a completed campaign
- **Separate concerns**: Play one campaign without the full repo
- **Customization**: Modify rules/agents for a specific campaign without affecting others

---

## Instructions for Claude

### Step 1: Validate

Check that the campaign exists:
```bash
ls campaigns/{campaign}/
```

If not found, list available campaigns and ask user to choose.

### Step 2: Get Destination

If no destination provided, ask the user:
- Suggest: `~/{campaign-name}` or `~/projects/{campaign-name}`
- Confirm before proceeding

### Step 3: Create Directory Structure

```bash
mkdir -p {destination}
mkdir -p {destination}/.claude/agents
mkdir -p {destination}/.claude/skills/dice-roll
mkdir -p {destination}/.claude/skills/ability-check
mkdir -p {destination}/.claude/skills/name-generator
mkdir -p {destination}/.claude/skills/random-events
mkdir -p {destination}/.claude/skills/ask-user-orchestration
mkdir -p {destination}/.claude/skills/save-point
mkdir -p {destination}/.claude/skills/quick-or-veto
mkdir -p {destination}/.claude/skills/combat-orchestration
mkdir -p {destination}/.claude/skills/invoke-ai-players
mkdir -p {destination}/.claude/skills/play-orchestration
mkdir -p {destination}/.claude/skills/narrative-formatting/conversation
mkdir -p {destination}/.claude/commands
mkdir -p {destination}/templates
```

### Step 4: Copy Campaign Content

```bash
cp -r campaigns/{campaign}/* {destination}/
```

### Step 5: Copy and Adapt Claude Files

Copy these agents (no modification needed):
- `.claude/agents/gm.md`
- `.claude/agents/ai-player-action.md`
- `.claude/agents/ai-player-journal.md`
- `.claude/agents/character-creator.md`
- `.claude/agents/dnd-enthusiast.md`

Copy skills (no modification needed):
- `.claude/skills/dice-roll/SKILL.md`
- `.claude/skills/ability-check/SKILL.md`
- `.claude/skills/name-generator/SKILL.md`
- `.claude/skills/random-events/SKILL.md`
- `.claude/skills/ask-user-orchestration/SKILL.md`
- `.claude/skills/save-point/SKILL.md`
- `.claude/skills/quick-or-veto/SKILL.md`
- `.claude/skills/combat-orchestration/SKILL.md`
- `.claude/skills/invoke-ai-players/SKILL.md`
- `.claude/skills/play-orchestration/SKILL.md`
- `.claude/skills/narrative-formatting/SKILL.md` (and all subdirectory files)

Copy templates for ongoing content creation:
- `templates/npc.md`
- `templates/session-log.md`
- `templates/item.md`
- `templates/location.md`
- `templates/faction.md`
- `templates/relationships.md`
- `templates/character-journal.md`
- `templates/party-knowledge.md`
- `templates/preferences.md`

### Step 6: Create Modified Commands

Create a modified `/play` command that doesn't require campaign argument:
- Remove campaign argument
- Hardcode paths to root-level files (overview.md, story-state.md, party/, etc.)

Create a modified `/new-character` command:
- Remove campaign argument
- Hardcode paths to root-level directories

### Step 7: Create Standalone CLAUDE.md

Generate a new CLAUDE.md that:
- Describes this specific campaign
- References files at root level (not campaigns/{name}/)
- Documents the /play and /new-character commands
- Includes the information isolation rules
- Notes this was ejected from dnd-campaigner

### Step 8: Create .gitignore

Create a `.gitignore` file in the ejected project:
```
.DS_Store
.claude/settings.local.json
CLAUDE.local.md
*.swp
*~
.idea/
.vscode/
```

### Step 9: Initialize Git (Optional)

Ask if user wants to initialize a git repo:
```bash
cd {destination} && git init
```

### Step 10: Report

Tell the user:
- What was created
- How to use it: `cd {destination} && claude` then `/play`
- That original campaign is unchanged

## Modified Play Command Template

```markdown
# /play

Start or continue a D&D session.

## Usage

Simply run `/play` to begin.

## Instructions for Claude

Use the `gm` agent with campaign files at root level:
- overview.md
- story-state.md
- party-knowledge.md (shared knowledge for AI players)
- preferences.md (narrative style, player character)
- party/*.md (character sheets)
- party/*-journal.md (AI character memories)
- npcs/*.md
- locations/, factions/, items/

SAVE POINTS: Update story-state.md AND party-knowledge.md at:
- End of combat, end of scene, major discovery, after NPC conversations, before rests, end of session

When spawning AI players, tell them to read party-knowledge.md and their journal file.

Read narrative style from preferences.md and apply via narrative-formatting skill.

[Rest of play.md content with paths adjusted]
```

## Modified New-Character Command Template

```markdown
# /new-character

Create a new character for this campaign.

## Usage

```
/new-character           # Create a PC
/new-character npc       # Create an NPC
```

## Instructions for Claude

Use the `character-creator` agent. Read overview.md for setting context.

Create files at:
- party/{name}.md for PCs
- npcs/{name}.md for NPCs

[Rest of new-character.md content with paths adjusted]
```
