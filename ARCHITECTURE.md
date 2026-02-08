# Architecture

Technical internals of the D&D Campaigner system. For getting started, see [QUICKSTART.md](QUICKSTART.md). For commands and campaign file reference, see [CLAUDE.md](CLAUDE.md).

## Session Flow

```
                    ┌──────────────┐
                    │  Team Lead   │  (you see this in terminal)
                    └──────┬───────┘
                           │
                           │ spawns teammates
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼──────┐    ┌──────▼───────┐
   │   GM    │      │  Narrator  │    │   Players    │
   │         │      │            │    │  (AI + Human │
   │         │      │            │    │   Relay)     │
   └────┬────┘      └─────┬──────┘    └──────┬───────┘
        │                 │                  │
        │  [NARRATIVE]    │                  │
        ├─────────────────┴──────────────────┤  (broadcast to all)
        │                                    │
        │  [GM_TO_PLAYER]                    │
        ├───────────────────────────────────>│  (direct to each player)
        │                                    │
        │              [PLAYER_TO_GM]        │
        │<───────────────────────────────────┤  (direct to GM)
        │                                    │
        │         [PLAYER_TO_PLAYER]         │
        │            ┌──────────────────────>│  (between players)
        │            │                       │
        │  [RELAY_TO_HUMAN]                  │
        │            │              ┌────────┤
        │            │              │ Human  │
        │            │              │ Relay  ├──> Team Lead ──> Human
        │            │              └────────┤
        │  [SESSION_END]                     │
        ├──────────────────────────> Team Lead (shuts down team)
        │
```

**The loop:** GM broadcasts narrative -> GM prompts each player -> players respond -> GM weaves responses into next beat -> repeat.

**Human I/O:** The human's relay teammate sends `[RELAY_TO_HUMAN]` to the team lead, which displays it and collects the human's response via `[HUMAN_DECISION]`.

## Teams Architecture

The `/play` command uses Claude Code Teams to run D&D sessions with persistent teammates.

### How It Works

A team named `dnd-{campaign}` is created with:
- **GM teammate** (`gm` agent): Persistent for the entire session. Reads campaign files once, communicates via `SendMessage`. Broadcasts `[NARRATIVE]` to all teammates, sends `[GM_TO_PLAYER]` directly to each player teammate, sends `[SESSION_END]` to the team lead. Updates `story-state.md` and `party-knowledge.md` directly after each scene.
- **Narrator teammate** (`narrator` agent): Observes GM broadcasts and peer DM activity. Writes scene files to `scenes/` in real-time. Output is secret-free.
- **Player teammates** (`player-teammate` / `human-relay-player` agents): Persistent for the entire session. Each character (AI and human-controlled) is a teammate. AI players decide and act autonomously. The human's character relays GM prompts to the human and translates their decisions into in-character actions. All players communicate directly with the GM via `[PLAYER_TO_GM]` and can message each other in-character via `[PLAYER_TO_PLAYER]`. Each player self-journals at beat boundaries.
- **Team lead** (main conversation): Lightweight delegate orchestrator. Creates the team, spawns all teammates, handles human I/O when the human-relay player requests it (via `[RELAY_TO_HUMAN]`), and manages session lifecycle. Does NOT relay messages between GM and players -- they communicate directly.

### Human-Relay and Autonomous Modes

The human's character teammate operates in one of two modes:
- **HUMAN_RELAY** (default): Relays GM prompts to the human, translates human decisions into in-character actions. The human makes the choices; the teammate adds character voice, continuity, and personality.
- **AUTONOMOUS**: When the human steps away, the character makes its own decisions based on personality, bonds, and flaws. Provides a "while you were away" summary when switching back.

## Message Protocol

All teammate communication uses structured YAML-like tags in `SendMessage` content. See the **messaging-protocol** skill for the canonical reference. Key message types:

| Tag | Direction | Purpose |
|-----|-----------|---------|
| `[NARRATIVE]` | GM -> all | Player-facing narration (team lead displays, narrator captures, players receive awareness) |
| `[GM_TO_PLAYER]` | GM -> player | Character-specific prompts sent directly to player teammates |
| `[PLAYER_TO_GM]` | player -> GM | Actions, reactions, vetoes sent directly to GM |
| `[PLAYER_TO_PLAYER]` | player -> player | In-character dialogue between player teammates (GM-visible via peer DM) |
| `[RELAY_TO_HUMAN]` | human relay -> team lead | Human's player teammate requests human input |
| `[HUMAN_DECISION]` | team lead -> human relay | Team lead sends human's response back to their player teammate |
| `[SESSION_END]` | GM -> team lead | GM signals session complete (team lead shuts down team) |
| `[MODE_SWITCH]` | team lead -> human relay | Switches human's player between HUMAN_RELAY and AUTONOMOUS modes |

### Request Types

7 request types used in `[GM_TO_PLAYER]` messages:

| Type | When Used |
|------|-----------|
| QUICK_REACTION | Brief response needed, 1-2 sentences |
| FULL_CONTEXT | Significant decision, full engagement |
| COMBAT_ACTION | Combat turn |
| SECRET_ACTION | Private action hidden from other players |
| OPTIONAL_REACTION | Player may respond or stay silent |
| REFLECTION | Journaling or internal monologue moment |
| INTERACTION | Player-to-player exchange, GM steps back |

### Veto Pattern

Players can veto GM actions or reject NPC offers using `[PLAYER_TO_GM] type: VETO`. This is a core player agency mechanism.

## Information Isolation

**CRITICAL**: AI players must not have access to GM knowledge. This is the foundational design principle.

### Knowledge Boundaries

| Agent | Knows | Does NOT Know |
|-------|-------|---------------|
| GM | Everything -- plot secrets, NPC plans, hidden content | N/A |
| AI Player | Own character sheet, witnessed events, scene descriptions | Other PCs' secrets, GM notes, unopened plot |
| Human Player | Whatever you choose to read | N/A (you have repo access) |

### Enforcement

Each player teammate only reads their own character sheet, their journal, and `party-knowledge.md`. The GM is trusted to include only character-appropriate information in `[GM_TO_PLAYER]` messages. Player teammates never read `story-state.md`, other character sheets, or NPC files.

The `/play` command handles this orchestration automatically.

### Known Limitation: Split-Party Peer DM Leakage

When the party splits, players in Group B may see idle summaries when the GM messages Group A. This is a platform limitation of peer DM visibility, not a design flaw.

**What leaks**: Players know that another group is receiving private prompts (message activity), but NOT the content of those messages. Example: "GM sent a message to Korimeth" -- not what was said.

**Impact**: Minimal. Players learn that another group exists and is active, which they likely already know from the narrative. Content remains isolated.

**Mitigation**: Players are trusted not to metagame based on activity signals. The prompt-based trust model handles this adequately for current use.

**Alternative for extended splits**: Spawn temporary sub-teams for each group to eliminate cross-group visibility entirely. This adds orchestration complexity and is only warranted for splits lasting multiple scenes.

## Agent Descriptions

### Gameplay Agents
- **campaign-creator**: Designs new campaigns through interactive Q&A
- **character-creator**: Builds PCs/NPCs with proper D&D 5e stats
- **gm**: Persistent GM teammate. Communicates via SendMessage, reads campaign files once, retains context for the entire session. Messages player teammates directly with `[GM_TO_PLAYER]`. Does not write scene files (narrator handles this).
- **narrator**: Persistent Narrator teammate that observes all gameplay (GM broadcasts + peer DM visibility) and writes scene files in real-time. Output is secret-free -- only externally observable behavior. Feeds the novelization and audiobook pipelines.
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
- **novelizer-publisher**: Evaluates reader experience -- "Is this worth reading?" Provides feedback on engagement, pacing, and what might make readers put the book down.
- **novelizer-reviser**: Applies publisher feedback to improve chapter engagement and pacing without changing plot.
- **novelizer-reader**: Beta reader providing emotional/experiential reactions from an enthusiastic fantasy fan perspective.

### Audiobook Agents
- **audiobook-segmenter**: Parses novel chapter markdown, detects voice boundaries (dialogue, narration, internal thoughts), creates segment files for TTS.
- **segment-reviewer**: Reviews audiobook segments -- resolves pronouns to speakers, extracts speech verbs, strips dialogue tags for clean TTS, merges short segments.
- **audiobook-generator**: Generates WAV audio from segments using Chatterbox TTS. Invokes CLI script, monitors progress, tracks per-segment status.
- **audiobook-assembler**: Assembles WAV segments into final audiobook files (MP3/M4A). Verifies output and reports results.

### Utility Agents
- **character-chat**: Meta-conversations with D&D characters outside gameplay. Fireside chat mode -- READ-ONLY, does not affect campaign state.
- **llm-prompt-expert**: Expert in LLM prompting, agent design, and prompt engineering. Use for validating plans, reviewing implementations.

## Skills

Skills are automatically discovered by Claude based on their description. Agents can also explicitly reference skills in their frontmatter.

### User-Facing Skills
- **dice-roll**: Intelligent `toss` CLI wrapper for D&D dice notation
- **ability-check**: DC tables, saving throws, conditions, advantage/disadvantage, skill guidance
- **dnd-rules-reference**: Quick reference for common D&D 5e mechanics (NPC attitudes, rest mechanics, encounter difficulty)
- **name-generator**: Creates varied, original names by race/culture while avoiding duplicates
- **random-events**: Generates weather, encounters, rumors, NPC moods to make the world feel alive

### Orchestration Skills
- **play-orchestration**: Core orchestration loop for Teams-based D&D play sessions. Creates a persistent team with all participants as teammates (GM, Narrator, player characters). Team lead is a lightweight delegate handling human I/O and session lifecycle. GM and players communicate directly. Used by `/play`.
- **messaging-protocol**: Canonical reference for the structured message protocol used by all agents. Defines every message tag, sender/recipient, payload format, and routing rules. Referenced by GM, players, narrator, and team lead.
- **ask-user-orchestration**: Orchestrates agents that need to ask users questions
- **combat-orchestration**: Manages theater-of-mind D&D combat with threat assessment and pacing tiers
- **gm-special-scenarios**: Handles GM edge cases (split parties, unconscious players, shopping/downtime, loot distribution, secret actions)
- **save-point**: Manages session state persistence for D&D campaigns
- **quick-or-veto**: The quick-or-veto pattern for AI player reactions
- **narrative-formatting**: Formatting system for D&D narrative output
- **audiobook-orchestration**: Orchestrates audiobook generation pipeline (segmentation, TTS generation, assembly)

### Novelization Skills
- **novelization-style**: Tone and style guidelines for converting campaigns into prose fiction
- **novelization-mechanics**: Chapter types, prose translation of D&D mechanics, output format rules, quality checklists
