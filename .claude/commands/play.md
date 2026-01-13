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

You are the **orchestrator** for the D&D session. Your job is to:
1. Spawn the GM agent
2. Watch for AI player signals
3. Spawn AI players when signaled (using the **invoke-ai-players skill**)
4. Resume the GM
5. Relay narrative to the player

### Step 1: Spawn the GM

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

When you need AI player input:
1. Write prompt files to campaigns/{campaign}/tmp/
2. Output [AWAIT_AI_PLAYERS: char1, char2] and STOP

When you want to trigger journaling:
1. Write journal prompt files to campaigns/{campaign}/tmp/
2. Output [JOURNAL_UPDATE: char1, char2, char3] and STOP
```

### Step 2: Orchestration Loop

**Use the invoke-ai-players skill** for AI player orchestration.

Monitor GM output for signals:
- `[AWAIT_AI_PLAYERS: char1, char2]` → Spawn AI players in action mode
- `[JOURNAL_UPDATE: char1, char2]` → Spawn AI players in journal mode
- No signal → Relay narrative to player, await input, resume GM

Key rules:
- **Spawn in parallel** when multiple characters are listed
- **Don't pass campaign content** - all context flows through files
- **Human character gets journaling** - included in `[JOURNAL_UPDATE]` signals

### Scene Flow: Show PC Dialogue Before NPC Responses

When the player chooses an action or dialogue approach, the GM narrates what the PC says/does BEFORE showing NPC responses:

1. **Player chooses approach** → "I'll try flattery"
2. **GM shows PC's actual words/actions** → *"Your reputation precedes you, Captain..."*
3. **Then NPC responds** → The captain's weathered face creases into a half-smile...

## Orchestration: Handling GM Questions

**IMPORTANT**: When the GM agent returns output containing a question for the player, you MUST use the **AskUserQuestion** tool rather than just relaying text and waiting for input.

### When to Use AskUserQuestion

| GM Output Contains | Action |
|-------------------|--------|
| "Which character are you playing?" | AskUserQuestion with PC names as options |
| "What do you do?" | AskUserQuestion with common actions + "Other" for free text |
| "Do you want to [X] or [Y]?" | AskUserQuestion with X and Y as options |
| "Would you like to play out combat or resolve quickly?" | AskUserQuestion with both options |
| Any decision point or choice | AskUserQuestion with the choices as options |

### Example: Character Selection

When the GM asks which character the player is controlling:

```
AskUserQuestion:
  question: "Which character are you playing?"
  header: "Character"
  options:
    - label: "Corwin"
      description: "Human fighter, former city guard"
    - label: "Tilda"
      description: "Half-elf rogue, ex-Flaming Fist"
    - label: "Grimjaw"
      description: "Dwarf barbarian, mountain clan exile"
```

### Example: Action Decision

When the GM asks "What do you do?":

```
AskUserQuestion:
  question: "What do you do?"
  header: "Action"
  options:
    - label: "Investigate"
      description: "Look around, search for clues"
    - label: "Talk"
      description: "Speak to someone present"
    - label: "Attack"
      description: "Initiate combat"
    - label: "Move"
      description: "Go somewhere else"
```

The player can always select "Other" for custom input.

### Why This Matters

1. **Cleaner UX** - Structured choices are easier to interact with
2. **Faster input** - Click vs type for common actions
3. **Context preserved** - Options remind player of available choices
4. **Consistent experience** - Every decision point feels the same
