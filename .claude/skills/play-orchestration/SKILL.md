---
name: play-orchestration
description: Core orchestration loop for D&D play sessions. Use when orchestrating D&D play sessions, when the GM returns narrative to relay, when handling [AWAIT_AI_PLAYERS] or [JOURNAL_UPDATE] signals, when asking the player questions via AskUserQuestion, or when context may have been compacted during a long session. This skill survives context compaction.
---

# Play Orchestration Skill

Core orchestration logic for running D&D sessions. This skill guides the main conversation (orchestrator) through spawning the GM, relaying narrative, handling signals, and coordinating AI players.

## When This Skill Activates

Use this skill when:
- Starting a new D&D play session
- The GM agent returns narrative to relay to the player
- The GM outputs `[AWAIT_AI_PLAYERS: ...]` or `[JOURNAL_UPDATE: ...]` signals
- The GM asks a question that requires AskUserQuestion
- Context has been compacted during a long session (re-invoke to restore orchestration patterns)

## Quick Reference: The Orchestration Loop

```
/play {campaign}
    |
    v
Load Preferences (or ask player)
    |
    v
Spawn GM (with campaign context + preferences) --+
    |                                            |
    v                                            |
GM narrates -> Relay to player                   |
    |                                            |
    v                                            |
Player responds -> Spawn fresh GM with input     |
    |                                            |
    v                                            |
[AWAIT_AI_PLAYERS] -> invoke-ai-players skill    |
    |                 (all AI players parallel)  |
    v                                            |
AI players respond                               |
    |                                            |
    +---> decision-log (background, don't wait)  |
    |                                            |
    v                                            |
[JOURNAL_UPDATE] -> invoke-ai-players skill      |
    |               (ALL chars parallel,         |
    |                including human player)     |
    v                                            |
Spawn fresh GM (reads gm-context.md) ------------+
    |
    v
Loop until session ends (track significant interactions)
```

## Step 0: Load Preferences

Before spawning the GM, check for and load player preferences.

### Read Preferences File

Check if `campaigns/{campaign}/preferences.md` exists.

If the file exists, read it to extract:
- `narrative_style`: The formatting style for dialogue and scenes
- `player_character`: Which character the player controls

### Handle Narrative Style

If `narrative_style` is set in preferences:
- Note it for passing to the GM (e.g., "script", "novel", "hybrid", "minimal")

If `narrative_style` is NOT set:
- Use AskUserQuestion to ask the player:

```
AskUserQuestion:
  question: "What narrative style would you like for this session?"
  header: "Narrative Style"
  options:
    - label: "Script"
      description: "Clean dialogue format with speaker names, minimal prose"
    - label: "Novel"
      description: "Rich prose with woven dialogue, like reading a fantasy novel"
    - label: "Hybrid"
      description: "Mix of both - prose narration with clear dialogue formatting"
    - label: "Minimal"
      description: "Brief, functional descriptions focused on game mechanics"
```

- Save their choice to `campaigns/{campaign}/preferences.md`

### Handle Player Character

If `player_character` is set in preferences:
- Note it for passing to the GM (skip the "which character" question)

If `player_character` is NOT set:
- The GM will ask during session start (or you can ask here via AskUserQuestion)
- After the player answers, save to `campaigns/{campaign}/preferences.md`

### Preferences File Format

```markdown
# Session Preferences

## Narrative Style
narrative_style: hybrid

## Player Character
player_character: Corwin
```

## Step 1: Spawning the GM

When starting a session, spawn the GM agent with this prompt:

```
Task: gm agent
Prompt: Run a D&D session for the {campaign} campaign.

Use {narrative_style} formatting style for dialogue and scenes.
[If player_character is known: The player is controlling {player_character}.]

First read:
- campaigns/{campaign}/overview.md
- campaigns/{campaign}/story-state.md
- campaigns/{campaign}/party-knowledge.md
- All files in campaigns/{campaign}/party/
- Relevant NPCs from campaigns/{campaign}/npcs/

Then:
1. Summarize where we left off
2. [If player_character unknown: Ask which character the player is controlling]
3. Begin running the session

When you need AI player input:
1. Write prompt files to campaigns/{campaign}/tmp/
2. Output [AWAIT_AI_PLAYERS: char1, char2] and STOP

When you want to trigger journaling:
1. Write journal prompt files to campaigns/{campaign}/tmp/
2. Output [JOURNAL_UPDATE: char1, char2, char3] and STOP
```

## Step 2: Signal Detection

Monitor GM output for these signals:

| Signal | Action | Skill to Use |
|--------|--------|--------------|
| `[AWAIT_AI_PLAYERS: char1, char2]` | Spawn AI players in action mode | invoke-ai-players |
| `[JOURNAL_UPDATE: char1, char2]` | Spawn AI players in journal mode | invoke-ai-players |
| No signal, narrative output | Relay to player, await input, resume GM | - |
| No signal, question for player | Use AskUserQuestion, then resume GM | - |

## Step 3: Relaying GM Narrative

**CRITICAL**: Show everything, summarize nothing.

When the GM returns narrative, dialogue, or scene descriptions:
1. Strip any signal markers before displaying
2. Relay the FULL content to the player
3. Use proper formatting (see Formatting Guidelines below)
4. Never condense or paraphrase the GM's creative output

### Formatting Guidelines

| Content Type | Format | Example |
|-------------|--------|---------|
| **Character speech** | Blockquote with bold name | > **Gideon**: "Shall we investigate?" |
| **GM narration** | Plain text, italics for emphasis | The tavern falls quiet. *Something about his bearing demands attention.* |
| **Character actions** | Italics | *Mira reaches for her blade.* |
| **Dice results** | Code formatting | `Perception check: 14 + 3 = 17` |
| **GM notes/mechanics** | Parenthetical | (DC 15 - Success) |

### Example: Full Scene Relay

Instead of:
```
The party introduces themselves and agrees to investigate.
```

Show the full scene:
```markdown
The four of you settle into the corner booth, tankards between you.

> **Gideon**: "So. A warehouse sealed for a decade, and someone's paying to crack it open." *He takes a long pull of his ale.* "Fifty gold to walk into the dark."

*Tilda-Brannock drums her fingers on the table, her eyes scanning the room.*

> **Tilda-Brannock**: "Fools with rent due. I've taken worse jobs."

> **Mira-Thornwood**: *She speaks quietly.* "The posting mentioned 'disturbances.' What kind makes a merchant seal a warehouse and walk away?"

*Gideon-Harrowmoor raises his mug.*

> **Gideon-Harrowmoor**: "Shall we go see what's rotting in Warehouse 7?"
```

## Step 4: Handling Player Questions with AskUserQuestion

When the GM output contains a question for the player, use AskUserQuestion rather than plain text.

### When to Use AskUserQuestion

| GM Output Contains | Action |
|-------------------|--------|
| "Which character are you playing?" | AskUserQuestion with PC names as options |
| "What do you do?" | AskUserQuestion with common actions |
| "Do you want to [X] or [Y]?" | AskUserQuestion with X and Y as options |
| Any decision point | AskUserQuestion with the choices |

### Character Selection Example

```
AskUserQuestion:
  question: "Which character are you playing?"
  header: "Character"
  options:
    - label: "Corwin-Ashford"
      description: "Human fighter, former city guard"
    - label: "Tilda-Brannock"
      description: "Half-elf rogue, ex-Flaming Fist"
```

**Note**: Character names use full hyphenated format matching the character sheet filename.

### Action Decision Example

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

The player can always type a custom response instead of selecting an option.

## Step 5: Spawning a Fresh GM (After Signals)

After handling signals or player input, spawn a **fresh** GM agent (do NOT resume):

**Why fresh spawn?** The GM agent doesn't properly "complete" before yielding control - the "STOP" instruction is just prompt text, not an API-level mechanism. Resuming incomplete agents causes 400 errors. Continuity is maintained via `gm-context.md`.

```
Task: gm agent
Prompt: Continue the session for {campaign}.

**First**: Read your context notes from campaigns/{campaign}/tmp/gm-context.md
to restore continuity from before the handoff. This is CRITICAL for session flow.

Use {narrative_style} formatting style for dialogue and scenes.

[Include context based on what happened:]
- If player responded: "Player said: {response}"
- If action mode complete: "AI player responses ready in tmp/"
- If journal mode complete: "Journal updates complete"

Read any response files if applicable and continue.
```

## Signal Handling Details

### [AWAIT_AI_PLAYERS] Signal

1. Strip the signal from displayed output
2. Show any narrative that preceded the signal
3. **Use the invoke-ai-players skill** to spawn AI players in action mode
4. After all AI players complete, resume GM

### [JOURNAL_UPDATE] Signal

1. Strip the signal from displayed output
2. **Use the invoke-ai-players skill** to spawn AI players in journal mode
3. **Handle human player's character journaling** (see Human Player Journal section below)
4. After all journaling complete, resume GM

## Scene Flow: PC Actions Before NPC Responses

When the player chooses an action or dialogue approach:

1. **Player chooses approach** -> "I'll try flattery"
2. **GM shows PC's actual words/actions** -> *"Your reputation precedes you, Captain..."*
3. **Then NPC responds** -> The captain's weathered face creases into a half-smile...

Always show what the PC says/does before showing NPC reactions.

## Auto-Journal Reminders

The orchestrator should track significant interactions and trigger journal updates at natural breakpoints.

### What Counts as a Significant Interaction

| Interaction Type | Examples |
|-----------------|----------|
| Combat encounters | Any fight, regardless of outcome |
| Major revelations | Plot secrets revealed, NPC motives uncovered |
| Scene changes | Moving to new location, time jumps |
| NPC conversations with new info | Learning lore, receiving quests, key dialogue |
| Character moments | Personal growth, relationship changes, moral choices |

### When to Trigger Journal Updates

If it's been **2-3 significant interactions** since the last journal update:

1. Wait for a **natural breakpoint** (scene transition, rest, travel)
2. Note to yourself: "Journal update due - several significant events since last update"
3. Ask the GM to trigger `[JOURNAL_UPDATE]` or trigger it directly

### Tracking Approach

Mentally track (or note in context):
- Last journal update point
- Count of significant interactions since then
- Type of interactions (for journal richness)

Example internal note:
```
Journal tracking: Last update after warehouse exploration.
Since then: 1) Combat with fungal creatures, 2) Found Rina's body, 3) Discovered smuggling ledger
-> 3 significant events, trigger journal at next natural break
```

## Decision-Log Integration

After AI players respond to action prompts, invoke the decision-log agent to record what happened. This creates a reconstruction trail for debugging and continuity.

### When to Invoke Decision-Log

Invoke the decision-log agent:
- **After** AI players complete their action responses
- **In parallel** with resuming the GM (fire-and-forget)
- At other significant decision points (optional)

### Decision-Log Flow

```
[AWAIT_AI_PLAYERS] signal received
    |
    v
Spawn AI players (action mode)
    |
    v
Collect responses
    |
    +---> Invoke decision-log agent (background, fire-and-forget)
    |
    v
Resume GM with responses (don't wait for decision-log)
```

### Decision-Log Invocation

Run decision-log with `run_in_background: true` - don't wait for it. The agent reads response files from `tmp/` and appends to `decision-log.md`, which doesn't conflict with the GM's workflow.

```
Task: decision-log agent (run_in_background: true)
Prompt: Record the following AI player decisions for {campaign}.

Characters involved: {char1}, {char2}
Scene context: {brief scene description}

Responses are in campaigns/{campaign}/tmp/

Record these for session reconstruction.
```

The decision-log agent handles file management and formatting.

## Human Player Journal

The human player's character (from `preferences.md`) should also get journal entries during `[JOURNAL_UPDATE]` triggers.

### Why Human Player Journals Matter

- Maintains parity with AI character journals
- Creates a complete party journal record
- Captures the human player's character's perspective on events
- Useful for session recaps and long-term continuity

### How Human Player Journaling Works

**The GM includes the human player's character in the JOURNAL_UPDATE signal.** All characters (both AI-controlled and human-controlled) are journaled in the same parallel batch.

When the GM triggers `[JOURNAL_UPDATE: gideon-harrowmoor, mira-thornwood, corwin-ashford]` (where `corwin-ashford` is the human player's character):
- The invoke-ai-players skill spawns journal agents for ALL listed characters
- The human player's character is treated the same as AI characters for journaling
- All journal writes happen in parallel

### Journal Update Sequence

1. GM triggers `[JOURNAL_UPDATE: char1, char2, player_char]` (includes ALL characters)
2. Spawn journal agents for ALL listed characters in parallel (via invoke-ai-players skill)
3. All journals complete
4. Resume GM

**Note**: There is no separate step for human player journaling. The GM is responsible for including the human player's character name in the JOURNAL_UPDATE signal, and invoke-ai-players handles the entire batch.

### Example Journal Entry (Human Character)

If the human plays Corwin (pragmatic fighter):
```markdown
## Session Entry - The Warehouse

We found what we came for, and more besides. Rina didn't make it—body
was in the basement, looked like she'd been dead for days. The fungal
growth down there... unnatural. Mira seemed shaken. Can't blame her.

The ledger we found names names. Councilman Vance's seal was on half
those shipping manifests. Whatever's growing in that warehouse, someone
in the Hall of Lords paid to put it there.

Tomorrow we dig into Vance's business dealings. Tonight, I need ale.
```

## Parallelization Guidelines

Understanding what can run in parallel vs. sequentially is critical for efficient orchestration.

### What Runs in Parallel

| Task Type | Details |
|-----------|---------|
| **AI player actions** | All AI players in an AWAIT_AI_PLAYERS batch spawn simultaneously |
| **AI player journals** | All characters (AI + human) in a JOURNAL_UPDATE batch spawn simultaneously |
| **Decision-log** | Runs in background while GM continues (fire-and-forget) |

### What Must Be Sequential

| Dependency | Reason |
|-----------|--------|
| **Prompt files before spawn** | GM must write prompts before AI players can read them |
| **AI responses before GM resume** | GM needs the response content to continue narration |
| **Player input before GM resume** | GM waits for human player's chosen action |
| **Journals before resume** (usually) | Optional - can fire-and-forget if not blocking |

### Fire-and-Forget Tasks

These tasks can run in background without waiting:
- **Decision-log**: Reads response files and appends to log - no conflict with GM
- **Journals** (optional): If you don't need confirmation, journals can fire-and-forget

### Parallelization Flow Example

```
[AWAIT_AI_PLAYERS: gideon-harrowmoor, mira-thornwood, tilda-brannock]
    |
    +---> Spawn gideon-harrowmoor agent ----+
    +---> Spawn mira-thornwood agent -------+---> Collect all responses
    +---> Spawn tilda-brannock agent -------+
                                            |
                                            +---> decision-log (background, don't wait)
                                            |
                                            v
                                       Resume GM

[JOURNAL_UPDATE: gideon-harrowmoor, mira-thornwood, tilda-brannock, corwin-ashford]  (corwin-ashford = human player)
    |
    +---> Journal gideon-harrowmoor --------+
    +---> Journal mira-thornwood -----------+
    +---> Journal tilda-brannock -----------+---> All complete (or fire-and-forget)
    +---> Journal corwin-ashford -----------+
                                 |
                                 v
                            Resume GM
```

### Key Principle

**Spawn all agents in a batch simultaneously.** Don't wait for one character before starting another. The only sequential requirement is having prompt files ready before spawning.

## Post-Compaction Recovery

If this skill is invoked after context compaction:

1. You are the orchestrator for a D&D session
2. Re-read `campaigns/{campaign}/preferences.md` to restore narrative style and player character settings
3. There should be an active GM agent running the campaign
4. Resume the orchestration loop from wherever it was interrupted
5. If unclear what state the session is in, resume GM and ask it to recap
6. When resuming GM, include the narrative style preference to maintain consistent formatting

## Error Handling

### GM Doesn't Return

If the GM agent seems stuck:
- Resume it with "Continue narrating"
- Or provide a gentle prompt about what happened last

### AI Players Don't Complete

If some AI players fail:
- Resume GM anyway with available responses
- GM will handle missing responses

### Missing Files

If prompt/response files are missing:
- Check `campaigns/{campaign}/tmp/` exists
- GM is responsible for writing prompts before signaling

## Related Skills

- **invoke-ai-players**: Handles actual AI player spawning (action and journal modes)
- **save-point**: Manages session state persistence
- **combat-orchestration**: Special handling for combat encounters
- **decision-log** (agent): Records AI player decisions for session reconstruction
