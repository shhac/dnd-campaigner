# D&D Campaigner

A Claude-powered D&D campaign management system for solo play with AI companions.

## Overview

This repository manages D&D campaigns where:
- One human plays a character
- AI agents play other party members
- An AI Game Master runs the world

## Prerequisites

### 1. Claude Code (Required)

Claude Code is Anthropic's official CLI for Claude. It orchestrates all agents, commands, and gameplay.

**Install:** Follow the instructions at [claude.ai/claude-code](https://claude.ai/claude-code).

**Verify:**
```bash
claude --version
# Expected: a version number like 1.x.x
```

### 2. Dice Roller (Required)

The `toss` CLI handles all dice rolls during gameplay.

**Install:**
```bash
brew tap shhac/tap && brew install toss
```

**Verify:**
```bash
toss 1d20
# Expected: a dice roll result like [14] = 14
```

### 3. Python Virtual Environments (Optional -- Audiobook Only)

Only needed if you want to generate audiobooks from novelized campaigns. **Skip this for initial setup.**

The repository includes Python virtual environments for TTS engines:

- `.chatterbox-venv/` - Chatterbox TTS (high quality, slower)
- `.piper-venv/` - Piper TTS (fast, lower quality)

**Important for Claude Code:** When running Python scripts via Bash, always activate the appropriate venv first:

```bash
# For Chatterbox scripts
source .chatterbox-venv/bin/activate && python scripts/chatterbox-audiobook.py ...

# For Piper scripts
source .piper-venv/bin/activate && python scripts/piper-tts.py ...
```

Set these up later when you reach the `/audiobook` command. See [QUICKSTART.md](QUICKSTART.md) for the essential first-session prerequisites only.

## Directory Structure

```
.claude/
├── commands/           # Slash commands
├── agents/             # AI agent definitions
└── skills/             # Reusable skills

templates/              # Markdown templates for campaign content
campaigns/{campaign}/   # Individual campaign data
├── overview.md         # World setting, themes, factions
├── world-primer.md     # Common knowledge any inhabitant would know
├── story-state.md      # Current situation, secrets (GM only)
├── party-knowledge.md  # Shared knowledge (no secrets)
├── decision-log.md     # Character decisions and actions
├── preferences.md      # Narrative style, player character
├── party/              # Player character sheets
├── npcs/               # NPC details and secrets
├── items/              # Notable items and artifacts
├── locations/          # Location descriptions
├── factions/           # Faction details
├── beats/              # GM planning docs (beat sheets)
├── scenes/             # Narrative output (written by Narrator)
└── novel/              # Novelization output (if created)
    ├── outline.md
    ├── chapter-NN.md
    └── chatterbox/     # Audiobook files (if created)
```

## Path Conventions

- `{campaign}`: Campaign directory name (kebab-case, e.g., `the-rot-beneath`)
- `{character}`: Full hyphenated character name (e.g., `tilda-brannock`, matching the character sheet filename)

## Core Design Principle: Information Isolation

**CRITICAL**: AI players must not have access to GM knowledge.

| Agent | Knows | Does NOT Know |
|-------|-------|---------------|
| GM | Everything -- plot secrets, NPC plans, hidden content | N/A |
| AI Player | Own character sheet, witnessed events, scene descriptions | Other PCs' secrets, GM notes, unopened plot |
| Human Player | Whatever you choose to read | N/A (you have repo access) |

Each player teammate only reads their own character sheet, their journal, and `party-knowledge.md`. The `/play` command enforces this automatically. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full isolation model.

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
Interactive process to design setting, themes, starting situation. **Time estimate:** 15-20 minutes.

### Creating Characters
```
/new-character
```
Creates PCs or NPCs with full sheets. **Time estimate:** 10-15 minutes per character.

### Playing
```
/play {campaign-name}
```
Starts a session using Claude Code Teams. All participants are persistent teammates: GM, Narrator, and every player character (AI and human). The GM messages players directly; players respond directly. The human's character operates in HUMAN_RELAY mode (relays decisions to/from the human) or AUTONOMOUS mode (acts independently when the human steps away). Players self-journal at beat boundaries. The team lead is a lightweight delegate handling human I/O and session lifecycle.

**Time estimate:** 30-90 minutes per session (3-5 major scenes).

### What Happens During a Play Session

A session follows a repeating loop. The GM broadcasts a narrative scene describing the environment, NPCs, and events. This appears in the terminal for the human to read. The GM then sends direct prompts to each player character asking what they want to do. AI party members respond autonomously based on their personality, bonds, and flaws. The human's relay presents the prompt and waits for the human's decision, then translates it into an in-character action.

All responses flow back to the GM, who weaves them into the next narrative beat -- describing consequences, advancing the story, and introducing complications. Dice rolls happen when outcomes are uncertain: ability checks, saves, attack rolls. The GM requests specific rolls and the `toss` CLI executes them.

This cycle (narrative -> prompts -> responses -> narrative) repeats until a natural stopping point. The GM targets 3-5 major beats per session and actively looks for good stopping points after the third beat. The human can also end the session at any time by saying "end session."

Between beats, AI players may talk to each other in character, journal significant moments, and the narrator writes scene files to `scenes/` for the permanent record. All campaign state is saved automatically -- `story-state.md`, `party-knowledge.md`, and character journals are updated so the next session picks up seamlessly.

See [QUICKSTART.md](QUICKSTART.md) for a step-by-step first session walkthrough.

### Chatting with Characters
```
/chat {campaign-name} {character-name}
```
Have a fireside conversation with a D&D character outside of gameplay. Characters are safe, at rest, and willing to be vulnerable. READ-ONLY - does not affect campaign state. **Time estimate:** 10-30 minutes.

### Listing Campaigns
```
/campaigns
```
Shows all available campaigns and their status. **Time estimate:** under 1 minute.

### Ejecting a Campaign
```
/eject {campaign-name} [destination]
```
Exports a campaign as a standalone project with all necessary agents, skills, and commands. The ejected campaign can be played independently of this repository. **Time estimate:** 2-5 minutes.

### Novelizing a Campaign
```
/novelize {campaign-name} [options]
```
Converts campaign sessions into episodic novel chapters with editorial review. **Time estimate:** 1-3 hours depending on campaign length.

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
Generates `voices.yaml` for text-to-speech novel reading. Maps POV characters to Piper TTS voices based on gender detection from character sheets. **Time estimate:** 5-10 minutes.

After running, use `source scripts/piper-env.sh` to enable `read-chapter` and `read-novel` commands.

### Generating Audiobooks
```
/audiobook {campaign-name} [options]
```
Generates MP3 audiobook files from novelized chapters using Chatterbox TTS. **Time estimate:** 2-6 hours depending on chapter count.

**Options:**
- `--chapter N`: Process only chapter N
- `--chapters N-M`: Process chapters N through M
- `--resume`: Continue from last checkpoint
- `--dry-run`: Show plan without generating audio
- `--test-voices`: Generate short voice samples for each character

## Campaign File Purposes

| File | Purpose | Who Reads It |
|------|---------|--------------|
| `overview.md` | World setting, themes, major factions | GM, reference |
| `world-primer.md` | Common knowledge any inhabitant would know | GM, AI players |
| `story-state.md` | Current situation, active quests, secrets | GM only |
| `party-knowledge.md` | Shared knowledge for AI players (no secrets) | GM, AI players |
| `party/{name}.md` | Character sheet | GM, that character's agent |
| `npcs/{name}.md` | NPC details + secrets | GM only |
| `items/{name}.md` | Notable items, artifacts, equipment | GM, reference |
| `locations/{name}.md` | Location descriptions and details | GM, reference |
| `factions/{name}.md` | Faction details and goals | GM, reference |
| `decision-log.md` | Character decisions and actions for context reconstruction | GM, reference |
| `preferences.md` | Narrative style, player character selection | Team lead |

### Novel Directory (`novel/`)

| File | Purpose |
|------|---------|
| `outline.md` | Chapter plan with POV assignments and progress tracking |
| `chapter-NN.md` | Final edited chapter versions |
| `continuity-manifest.md` | Running tracker of names, descriptions, timeline |
| `continuity-notes.md` | Full continuity report |
| `pattern-report.md` | Cross-chapter repetition analysis |
| `publisher-feedback.md` | Reader experience assessment |
| `metadata.yaml` | Final novel metadata |
| `table-of-contents.md` | Final TOC |
| `novelization-state.yaml` | Progress tracking for resume |
| `voices.yaml` | POV character to TTS voice mapping (created by `/setup-voices`) |
| `drafts/` | Archived intermediate files (drafts, fix-requests) |

### Voice Samples (`.chatterbox-voices/`)

Chatterbox TTS voice samples for cloning. See **audiobook-orchestration/voice-samples** skill for full reference including available samples, creation commands, and guidelines.

## Agents and Skills

Agent definitions live in `.claude/agents/` and skills in `.claude/skills/`. Skills are automatically discovered by Claude based on their description.

For the full list of agents (gameplay, novelization, audiobook, utility) and skills (user-facing, orchestration, novelization), see [ARCHITECTURE.md](ARCHITECTURE.md).

## Example Campaign

The [campaigns/the-dimming/](campaigns/the-dimming/) directory contains a complete campaign: world-building, four characters with distinct voices, session scenes, and decision logs. Browse it to understand what `/new-campaign` and `/play` produce, or play it directly:

```
/play the-dimming
```
