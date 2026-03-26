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

Chatterbox TTS lives in `~/.chatterbox/` with this structure:

```
~/.chatterbox/
├── venv/       # Python virtual environment
├── voices/     # Voice samples for cloning (.wav)
├── outputs/    # Generated audio output
└── voices.yaml # Voice configuration
```

**Setup:** Symlink into the repo so repo-relative paths work:

```bash
ln -s ~/.chatterbox/venv .chatterbox-venv
ln -s ~/.chatterbox/voices .chatterbox-voices
```

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

apps/spectator/         # Spectator web app (session viewer + player input)
├── server.ts           # Bun HTTP + WebSocket server
├── cli.ts              # CLI tool (ask-player, check-interrupt commands)
├── lib/                # Server libraries (parser, watcher, discovery)
├── public/             # Browser frontend (vanilla HTML/CSS/JS)
├── docs/               # Architecture documentation
└── test/               # CLI timeout test server

templates/              # Markdown templates for campaign content

campaigns/{campaign}/   # Read-only campaign design (templates)
├── overview.md         # World setting, themes, factions
├── world-primer.md     # Common knowledge any inhabitant would know
├── preferences.md      # Template (copied to playthrough)
├── story-state.md      # Starting state (copied to playthrough)
├── party-knowledge.md  # Starting knowledge (copied to playthrough)
├── party/              # Character sheet templates
├── npcs/               # NPC base definitions
├── items/              # Item definitions
├── locations/          # Location descriptions
├── factions/           # Faction details
├── beats/              # GM planning docs (beat sheets)
├── mechanics/          # Campaign-specific rules and subsystems
│   ├── README.md       # Index: what exists, who can read what
│   └── {mechanic}/     # Each mechanic is a subdirectory
│       ├── README.md   # Player-visible overview (what characters observe)
│       └── gm-guide.md # Full rules, tracking, adjudication (GM-only)
└── story-arcs/         # Gated plot secrets (per-act)
    ├── UNLOCK.md       # Act preconditions and foreshadowing hints
    ├── act-1.md        # Current act (UNLOCKED)
    └── ...

playthroughs/{campaign}/{game-name}/  # Mutable per-playthrough state
├── preferences.md      # Authoritative during play
├── story-state.md      # Evolves each session
├── party-knowledge.md  # Evolves each session
├── decision-log.md
├── relationships.md
├── party/              # Evolved character sheets + journals
│   ├── {char}.md
│   ├── {char}-journal.md
│   └── {char}-relationships.md
├── npcs/               # NPC interaction overlays
├── items/              # New items discovered
├── scenes/             # Narrator writes here
├── novel/              # Novelization and audiobook output
└── tmp/
    └── dashboard.md
```

## Path Conventions

- `{campaign}`: Campaign directory name (kebab-case, e.g., `the-rot-beneath`)
- `{game-name}`: Playthrough name within a campaign (kebab-case, e.g., `playthrough-1`)
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
Starts a session using Claude Code Teams. Prompts for playthrough selection (or creates a new one seeded from campaign templates). All participants are persistent teammates: GM, Narrator, and every player character. All player characters use the same unified agent -- human-controlled characters use the `ask_player` CLI (via Bash tool) for input, AI characters decide autonomously. Any character can be toggled between human and AI control mid-session, enabling multiplayer. The team lead is a lightweight delegate handling session lifecycle.

**Time estimate:** 30-90 minutes per session (3-5 major scenes).

### Spectator Mode (Optional)

Run the spectator web app in a separate terminal to watch the session unfold in a browser:

```bash
bun apps/spectator/server.ts
```

Opens at `http://localhost:3333`. Features:
- **Play-script view** of all agent communication in real-time
- **Player input** via browser instead of terminal (respond to GM prompts, interrupt, pause)
- **Per-character control** toggles (human/AI) for each character
- **Countdown timer** when a prompt is waiting (AI takes over if you don't respond)

The spectator app is optional -- sessions work fine without it (input falls back to the terminal). See `apps/spectator/docs/player-input-architecture.md` for the full design.

### What Happens During a Play Session

A session follows a repeating loop. The GM broadcasts a narrative scene describing the environment, NPCs, and events. The GM then sends direct prompts to each player character asking what they want to do. AI party members respond autonomously based on their personality, bonds, and flaws. Human-controlled characters use the `ask_player` CLI (via Bash tool), which routes input through the spectator web UI (if running) or falls back to the Claude Code terminal.

All responses flow back to the GM, who weaves them into the next narrative beat -- describing consequences, advancing the story, and introducing complications. Dice rolls happen when outcomes are uncertain: ability checks, saves, attack rolls. The GM requests specific rolls and the `toss` CLI executes them.

This cycle (narrative -> prompts -> responses -> narrative) repeats until a natural stopping point. The GM targets 3-5 major beats per session and actively looks for good stopping points after the third beat. The human can also end the session at any time by saying "end session" (or clicking Pause in the spectator UI).

Between beats, AI players may talk to each other in character, journal significant moments, and the narrator writes scene files to the playthrough's `scenes/` directory for the permanent record. All playthrough state is saved automatically -- `story-state.md`, `party-knowledge.md`, and character journals in the playthrough directory are updated so the next session picks up seamlessly.

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

| File | Location | Purpose | Who Reads It |
|------|----------|---------|--------------|
| `overview.md` | campaign | World setting, themes, major factions | GM, reference |
| `world-primer.md` | campaign | Common knowledge any inhabitant would know | GM, AI players |
| `party/{name}.md` | campaign | Character sheet templates | GM, reference |
| `npcs/{name}.md` | campaign | NPC base definitions + secrets | GM only |
| `items/{name}.md` | campaign | Item definitions | GM, reference |
| `locations/{name}.md` | campaign | Location descriptions and details | GM, reference |
| `factions/{name}.md` | campaign | Faction details and goals | GM, reference |
| `beats/` | campaign | GM planning docs (beat sheets) | GM only |
| `mechanics/` | campaign | Campaign-specific rules, subsystems, tracking | GM; player-visible READMEs for AI players |
| `story-arcs/UNLOCK.md` | campaign | Act preconditions and foreshadowing hints | GM only |
| `story-arcs/act-*.md` | campaign | Per-act secrets (GM reads only UNLOCKED acts) | GM only |
| `preferences.md` | playthrough | Narrative style, player character selection | Team lead |
| `story-state.md` | playthrough | Current situation and active quests (evolves each session) | GM only |
| `party-knowledge.md` | playthrough | Shared knowledge for AI players (no secrets) | GM, AI players |
| `decision-log.md` | playthrough | Character decisions and actions for context reconstruction | GM, reference |
| `relationships.md` | playthrough | Party relationship tracker | GM, reference |
| `party/{name}.md` | playthrough | Evolved character sheets | GM, that character's agent |
| `party/{name}-journal.md` | playthrough | Character journals | That character's agent |
| `scenes/` | playthrough | Narrative output (written by Narrator) | Narrator, novelization |
| `npcs/` | playthrough | NPC interaction overlays | GM only |
| `items/` | playthrough | New items discovered during play | GM, reference |

### Novel Directory (`{playthrough}/novel/`)

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

### Voice Samples

Chatterbox TTS voice samples for cloning live in `~/.chatterbox/voices/` (symlinked to `.chatterbox-voices`). See **audiobook-orchestration/voice-samples** skill for full reference including available samples, creation commands, and guidelines.

## Agents and Skills

Agent definitions live in `.claude/agents/` and skills in `.claude/skills/`. Skills are automatically discovered by Claude based on their description.

**v2 changes:** The `novelizer-pattern-reviewer` agent has been removed (merged into the continuity agent's PATTERN mode). New skills: `gm-dice-referee` (dice discipline checklist), `gm-npc-management` (NPC roleplay and dedicated NPC teammate lifecycle), `gm-pacing` (staggered prompts, interaction windows, conflict facilitation), `novelization-prose-diversity` (anti-repetition guidance), `playtest` (full-auto playtest workflow).

For the full list of agents (gameplay, novelization, audiobook, utility) and skills (user-facing, orchestration, novelization, playtest), see [ARCHITECTURE.md](ARCHITECTURE.md).

## Example Campaign

The [campaigns/the-dimming/](campaigns/the-dimming/) directory contains a complete campaign design: world-building, four characters with distinct voices, and beat sheets. Playthrough state (scenes, decision logs, evolved character sheets) lives in `playthroughs/the-dimming/`. Browse both to understand what `/new-campaign` and `/play` produce, or play it directly:

```
/play the-dimming
```
