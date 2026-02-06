---
description: Start or continue a D&D session using Claude Code Teams
argument-hint: <campaign-name>
---

# /play-team

Start or continue a D&D session using the Teams-based architecture.

**This is the Teams version of `/play`.** It uses persistent GM and Narrator teammates with structured messaging, replacing the legacy spin-up/spin-down model. Both commands coexist during Phase 1 for side-by-side comparison.

## Arguments

- `campaign` (required): The campaign name to play

## What This Does

Launches a game session where:
- A **persistent GM teammate** runs the world (reads campaign files once, maintains context)
- A **persistent Narrator teammate** captures the story in real-time (writes scene files)
- You play your chosen character
- AI agents play other party members (spawned as ephemeral Tasks with isolated context)
- All communication uses **structured messaging** via SendMessage

**Preferences**: The orchestrator reads campaign preferences (narrative style, player character) from `preferences.md`. If preferences aren't set, you'll be asked once and they're saved for future sessions.

## Prerequisites

Before playing, you need:
1. A campaign (`/new-campaign`)
2. At least one player character (`/new-character`)
3. Ideally, defined AI party members with the "Character Voice" section filled out

## Usage

```
/play-team the-rot-beneath
```

The session will:
1. Create team `dnd-{campaign}`
2. Spawn GM and Narrator as persistent teammates
3. GM loads campaign context (overview, story-state) — reads files **once**
4. GM summarizes where you left off
5. Begin the session loop

## Session Flow

1. **GM broadcasts narrative** — you see the scene, Narrator captures it
2. **You declare what your character does** — sent to GM as `[PLAYER_ACTION]`
3. **GM responds** (may call for rolls, invoke AI players)
4. **AI party members act** (spawned as isolated Tasks when needed)
5. **GM weaves responses into narrative** — broadcasts again
6. **Background agents** process state saves and journals
7. **Repeat until session ends**

## Commands During Play

While playing, you can say:
- "I want to [action]" - Your character does something
- "[Character name] says/does..." - Direct character action
- "Can I roll [skill]?" - Request a specific check
- "What do I see/hear/notice?" - Perception/Investigation
- "Let's take a short/long rest" - Rest mechanics
- "Let's save" - Trigger a save checkpoint
- "I'd like to stop here" - End session gracefully

## Key Differences from /play

| Aspect | `/play` (Legacy) | `/play-team` (Teams) |
|--------|------------------|---------------------|
| GM persistence | Fresh spawn each cycle | Persistent teammate (session-long) |
| GM context | Re-reads files every cycle | Reads once, retains memory |
| Communication | File-based (`tmp/` prompt/response) | Structured messages (`SendMessage`) |
| Scene capture | GM writes scene files | Narrator teammate writes scenes |
| AI players | Ephemeral Tasks (same) | Ephemeral Tasks (same for Phase 1) |
| State saves | Auto-journal skill | Background Tasks via `[STATE_UPDATED]` |

## Special Situations

The GM handles these edge cases (same as `/play`):

- **Split party**: Interleaved scenes, cutting between groups at dramatic moments
- **Your character unconscious**: Direct spotlight to allies, or suggest environmental developments
- **Downtime/shopping**: Batched resolution for routine activities, full scenes only for meaningful choices
- **Loot distribution**: In-character negotiation; you have final say as party leader
- **AI character secrets**: AI characters may act secretly in-character; tracked by GM for dramatic reveals
- **Charmed/paralyzed AI characters**: Still invoked for internal experience, but actions constrained by condition

## Save Points

The GM saves game state at these moments:

1. **End of combat** - Record HP, resources, what happened
2. **End of scene** - When moving to new location or situation changes
3. **Major discovery** - When the party learns important information
4. **After NPC conversations** - When significant information is exchanged
5. **Before rests** - Capture state before healing
6. **When you ask** - Say "let's save" anytime

**How saves work in Teams mode:**
- GM writes delta files to `tmp/`
- GM sends `[STATE_UPDATED]` to team lead
- Team lead spawns background agents: `state-delta-writer`, `knowledge-delta-writer`, journals, decision-log
- All background — does not interrupt play

## Ending a Session

When you want to stop:
1. Tell the GM (say "I'd like to stop here")
2. GM finds a good stopping point and performs final save
3. GM sends `[SESSION_END]` with summary and next-session hook
4. Team lead shuts down all teammates and deletes the team

## Information Isolation

**CRITICAL**: AI party members are spawned as separate Tasks with ONLY:
- Their character sheet
- Scene context from the GM's `[AWAIT_PLAYERS]` message
- Events they would know about

They never see: story-state.md, GM secrets, other character sheets, plot information.

The GM is trusted to enforce information isolation when composing per-character context in `[AWAIT_PLAYERS]` messages — same enforcement model as the legacy system.

---

## Instructions for Claude

You are the **team lead** for a Teams-based D&D session. Your job is to create the team, spawn teammates, handle human I/O, and manage the session lifecycle.

### REQUIRED: Load Skill First

**STOP. Before ANY other action, use the Read tool to load this skill file:**

1. `.claude/skills/team-play-orchestration/SKILL.md` - Core orchestration loop for Teams

**Then also load:**

2. `.claude/skills/team-play-orchestration/session-lifecycle.md` - Startup, save, end, cleanup procedures

**Why this matters**: These contain the complete message protocol, team creation steps, and message dispatch logic. Without them, you won't know how to parse GM messages or coordinate the session.

### Initial Setup

1. **Verify the campaign exists**:
   - Check `campaigns/{campaign}/` directory exists
   - Read `campaigns/{campaign}/overview.md` to confirm it's valid

2. **Load preferences**:
   - Read `campaigns/{campaign}/preferences.md` if it exists
   - Note narrative style and player character for the session

3. **Clean up stale tmp/ files**:
   - Delete any orphaned delta files in `campaigns/{campaign}/tmp/`

4. **Check for party members**:
   - List files in `campaigns/{campaign}/party/`
   - Confirm at least one character exists

5. **Start the session using the team-play-orchestration skill**

### Use the Team-Play-Orchestration Skill

**IMPORTANT**: After initial setup, use the **team-play-orchestration skill** for all session orchestration.

The skill handles:
- Creating the team (`dnd-{campaign}`)
- Spawning GM and Narrator as persistent teammates
- Parsing structured messages from the GM (`[NARRATIVE]`, `[AWAIT_PLAYERS]`, `[ASK_PLAYER]`, `[STATE_UPDATED]`, `[SESSION_END]`)
- Spawning ephemeral AI player Tasks when needed
- Using AskUserQuestion for player decision points
- Background agent spawning for saves and journals
- Post-compaction recovery
- Graceful session shutdown

Simply invoke the skill with the campaign name to begin orchestration.

### Quick Reference

| Task | How |
|------|-----|
| Start session | TeamCreate + spawn GM & Narrator teammates |
| GM broadcasts narrative | Display FULL content to human |
| `[AWAIT_PLAYERS]` | Spawn ephemeral AI Tasks, collect, send `[PLAYER_RESPONSES]` to GM |
| `[ASK_PLAYER]` | Convert to AskUserQuestion, send `[PLAYER_ANSWER]` to GM |
| `[STATE_UPDATED]` | Spawn background delta writers + journal agents |
| `[SESSION_END]` | Display summary, shutdown teammates, TeamDelete |
| Player responds | Send `[PLAYER_ACTION]` to GM |
| Context compacted | Re-read files, send `[CONTEXT_REFRESH]` to GM |
| Missing preferences | Ask player via AskUserQuestion, save to preferences.md |

### Related Skills

- **team-play-orchestration**: Core orchestration loop (use this)
- **save-point**: Session state persistence
- **combat-orchestration**: Combat encounter handling
- **narrative-formatting**: Output formatting for narrative display
