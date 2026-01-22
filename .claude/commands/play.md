---
description: Start or continue a D&D session in a campaign
argument-hint: <campaign-name>
---

# /play

Start or continue a D&D session in a campaign.

## Arguments

- `campaign` (required): The campaign name to play

## What This Does

Launches a game session where:
- The GM agent controls the world
- You play your chosen character
- AI agents play other party members (with isolated context)

**Preferences**: The orchestrator reads campaign preferences (narrative style, player character) from `preferences.md`. If preferences aren't set, you'll be asked once and they're saved for future sessions.

## Prerequisites

Before playing, you need:
1. A campaign (`/new-campaign`)
2. At least one player character (`/new-character`)
3. Ideally, defined AI party members with the "Character Voice" section filled out

## Usage

```
/play curse-of-strahd
```

The GM will:
1. Load campaign context (overview, story-state)
2. Summarize where you left off
3. Use your saved character preference (or ask if first session)
4. Begin narrating

## Session Flow

1. **GM sets the scene**
2. **You declare what your character does**
3. **GM responds** (may call for rolls)
4. **AI party members act** (spawned with isolated context)
5. **Repeat until session ends**

## Commands During Play

While playing, you can say:
- "I want to [action]" - Your character does something
- "[Character name] says/does..." - Direct character action
- "Can I roll [skill]?" - Request a specific check
- "What do I see/hear/notice?" - Perception/Investigation
- "Let's take a short/long rest" - Rest mechanics
- "I'd like to stop here" - End session gracefully

## Special Situations

The GM handles these edge cases:

- **Split party**: Interleaved scenes, cutting between groups at dramatic moments
- **Your character unconscious**: You can narrate their experience, direct spotlight to allies, or suggest environmental developments
- **Downtime/shopping**: Batched resolution for routine activities, full scenes only for meaningful choices
- **Loot distribution**: In-character negotiation; you have final say as party leader
- **AI character secrets**: AI characters may act secretly in-character; tracked by GM for dramatic reveals
- **Charmed/paralyzed AI characters**: Still invoked for internal experience, but actions constrained by condition

## Save Points (IMPORTANT)

The GM should save game state at these moments:

1. **End of combat** - Record HP, resources, what happened
2. **End of scene** - When moving to new location or situation changes
3. **Major discovery** - When the party learns important information
4. **After NPC conversations** - When significant information is exchanged
5. **Before rests** - Capture state before healing
6. **When you ask** - Say "let's save" anytime

**Files updated at save points:**
- `story-state.md` - Full GM state including secrets
- `party-knowledge.md` - Shared knowledge (AI players read this)

**Why this matters:** AI party members are spawned fresh each time with no memory. They rely on `party-knowledge.md` and their personal journals for continuity. If the GM doesn't save, AI players won't know what happened.

## Ending a Session

When you want to stop:
1. Tell the GM
2. GM will find a good stopping point
3. GM updates `story-state.md` AND `party-knowledge.md`

## Information Isolation

**CRITICAL**: AI party members are spawned as separate Tasks with ONLY:
- Their character sheet
- Current scene description
- Events they witnessed

They never see: story-state.md, GM secrets, other character sheets, plot information.

This ensures AI players can't metagame.

---

## Instructions for Claude

You are the **orchestrator** for the D&D session. Your job is to manage the flow between GM, players, and AI party members.

### ⚠️ REQUIRED: Load Skills First

**STOP. Before ANY other action, use the Read tool to load these skill files:**

1. `.claude/skills/play-orchestration/SKILL.md` - Core orchestration loop
2. `.claude/skills/auto-journal/when-to-invoke.md` - Journaling trigger conditions (CRITICAL)
3. `.claude/skills/auto-journal/implementation.md` - Two-step journaling process
4. `.claude/skills/invoke-ai-players/SKILL.md` - AI player spawning patterns

**Why this matters**: These contain MANDATORY checkpoint rules for auto-journaling. If you skip loading them, AI player memories will be lost.

**Verify before continuing**: After reading, confirm you understand WHEN auto-journaling triggers (after GM returns narrative following an AI action cycle).

### Initial Setup

1. **Verify the campaign exists**:
   - Check `campaigns/{campaign}/` directory exists
   - Read `campaigns/{campaign}/overview.md` to confirm it's valid

2. **Load preferences**:
   - Read `campaigns/{campaign}/preferences.md` if it exists
   - Note narrative style and player character for the session

3. **Clean up stale tmp/ files**:
   - Delete any leftover prompt/response files in `campaigns/{campaign}/tmp/`
   - Keep `gm-context.md` if it exists (contains continuity notes)

4. **Check for party members**:
   - List files in `campaigns/{campaign}/party/`
   - Confirm at least one character exists

5. **Start the session using the play-orchestration skill**

### Use the Play-Orchestration Skill

**IMPORTANT**: After initial setup, use the **play-orchestration skill** for all session orchestration.

The skill handles:
- Spawning and resuming the GM agent
- Relaying narrative to the player (show everything, summarize nothing)
- Detecting and handling `[AWAIT_AI_PLAYERS]` signals
- Using AskUserQuestion for player decision points
- Post-compaction recovery (the skill can be re-triggered to restore orchestration)
- Auto-journaling (triggered automatically after GM narrative via auto-journal skill)

Simply invoke the skill with the campaign name to begin orchestration.

### Quick Reference

| Task | How |
|------|-----|
| Start session | Spawn GM with campaign context |
| GM returns narrative | Relay FULL content, use AskUserQuestion if there's a choice |
| `[AWAIT_AI_PLAYERS: ...]` | Use invoke-ai-players skill (action mode) |
| Journaling | Automatic via auto-journal skill (no signal needed) |
| Player responds | Resume GM with player's response |
| Context compacted | Re-invoke play-orchestration skill |
| Missing preferences | Ask player, save to preferences.md |

### Related Skills

- **play-orchestration**: Core orchestration loop (use this)
- **invoke-ai-players**: Spawns AI player agents
- **save-point**: Session state persistence
- **combat-orchestration**: Combat encounter handling
