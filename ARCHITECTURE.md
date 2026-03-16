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
        │  [SESSION_END]                     │
        ├──────────────────────────> Team Lead (shuts down team)
        │
```

**The loop:** GM broadcasts narrative -> GM prompts each player -> players respond -> GM weaves responses into next beat -> repeat.

**Human I/O:** Human-controlled characters use the `ask_player` CLI (via Bash tool) directly. It routes input through the spectator web UI (if running) or falls back to terminal input. No relay through the team lead.

## Teams Architecture

The `/play` command uses Claude Code Teams to run D&D sessions with persistent teammates.

### How It Works

A team named `dnd-{campaign}` is created with:
- **GM teammate** (`gm` agent): Persistent for the entire session. Reads campaign design files and playthrough state once, communicates via `SendMessage`. Broadcasts `[NARRATIVE]` to all teammates, sends `[GM_TO_PLAYER]` directly to each player teammate, sends `[SESSION_END]` to the team lead. Updates `story-state.md` and `party-knowledge.md` in the playthrough directory directly after each scene.
- **Narrator teammate** (`narrator` agent): Observes GM broadcasts and peer DM activity. Writes scene files to the playthrough's `scenes/` directory in real-time. Output is secret-free.
- **Player teammates** (`player-teammate` agent): Persistent for the entire session. All characters — AI and human-controlled — use the same agent type. AI players decide autonomously. Human-controlled characters use the `ask_player` CLI (via Bash tool) to get input via the spectator web UI (or terminal fallback). From the GM's perspective, all players are identical. Any character can be toggled between human and AI control mid-session, enabling multiplayer. All players communicate directly with the GM via `[PLAYER_TO_GM]` and message each other via `[PLAYER_TO_PLAYER]`. Each player self-journals at beat boundaries to the playthrough directory.
- **Team lead** (main conversation): Lightweight delegate orchestrator. Creates the team, spawns all teammates, manages session lifecycle. Does NOT relay messages between GM and players — they communicate directly. Human input is handled by the player agent itself via the CLI.

### Human Control via CLI

Human-controlled characters are spawned with `Control: HUMAN` in their prompt. When they receive `[GM_TO_PLAYER]`, they call the `ask_player` CLI (via Bash tool) which auto-detects the best input channel:
- **Spectator web UI**: If the spectator app is running, the prompt appears in the browser with a countdown timer. The human responds there.
- **Terminal fallback**: If no spectator, falls back to `AskUserQuestion` in the Claude Code terminal.
- **AI takeover**: If the countdown expires, the character acts autonomously for that turn.
- **Full auto**: If the human toggles a character to AI control via the spectator UI, it acts autonomously until toggled back.

## Message Protocol

All teammate communication uses structured YAML-like tags in `SendMessage` content. See the **messaging-protocol** skill for the canonical reference. Key message types:

| Tag | Direction | Purpose |
|-----|-----------|---------|
| `[NARRATIVE]` | GM -> all | Player-facing narration (team lead displays, narrator captures, players receive awareness). Includes `## Party Activity` footer summarizing what each player is doing. |
| `[GM_TO_PLAYER]` | GM -> player | Character-specific prompts sent directly to player teammates |
| `[PLAYER_TO_GM]` | player -> GM | Actions, reactions, vetoes sent directly to GM |
| `[PLAYER_TO_PLAYER]` | player -> player | In-character dialogue between player teammates (GM-visible via peer DM) |
| `[ACTIVITY]` | player -> team lead | Player activity status for visibility (displayed in Party Activity footer) |
| `[SESSION_END]` | GM -> team lead | GM signals session complete (team lead shuts down team) |

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

Each player teammate only reads their own character sheet and journal (from the playthrough directory) and `party-knowledge.md`. The GM is trusted to include only character-appropriate information in `[GM_TO_PLAYER]` messages. Player teammates never read `story-state.md`, other character sheets, or NPC files.

The `/play` command handles this orchestration automatically.

### Known Limitation: Split-Party Peer DM Leakage

When the party splits, players in Group B may see idle summaries when the GM messages Group A. This is a platform limitation of peer DM visibility, not a design flaw.

**What leaks**: Players know that another group is receiving private prompts (message activity), but NOT the content of those messages. Example: "GM sent a message to Korimeth" -- not what was said.

**Impact**: Minimal. Players learn that another group exists and is active, which they likely already know from the narrative. Content remains isolated.

**Mitigation**: Players are trusted not to metagame based on activity signals. The prompt-based trust model handles this adequately for current use.

**Alternative for extended splits**: Spawn temporary sub-teams for each group to eliminate cross-group visibility entirely. This adds orchestration complexity and is only warranted for splits lasting multiple scenes.

## Gated Information Architecture

Campaign secrets are organized into per-act files under `story-arcs/`:

```
campaigns/{campaign}/
  story-arcs/
    UNLOCK.md         # Preconditions for each act
    act-1.md          # Current act (UNLOCKED)
    act-2.md          # Future act (LOCKED)
    act-3.md          # Endgame (LOCKED)
```

- `UNLOCK.md` defines preconditions and foreshadowing hints for each act
- `story-state.md` in the playthrough directory is slim -- current situation only, no future secrets
- At startup, the GM reads only UNLOCKED act files from the campaign's `story-arcs/`, preventing accidental leakage of future plot

This replaces the previous model where `story-state.md` contained all secrets for the entire campaign.

## Playthroughs

Campaign directories (`campaigns/{campaign}/`) are **read-only design material** -- world setting, character templates, beat sheets, story arcs, and NPC definitions. They are never modified during play.

Mutable game state lives in **playthrough directories** (`playthroughs/{campaign}/{game-name}/`). A playthrough is seeded on first play by copying key files from the campaign templates (`preferences.md`, `story-state.md`, `party-knowledge.md`, character sheets). From that point forward, the playthrough evolves independently -- the GM updates `story-state.md` and `party-knowledge.md` after each scene, players journal and update their character sheets, and the narrator writes scene files.

Multiple playthroughs of the same campaign are supported. Each playthrough has its own game state, allowing different groups or replays to diverge from the same starting point. The `/play` command prompts for playthrough selection (or creates a new one).

## Agent Descriptions

### Gameplay Agents
- **campaign-creator**: Designs new campaigns through interactive Q&A
- **character-creator**: Builds PCs/NPCs with proper D&D 5e stats
- **gm**: Persistent GM teammate (~350 lines). RULE ZERO at line 1 enforces session-end compliance. Communicates via SendMessage, reads campaign files once (including only UNLOCKED act files from `story-arcs/`), retains context for the entire session. Messages player teammates directly with `[GM_TO_PLAYER]`. Requires a `## Dice` section in FULL_CONTEXT/COMBAT_ACTION messages. Core loop includes conflict injection prompts. Does not write scene files (narrator handles this).
- **narrator**: Persistent Narrator teammate that observes all gameplay (GM broadcasts + peer DM visibility) and writes scene files in real-time. Output is secret-free -- only externally observable behavior. Feeds the novelization and audiobook pipelines.
- **player-teammate**: Unified player agent for both AI and human-controlled characters. Receives GM prompts directly, responds with actions/dialogue, can message other players in-character. Human-controlled characters use `ask_player` MCP tool for input (spectator web UI or terminal fallback). AI characters use ICE (Internal Conflict Engine) for authentic decisions. "Think Before You Speak" internal monologue before group decisions. Self-journals at beat boundaries. Any character can toggle between human and AI control mid-session.
- **dnd-enthusiast**: Experienced D&D player/DM offering feedback on campaign design, rules, and player experience
- **decision-log**: Records character decisions and actions after significant events to help with context reconstruction

### Novelization Agents
- **novelizer-planner**: Creates and validates novel outlines from campaign content. Handles planning, validation, and outline extension.
- **novelizer-writer**: Writes single chapter drafts from outline specs. Reads character sheets, decision-log, and previous chapters for continuity.
- **novelizer-editor**: Improves prose mechanics (clarity, flow, engagement) without changing plot. Reads drafts, writes edited versions.
- **novelizer-continuity**: Checks consistency across chapters. INCREMENTAL mode for quick checks every 2-3 chapters, FULL mode for complete analysis. PATTERN mode scans for repetitive prose (overused words, repeated constructions, character tic fatigue) and outputs pattern-report.md. Maintains continuity-manifest.md.
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
- **gm-dice-referee**: Dice discipline checklist -- ensures GM includes `## Dice` sections and doesn't skip roll opportunities
- **gm-npc-management**: NPC roleplay guidelines and dedicated NPC teammate lifecycle management
- **gm-pacing**: Staggered prompts, interaction windows, and conflict facilitation between players
- **gm-special-scenarios**: Handles GM edge cases (split parties, unconscious players, shopping/downtime, loot distribution, secret actions)
- **save-point**: Manages session state persistence for D&D campaigns
- **quick-or-veto**: The quick-or-veto pattern for AI player reactions
- **narrative-formatting**: Formatting system for D&D narrative output
- **audiobook-orchestration**: Orchestrates audiobook generation pipeline (segmentation, TTS generation, assembly)

### Novelization Skills
- **novelization-style**: Tone and style guidelines for converting campaigns into prose fiction
- **novelization-mechanics**: Chapter types, prose translation of D&D mechanics, output format rules, quality checklists
- **novelization-prose-diversity**: Anti-repetition guidance -- forbidden LLM cliche phrases, sentence structure diversity rules, and cross-chapter pattern avoidance

### Playtest Skills
- **playtest**: Full-auto playtest workflow -- spawns a team with GM, narrator, and all AI players to validate agent behavior. No human player needed.
