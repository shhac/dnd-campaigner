# D&D Campaigner

A Claude-powered D&D campaign management system for solo play with AI companions.

## Overview

This repository manages D&D campaigns where:
- One human plays a character
- AI agents play other party members
- An AI Game Master runs the world

## Prerequisites

The `toss` CLI is required for dice rolling.

**Install via Homebrew:**
```bash
brew tap shhac/tap && brew install toss
```

**Verify installation:**
```bash
toss 1d20
```

## Directory Structure

```
.claude/
├── commands/           # Slash commands
├── agents/             # AI agent definitions
└── skills/             # Reusable skills

templates/              # Markdown templates for campaign content
campaigns/{name}/       # Individual campaign data
├── items/              # Notable items and artifacts
```

## Path Conventions

- `{campaign}`: Campaign directory name (kebab-case, e.g., `the-rot-beneath`)
- `{character}`: Full hyphenated character name (e.g., `tilda-brannock`, matching the character sheet filename)
- `{name}`: Generic name placeholder (lowercase, hyphenated)

## Core Design Principle: Information Isolation

**CRITICAL**: AI players must not have access to GM knowledge.

### Knowledge Boundaries

| Agent | Knows | Does NOT Know |
|-------|-------|---------------|
| GM | Everything - plot secrets, NPC plans, hidden content | N/A |
| AI Player | Own character sheet, witnessed events, scene descriptions | Other PCs' secrets, GM notes, unopened plot |
| Human Player | Whatever you choose to read | N/A (you have repo access) |

### Enforcement

When invoking AI player agents:
1. Always use **separate Task invocations** (fresh context)
2. Pass **only** character-appropriate information:
   - Their character sheet (`campaigns/{name}/party/{character}.md`)
   - Current scene description (from their perspective)
   - Events they personally witnessed
3. **Never** pass: `story-state.md`, other character sheets, NPC secret notes

The `/play` command handles this orchestration automatically.

## Rules System

D&D 5e-inspired, theater of the mind:
- Core d20 mechanics (ability checks, saves, attack rolls)
- Advantage/disadvantage system
- Narrative combat (no grid/tactical positioning)
- GM interprets intent generously, rules serve the story

## Dice Rolling

Use the `toss` CLI for all dice rolls:
```bash
toss 1d20+5        # Attack roll with +5 modifier
toss 4d6k3         # Roll 4d6, keep highest 3 (stat generation)
toss 2d6+2d6+5     # Multiple dice groups
toss 1d20 1d20     # Roll with advantage (take higher)
```

## Workflow

### Creating a Campaign
```
/new-campaign
```
Interactive process to design setting, themes, starting situation.

### Creating Characters
```
/new-character
```
Creates PCs or NPCs with full sheets.

### Playing
```
/play {campaign-name}
```
Starts a session. You declare your character, GM orchestrates.

### Listing Campaigns
```
/campaigns
```
Shows all available campaigns and their status.

### Ejecting a Campaign
```
/eject {campaign-name} [destination]
```
Exports a campaign as a standalone project with all necessary agents, skills, and commands. The ejected campaign can be played independently of this repository.

### Novelizing a Campaign
```
/novelize {campaign-name} [options]
```
Converts campaign sessions into episodic novel chapters with editorial review.

**Options:**
- `--auto`: Automatic mode - pause only for voice lock and blocking issues
- `--resume`: Continue from last checkpoint
- `--fresh`: Start over, archiving any existing novel
- `--skip-publisher`: Skip the publisher review phase
- `--review-each`: Pause after each chapter for user review
- `--dry-run`: Show plan without writing files

**Pipeline Phases:**
1. Planning - Outline creation with tone selection
2. Writing + Editing - Chapter drafts with prose improvements
3. Full Continuity - Consistency checking across all chapters
4. Fixing - Addressing blocking issues
5. Publisher Review - Reader experience assessment
6. Final Assembly - Metadata and table of contents

**Checkpoints:**
- Outline Approval (after planning)
- Voice Lock (after Chapter 1 edited - critical)
- Continuity Review (after full check)
- Publisher Review (skippable with `--skip-publisher`)

### Setting Up TTS Voices
```
/setup-voices {campaign-name}
```
Generates `voices.yaml` for text-to-speech novel reading. Maps POV characters to Piper TTS voices based on gender detection from character sheets.

After running, use `source scripts/piper-env.sh` to enable `read-chapter` and `read-novel` commands.

## Campaign File Purposes

| File | Purpose | Who Reads It |
|------|---------|--------------|
| `overview.md` | World setting, themes, major factions | GM, reference |
| `story-state.md` | Current situation, active quests, secrets | GM only |
| `party-knowledge.md` | Shared knowledge for AI players (no secrets) | GM, AI players |
| `party/{name}.md` | Character sheet | GM, that character's agent |
| `npcs/{name}.md` | NPC details + secrets | GM only |
| `items/{name}.md` | Notable items, artifacts, equipment | GM, reference |
| `decision-log.md` | Character decisions and actions for context reconstruction | GM, reference |

### Novel Directory (`novel/`)

| File | Purpose |
|------|---------|
| `outline.md` | Chapter plan with POV assignments and progress tracking |
| `chapter-NN.md` | Final edited chapter versions |
| `continuity-manifest.md` | Running tracker of names, descriptions, timeline |
| `continuity-notes.md` | Full continuity report |
| `publisher-feedback.md` | Reader experience assessment |
| `metadata.yaml` | Final novel metadata |
| `table-of-contents.md` | Final TOC |
| `novelization-state.yaml` | Progress tracking for resume |
| `voices.yaml` | POV character to TTS voice mapping (created by `/setup-voices`) |
| `drafts/` | Archived intermediate files (drafts, fix-requests) |

## Agent Descriptions

### Gameplay Agents
- **campaign-creator**: Designs new campaigns through interactive Q&A
- **character-creator**: Builds PCs/NPCs with proper D&D 5e stats
- **gm**: Runs the game - narrates, controls NPCs, adjudicates rules
- **ai-player-action**: Plays a party member during action scenes (isolated context, quick-or-veto system)
- **ai-player-journal**: Records character reflections and memories after events
- **dnd-enthusiast**: Experienced D&D player/DM offering feedback on campaign design, rules, and player experience
- **decision-log**: Records character decisions and actions after significant events to help with context reconstruction

### Novelization Agents
- **novelizer**: Creates outlines (PLAN), writes chapter drafts (WRITE), and applies fixes (FIX). Self-sufficient - reads source files, writes directly, returns status only.
- **novelizer-editor**: Improves prose mechanics (clarity, flow, engagement) without changing plot. Reads drafts, writes edited versions.
- **novelizer-continuity**: Checks consistency across chapters. INCREMENTAL mode for quick checks every 2-3 chapters, FULL mode for complete analysis. Maintains continuity-manifest.md.
- **novelizer-publisher**: Evaluates reader experience - "Is this worth reading?" Provides feedback on engagement, pacing, and what might make readers put the book down.

## Skills

Skills are automatically loaded by Claude Code when relevant. Agents reference them by name.

### User-Facing Skills
- **dice-roll**: Intelligent `toss` CLI wrapper for D&D dice notation
- **ability-check**: DC tables, saving throws, conditions, advantage/disadvantage, skill guidance
- **name-generator**: Creates varied, original names by race/culture while avoiding duplicates
- **random-events**: Generates weather, encounters, rumors, NPC moods to make the world feel alive

### Orchestration Skills
- **play-orchestration**: Core orchestration loop for D&D play sessions
- **invoke-ai-players**: Orchestrates AI player agent spawning for D&D sessions
- **ask-user-orchestration**: Orchestrates agents that need to ask users questions
- **combat-orchestration**: Manages theater-of-mind D&D combat with threat assessment and pacing tiers
- **save-point**: Manages session state persistence for D&D campaigns
- **quick-or-veto**: The quick-or-veto pattern for AI player reactions
- **narrative-formatting**: Formatting system for D&D narrative output
