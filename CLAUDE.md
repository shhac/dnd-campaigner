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

### Python Virtual Environments

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

## Directory Structure

```
.claude/
├── commands/           # Slash commands
├── agents/             # AI agent definitions
└── skills/             # Reusable skills

templates/              # Markdown templates for campaign content
campaigns/{campaign}/   # Individual campaign data
├── overview.md         # World setting, themes, factions
├── story-state.md      # Current situation, secrets (GM only)
├── party-knowledge.md  # Shared knowledge (no secrets)
├── decision-log.md     # Character decisions and actions
├── party/              # Player character sheets
├── npcs/               # NPC details and secrets
├── items/              # Notable items and artifacts
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

### Knowledge Boundaries

| Agent | Knows | Does NOT Know |
|-------|-------|---------------|
| GM | Everything - plot secrets, NPC plans, hidden content | N/A |
| AI Player | Own character sheet, witnessed events, scene descriptions | Other PCs' secrets, GM notes, unopened plot |
| Human Player | Whatever you choose to read | N/A (you have repo access) |

### Enforcement

Each player teammate only reads their own character sheet, their journal, and `party-knowledge.md`. The GM is trusted to include only character-appropriate information in `[GM_TO_PLAYER]` messages. Player teammates never read `story-state.md`, other character sheets, or NPC files.

The `/play` command handles this orchestration automatically.

## Teams Architecture

The `/play` command uses Claude Code Teams to run D&D sessions with persistent teammates.

### How It Works

A team named `dnd-{campaign}` is created with:
- **GM teammate** (`gm` agent): Persistent for the entire session. Reads campaign files once, communicates via `SendMessage`. Broadcasts `[NARRATIVE]` to all teammates, sends `[GM_TO_PLAYER]` directly to each player teammate, sends structured messages (`[STATE_UPDATED]`, `[SESSION_END]`) to the team lead.
- **Narrator teammate** (`narrator` agent): Observes GM broadcasts and peer DM activity. Writes scene files to `scenes/` in real-time. Output is secret-free.
- **Player teammates** (`player-teammate` / `human-relay-player` agents): Persistent for the entire session. Each character (AI and human-controlled) is a teammate. AI players decide and act autonomously. The human's character relays GM prompts to the human and translates their decisions into in-character actions. All players communicate directly with the GM via `[PLAYER_TO_GM]` and can message each other in-character via `[PLAYER_TO_PLAYER]`. Each player self-journals at beat boundaries.
- **Team lead** (main conversation): Lightweight delegate orchestrator. Creates the team, spawns all teammates, handles human I/O when the human-relay player requests it (via `[RELAY_TO_HUMAN]`), manages session lifecycle, and spawns background agents (delta writers, decision-log). Does NOT relay messages between GM and players — they communicate directly.

### Message Protocol

All teammate communication uses structured YAML-like tags in `SendMessage` content. See the **messaging-protocol** skill for the canonical reference. Key message types:
- `[NARRATIVE]`: GM broadcasts player-facing narration (team lead displays, narrator captures, players receive awareness)
- `[GM_TO_PLAYER]`: GM sends character-specific prompts directly to player teammates
- `[PLAYER_TO_GM]`: Player teammates send actions/reactions/vetoes directly to GM
- `[PLAYER_TO_PLAYER]`: In-character dialogue between player teammates (GM-visible via peer DM)
- `[RELAY_TO_HUMAN]`: Human's player teammate requests human input via team lead
- `[HUMAN_DECISION]`: Team lead sends human's response back to their player teammate
- `[JOURNAL_CHECKPOINT]`: Team lead signals player teammates to write journal entries
- `[STATE_UPDATED]`: GM signals delta files are ready (team lead spawns background writers)
- `[SESSION_END]`: GM signals session complete (team lead shuts down team)
- `[MODE_SWITCH]`: Team lead switches human's player between HUMAN_RELAY and AUTONOMOUS modes

### Human-Relay and Autonomous Modes

The human's character teammate operates in one of two modes:
- **HUMAN_RELAY** (default): Relays GM prompts to the human, translates human decisions into in-character actions. The human makes the choices; the teammate adds character voice, continuity, and personality.
- **AUTONOMOUS**: When the human steps away, the character makes its own decisions based on personality, bonds, and flaws. Provides a "while you were away" summary when switching back.

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
Starts a session using Claude Code Teams. All participants are persistent teammates: GM, Narrator, and every player character (AI and human). The GM messages players directly; players respond directly. The human's character operates in HUMAN_RELAY mode (relays decisions to/from the human) or AUTONOMOUS mode (acts independently when the human steps away). Players self-journal at beat boundaries. The team lead is a lightweight delegate handling human I/O and session lifecycle.

### Playing (Legacy Mode)
```
/play-legacy {campaign-name}
```
Starts a session using the legacy spin-up/spin-down model. You declare your character, GM orchestrates. Uses ephemeral AI player agents instead of persistent teammates.

### Chatting with Characters
```
/chat {campaign-name} {character-name}
```
Have a fireside conversation with a D&D character outside of gameplay. Characters are safe, at rest, and willing to be vulnerable. READ-ONLY - does not affect campaign state.

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
| `pattern-report.md` | Cross-chapter repetition analysis |
| `publisher-feedback.md` | Reader experience assessment |
| `metadata.yaml` | Final novel metadata |
| `table-of-contents.md` | Final TOC |
| `novelization-state.yaml` | Progress tracking for resume |
| `voices.yaml` | POV character to TTS voice mapping (created by `/setup-voices`) |
| `drafts/` | Archived intermediate files (drafts, fix-requests) |

### Voice Samples (`.chatterbox-voices/`)

Chatterbox TTS voice samples for cloning. See **audiobook-orchestration/voice-samples** skill for full reference including available samples, creation commands, and guidelines.

## Agent Descriptions

### Gameplay Agents
- **campaign-creator**: Designs new campaigns through interactive Q&A
- **character-creator**: Builds PCs/NPCs with proper D&D 5e stats
- **gm**: Persistent GM teammate. Communicates via SendMessage, reads campaign files once, retains context for the entire session. Messages player teammates directly with `[GM_TO_PLAYER]`. Does not write scene files (narrator handles this).
- **gm-legacy**: Runs the game in legacy spin-up/spin-down mode. Used by `/play-legacy`.
- **narrator**: Persistent Narrator teammate that observes all gameplay (GM broadcasts + peer DM visibility) and writes scene files in real-time. Output is secret-free — only externally observable behavior. Feeds the novelization and audiobook pipelines.
- **player-teammate**: Persistent AI player teammate. Receives GM prompts directly, responds with actions/dialogue, can message other players in-character. Self-journals at beat boundaries. Maintains character personality across the entire session.
- **human-relay-player**: Persistent human player teammate. Relays GM prompts to the human, translates human decisions into in-character actions. Supports HUMAN_RELAY and AUTONOMOUS modes. Indistinguishable from AI player teammates from the GM's perspective.
- **dnd-enthusiast**: Experienced D&D player/DM offering feedback on campaign design, rules, and player experience
- **decision-log**: Records character decisions and actions after significant events to help with context reconstruction

### Novelization Agents
- **novelizer-planner**: Creates and validates novel outlines from campaign content. Handles planning, validation, and outline extension.
- **novelizer-writer**: Writes single chapter drafts from outline specs. Reads character sheets, decision-log, and previous chapters for continuity.
- **novelizer-editor**: Improves prose mechanics (clarity, flow, engagement) without changing plot. Reads drafts, writes edited versions.
- **novelizer-continuity**: Checks consistency across chapters. INCREMENTAL mode for quick checks every 2-3 chapters, FULL mode for complete analysis. Maintains continuity-manifest.md.
- **novelizer-pattern-reviewer**: Scans all chapters for repetitive prose patterns (overused words, repeated constructions, character tic fatigue). Runs after continuity check, outputs pattern-report.md.
- **novelizer-fixer**: Applies continuity corrections from approved fix requests to chapter drafts.
- **novelizer-publisher**: Evaluates reader experience - "Is this worth reading?" Provides feedback on engagement, pacing, and what might make readers put the book down.
- **novelizer-reviser**: Applies publisher feedback to improve chapter engagement and pacing without changing plot.
- **novelizer-reader**: Beta reader providing emotional/experiential reactions from an enthusiastic fantasy fan perspective.

### Audiobook Agents
- **audiobook-segmenter**: Parses novel chapter markdown, detects voice boundaries (dialogue, narration, internal thoughts), creates segment files for TTS.
- **segment-reviewer**: Reviews audiobook segments - resolves pronouns to speakers, extracts speech verbs, strips dialogue tags for clean TTS, merges short segments.
- **audiobook-generator**: Generates WAV audio from segments using Chatterbox TTS. Invokes CLI script, monitors progress, tracks per-segment status.
- **audiobook-assembler**: Assembles WAV segments into final audiobook files (MP3/M4A). Verifies output and reports results.

### Utility Agents
- **knowledge-delta-writer**: Merges party knowledge deltas into party-knowledge.md. Reads tmp/party-knowledge-delta.md and applies changes.
- **state-delta-writer**: Merges GM state deltas into story-state.md. Reads tmp/gm-state-delta.md and applies changes.
- **character-chat**: Meta-conversations with D&D characters outside gameplay. Fireside chat mode - READ-ONLY, does not affect campaign state.
- **llm-prompt-expert**: Expert in LLM prompting, agent design, and prompt engineering. Use for validating plans, reviewing implementations.

## Skills

Skills are automatically discovered by Claude based on their description. Agents can also explicitly reference skills in their frontmatter.

### User-Facing Skills
- **dice-roll**: Intelligent `toss` CLI wrapper for D&D dice notation
- **ability-check**: DC tables, saving throws, conditions, advantage/disadvantage, skill guidance
- **name-generator**: Creates varied, original names by race/culture while avoiding duplicates
- **random-events**: Generates weather, encounters, rumors, NPC moods to make the world feel alive

### Orchestration Skills
- **play-orchestration**: Core orchestration loop for Teams-based D&D play sessions. Creates a persistent team with all participants as teammates (GM, Narrator, player characters). Team lead is a lightweight delegate handling human I/O and session lifecycle. GM and players communicate directly. Used by `/play`.
- **play-orchestration-legacy**: Core orchestration loop for legacy D&D play sessions (used by `/play-legacy`)
- **messaging-protocol**: Canonical reference for the structured message protocol used by all agents. Defines every message tag, sender/recipient, payload format, and routing rules. Referenced by GM, players, narrator, and team lead.
- **ask-user-orchestration**: Orchestrates agents that need to ask users questions
- **combat-orchestration**: Manages theater-of-mind D&D combat with threat assessment and pacing tiers
- **save-point**: Manages session state persistence for D&D campaigns
- **quick-or-veto**: The quick-or-veto pattern for AI player reactions
- **narrative-formatting**: Formatting system for D&D narrative output
