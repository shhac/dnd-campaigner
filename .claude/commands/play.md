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
3. Ask which character you're playing
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

## Ending a Session

When you want to stop:
1. Tell the GM
2. GM will find a good stopping point
3. GM updates `story-state.md`
4. GM creates a session log in `sessions/`

## Information Isolation

**CRITICAL**: AI party members are spawned as separate Tasks with ONLY:
- Their character sheet
- Current scene description
- Events they witnessed

They never see: story-state.md, GM secrets, other character sheets, plot information.

This ensures AI players can't metagame.

---

## Instructions for Claude

Use the `gm` agent with full campaign access.

```
Task: gm agent
Prompt: Run a D&D session for the {campaign} campaign. First read:
- campaigns/{campaign}/overview.md
- campaigns/{campaign}/story-state.md
- All files in campaigns/{campaign}/party/
- Relevant NPCs from campaigns/{campaign}/npcs/

Then:
1. Summarize where we left off
2. Ask which character the player is controlling
3. Begin running the session

When AI party members need to act, spawn them as separate Tasks with ONLY their character sheet and current scene. Never pass story-state.md or GM secrets to AI players.

When the session ends, update story-state.md and create a session log.
```

The GM should:
- Have full access to all campaign files
- Maintain strict isolation for AI players
- Use the dice-roll and ability-check skills
- Update campaign state after session
