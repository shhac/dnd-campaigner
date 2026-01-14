---
name: play-orchestration
description: Core orchestration loop for D&D play sessions. Use when orchestrating D&D play sessions, when the GM returns narrative to relay, when handling [AWAIT_AI_PLAYERS] signals, when asking the player questions via AskUserQuestion, or when context may have been compacted during a long session. MANDATORY - After spawning fresh GM post-AI-actions, trigger auto-journal skill with narrative file. This skill survives context compaction.
---

# Play Orchestration Skill

Core orchestration logic for running D&D sessions. This skill guides the main conversation (orchestrator) through spawning the GM, relaying narrative, handling signals, and coordinating AI players.

## When This Skill Activates

Use this skill when:
- Starting a new D&D play session
- The GM agent returns narrative to relay to the player
- The GM outputs `[AWAIT_AI_PLAYERS: ...]` signal
- The GM asks a question that requires AskUserQuestion
- Context has been compacted during a long session (re-invoke to restore orchestration patterns)

## Quick Reference: The Orchestration Loop

```
/play {campaign}
    |
    v
Clean up orphaned delta files (rm -f tmp/*-delta.md)
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
Spawn fresh GM (reads gm-context.md)             |
    |                                            |
    v                                            |
GM narrates with AI player actions               |
GM writes delta files (if state changed)         |
    |                                            |
    +---> auto-journal (background, don't wait)  |
    |     - Journal agents (ALL chars)           |
    |     - state-delta-writer                   |
    |     - knowledge-delta-writer               |
    |                                            |
    v                                            |
Relay to player ----------------- ---------------+
    |
    v
Loop until session ends
```

## Step 0: Session Start Cleanup

Before loading preferences, clean up any orphaned delta files from previous sessions:

```bash
# Delete any orphaned delta files from previous sessions
rm -f campaigns/{campaign}/tmp/*-delta.md 2>/dev/null || true
```

**Rationale**: Stale deltas from previous sessions may contain outdated information. Processing them could introduce inconsistencies, so we delete them without processing at session start.

## Step 1: Load Preferences

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

## Step 2: Spawning the GM

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
```

## Step 3: Signal Detection

Monitor GM output for these signals:

| Signal | Action | Skill to Use |
|--------|--------|--------------|
| `[AWAIT_AI_PLAYERS: char1, char2]` | Spawn AI players in action mode | invoke-ai-players |
| No signal, narrative output | Relay to player, await input, resume GM | - |
| No signal, question for player | Use AskUserQuestion, then resume GM | - |

## Step 4: Relaying GM Narrative

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

## Step 5: Handling Player Questions with AskUserQuestion

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

## Step 6: Spawning a Fresh GM (After Signals)

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

Read any response files if applicable and continue.
```

## Signal Handling Details

### [AWAIT_AI_PLAYERS] Signal

1. Strip the signal from displayed output
2. Show any narrative that preceded the signal
3. **Use the invoke-ai-players skill** to spawn AI players in action mode
4. After all AI players complete, spawn fresh GM
5. **⚠️ MANDATORY: After GM returns narrative, trigger auto-journal** (see checkpoint below)

---

## ⚠️ MANDATORY CHECKPOINT: Post-AI-Action Journaling

**CRITICAL**: After the GM narrates the results of an `[AWAIT_AI_PLAYERS]` cycle, you MUST:

1. Spawn `narrative-writer` agent (foreground) with the narrative content
2. Spawn journal agents (background, parallel) for ALL party members
3. Then continue with player interaction

**Detection**: If you just spawned a fresh GM after AI players responded, and the GM returned narrative (not another signal), this is a journaling checkpoint.

**Invocation**: See "How to Invoke Auto-Journal" below for the two-step process.

**Do NOT skip this step.** AI player memories depend on journaling.

---

## Scene Flow: PC Actions Before NPC Responses

When the player chooses an action or dialogue approach:

1. **Player chooses approach** -> "I'll try flattery"
2. **GM shows PC's actual words/actions** -> *"Your reputation precedes you, Captain..."*
3. **Then NPC responds** -> The captain's weathered face creases into a half-smile...

Always show what the PC says/does before showing NPC reactions.

## Automatic Journaling

Journaling is now automatic via the `auto-journal` skill. The orchestrator triggers journaling after the GM returns narrative following an AI action cycle.

### When Auto-Journal Triggers

Auto-journal runs after the GM narrates the results of an `[AWAIT_AI_PLAYERS]` cycle:

1. GM signals `[AWAIT_AI_PLAYERS: char1, char2]`
2. AI players respond with actions
3. GM resumes and narrates what happened
4. **Orchestrator triggers auto-journal** (background, don't wait)
5. Continue with player interaction

### How to Invoke Auto-Journal

After receiving GM narrative that includes AI player action results, use a two-step process to avoid verbose file-writing output.

**Step 1: Write Narrative File (Foreground)**

Spawn a `narrative-writer` agent (NOT in background):

```
Task: narrative-writer
Prompt: |
  Campaign: {campaign}

  ## Narrative

  {paste the full GM narrative here}
```

Wait for this to complete before Step 2.

**Step 2: Spawn Background Agents (Parallel)**

Spawn all background agents in a single message:

**Journal Agents** (for each character):

```
Task: ai-player-journal
run_in_background: true
Prompt: |
  Campaign: {campaign}
  Character: {character}
```

**State Delta Writer** (updates story-state.md):

```
Task: state-delta-writer
run_in_background: true
Prompt: |
  Campaign: {campaign}
```

**Knowledge Delta Writer** (updates party-knowledge.md):

```
Task: knowledge-delta-writer
run_in_background: true
Prompt: |
  Campaign: {campaign}
```

**Critical**:
- Use `run_in_background: true` for all agents
- Spawn all agents in parallel (single message with multiple Task calls)
- Include ALL party members for journaling (both AI-controlled and human-controlled characters)
- Delta writers skip gracefully if no delta files exist

This approach:
- Token efficient (narrative passed once, not 4 times)
- No verbose Write diffs (foreground task shows brief summary)
- Proper ordering (file written before agents read)
- Parallel execution (all journals and delta writers run concurrently)
- Automatic state updates when GM writes delta files

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

## Human Player Character Journaling

The human player's character is included in automatic journaling alongside AI characters.

### How It Works

When invoking the auto-journal skill, include ALL party members in the character list:

```
Skill: auto-journal
Args: {campaign} {ai-char1},{ai-char2},{ai-char3},{human-player-char}
```

The human player's character is treated identically to AI characters for journaling purposes:
- Same journal agent spawns for all characters
- Same narrative file is read by all
- All journals are written in parallel

### Example

If the human plays `korvin-blackwood` and the AI controls `tilda-brannock`, `brother-aldric`, and `mira-thornwood`:

```
Skill: auto-journal
Args: the-rot-beneath tilda-brannock,brother-aldric,mira-thornwood,korvin-blackwood
```

All four characters get journal entries capturing the scene from their perspectives.

## Parallelization Guidelines

Understanding what can run in parallel vs. sequentially is critical for efficient orchestration.

### What Runs in Parallel

| Task Type | Details |
|-----------|---------|
| **AI player actions** | All AI players in an AWAIT_AI_PLAYERS batch spawn simultaneously |
| **Auto-journal** | All characters (AI + human) journal simultaneously via auto-journal skill |
| **Decision-log** | Runs in background while GM continues (fire-and-forget) |
| **Delta writers** | state-delta-writer and knowledge-delta-writer run in parallel with journals |

### What Must Be Sequential

| Dependency | Reason |
|-----------|--------|
| **Prompt files before spawn** | GM must write prompts before AI players can read them |
| **AI responses before GM resume** | GM needs the response content to continue narration |
| **Player input before GM resume** | GM waits for human player's chosen action |
| **Narrative file before auto-journal** | Orchestrator writes narrative before invoking auto-journal skill |

### Fire-and-Forget Tasks

These tasks can run in background without waiting:
- **Decision-log**: Reads response files and appends to log - no conflict with GM
- **Auto-journal**: Always runs in background - journal agents don't block story progression
- **Delta writers**: Skip gracefully if no delta files exist; delete delta files after processing

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
                                            |
                                            v
                                   GM narrates results
                                   GM writes delta files (if state changed)
                                            |
                                            +---> auto-journal skill (background)
                                            |     - Journal agents (all chars)
                                            |     - state-delta-writer
                                            |     - knowledge-delta-writer
                                            |
                                            v
                                    Relay to player
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

- **invoke-ai-players**: Handles AI player spawning for action mode
- **auto-journal**: Triggers automatic journaling for all characters after AI action cycles
- **save-point**: Manages session state persistence
- **combat-orchestration**: Special handling for combat encounters
- **decision-log** (agent): Records AI player decisions for session reconstruction
