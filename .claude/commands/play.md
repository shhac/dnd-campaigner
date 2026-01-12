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
- `sessions/session-{N}.md` - Running session log

**Why this matters:** AI party members are spawned fresh each time with no memory. They rely on `party-knowledge.md` and their personal journals for continuity. If the GM doesn't save, AI players won't know what happened.

## Ending a Session

When you want to stop:
1. Tell the GM
2. GM will find a good stopping point
3. GM updates `story-state.md` AND `party-knowledge.md`
4. GM creates/finalizes session log in `sessions/`

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
- campaigns/{campaign}/party-knowledge.md
- All files in campaigns/{campaign}/party/
- Relevant NPCs from campaigns/{campaign}/npcs/

Then:
1. Summarize where we left off
2. Ask which character the player is controlling
3. Begin running the session

SAVE POINTS: Update story-state.md AND party-knowledge.md at these moments:
- End of combat
- End of scene (location change or major situation change)
- Major discovery or after significant NPC conversation
- Before rests
- When the player asks to save
- End of session (always)

When AI party members need to act, spawn them as separate Tasks. Tell them to read:
- Their character sheet
- campaigns/{campaign}/party-knowledge.md
- Their journal: campaigns/{campaign}/party/{name}-journal.md

Never pass story-state.md or GM secrets to AI players.
```

The GM should:
- Have full access to all campaign files
- Maintain strict isolation for AI players
- Use the dice-roll and ability-check skills
- **Update party-knowledge.md at every save point** (AI players depend on this)
- Update story-state.md with GM-only information
- Maintain running session log in sessions/

### Scene Flow: Show PC Dialogue Before NPC Responses

When the player chooses an action or dialogue approach (e.g., "Respect the professional" or "Try to intimidate"), the GM must narrate what the PC actually says or does BEFORE showing NPC responses:

1. **Player chooses approach** → "I'll try flattery"
2. **GM shows PC's actual words/actions** → *"Your reputation precedes you, Captain. The harbor masters speak highly of your... discretion."*
3. **Then NPC responds** → The captain's weathered face creases into a half-smile...

This ensures the player sees their character's voice in the narrative, not just the outcome.

**Two options for generating PC dialogue:**
- **GM writes it directly** (preferred for flow): Keep it brief and in-character based on the character sheet's voice/personality
- **Spawn ai-player Task**: For important moments where the player's character voice matters, spawn them as a Task to generate their own line

The player should always see what their character said before seeing how NPCs react.

## Orchestration: Handling GM Questions

When the GM agent returns output that contains a question for the player (character selection, action choices, decision points), the orchestrator MUST present these using **AskUserQuestion** with structured options rather than just relaying the text.

Examples of when to use AskUserQuestion:
- "Which character are you playing?" → Present list of available PCs as options
- "What do you do?" → Present as open question (AskUserQuestion still allows free-text)
- "Do you want to [X] or [Y]?" → Present X and Y as explicit options
- "Would you like to play out the combat or resolve it quickly?" → Present both options

This ensures:
1. Clear, structured interaction for the player
2. Consistent UX across all player decisions
3. Easier input handling (especially for selection-type questions)
