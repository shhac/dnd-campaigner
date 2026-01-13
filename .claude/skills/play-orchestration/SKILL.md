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
Player responds -> Resume GM with input          |
    |                                            |
    v                                            |
[AWAIT_AI_PLAYERS] -> invoke-ai-players skill    |
    |                                            |
    v                                            |
[JOURNAL_UPDATE] -> invoke-ai-players skill      |
    |                                            |
    v                                            |
Resume GM ----------------------------------------+
    |
    v
Loop until session ends
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

*Tilda drums her fingers on the table, her eyes scanning the room.*

> **Tilda**: "Fools with rent due. I've taken worse jobs."

> **Mira**: *She speaks quietly.* "The posting mentioned 'disturbances.' What kind makes a merchant seal a warehouse and walk away?"

*Gideon raises his mug.*

> **Gideon**: "Shall we go see what's rotting in Warehouse 7?"
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
    - label: "Corwin"
      description: "Human fighter, former city guard"
    - label: "Tilda"
      description: "Half-elf rogue, ex-Flaming Fist"
```

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

## Step 5: Resuming the GM

After handling signals or player input, resume the GM:

```
Task: gm (resume)
Prompt: Continue the session for {campaign}.

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
3. Note: Human player's character gets journaling too - all listed characters
4. After all AI players complete, resume GM

## Scene Flow: PC Actions Before NPC Responses

When the player chooses an action or dialogue approach:

1. **Player chooses approach** -> "I'll try flattery"
2. **GM shows PC's actual words/actions** -> *"Your reputation precedes you, Captain..."*
3. **Then NPC responds** -> The captain's weathered face creases into a half-smile...

Always show what the PC says/does before showing NPC reactions.

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
