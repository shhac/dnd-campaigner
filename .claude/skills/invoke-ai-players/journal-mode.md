# Journal Mode

AI players update their character journals with complete context: scene, action, and outcome.

## When Used

After the GM narrates the outcome of a scene or interaction, ALL characters (including the human player's character) update their journals.

Typical triggers:
- After combat resolves
- After significant NPC conversations
- After major discoveries
- After scene transitions
- At session save points

## Why Separate Journaling?

In action mode, AI players respond without knowing the outcome. If they journaled immediately, their journal would be incomplete:

**Without separate journaling:**
> I drew my sword and confronted the merchant.

**With separate journaling:**
> I drew my sword and confronted the merchant. He surrendered immediately, revealing a hidden crossbow. We confiscated his weapons and he confessed to buying from the smugglers.

Separate journaling captures the full narrative arc.

## Human Player Character

The human player's character is journaled **exactly the same way** as AI characters. The ai-player agent doesn't know or care whether it's updating the journal for a human-controlled or AI-controlled character - it just receives a journal prompt and updates the journal.

The GM includes the human's character in the `[JOURNAL_UPDATE]` signal:

```
[JOURNAL_UPDATE: corwin, tilda, grimjaw]
         │
         └── Human player's character (gets journal update too)
```

The orchestrator spawns ai-player in journal mode for ALL listed characters, including the human's.

This gives the human's character:
- A record of their adventure from their character's perspective
- Continuity between sessions (AI agents can read the journal for context)
- The same journaling quality and format as AI characters

## File Flow

```
GM writes:       tmp/{character}-journal-prompt.md
AI player reads: journal prompt + existing journal
AI player updates: party/{character}-journal.md
```

Note: In journal mode, AI players don't write a response file. They just update their journal directly.

## Journal Prompt Structure

```markdown
---
mode: journal
---

## Scene Before
[What was happening before the action]

## Your Action
[What this character did - from their perspective]

## What Happened
[The outcome as narrated by the GM]

## Update Your Journal
Record this from your perspective. What did you learn? How do you feel?
```

## What AI Players Do in Journal Mode

1. Read their journal prompt from `tmp/{character}-journal-prompt.md`
2. Read their existing journal from `party/{character}-journal.md`
3. Append a new entry to their journal
4. Done (no response file needed)

## Journal Entry Format

AI players append entries like:

```markdown
---

### [Scene/Event Title]

- What happened: [Brief summary]
- What I did: [My actions]
- What I learned: [New information]
- How I feel: [Emotional response]
- Notes: [Observations about party members, NPCs, or situation]
```

Keep entries brief (3-6 bullet points). Journals are for the character's future self.

## Example: Journal Prompt

**GM writes `tmp/tilda-journal-prompt.md`:**
```markdown
---
mode: journal
---

## Scene Before
You were in the merchant's shop. Aldric had accused the merchant of selling cursed goods.

## Your Action
You put your hand on your sword and said "Easy there, merchant. Hands where we can see them."

## What Happened
The merchant slowly raised his hands, revealing a small crossbow he'd been reaching for. "Just protection," he stammered. Aldric confiscated the weapon. Under pressure, the merchant admitted he'd been buying goods from smugglers operating out of the old warehouse district. He didn't know they were cursed - he thought he was just getting cheap inventory.

## Update Your Journal
Record this from your perspective.
```

**Tilda's journal updated with:**
```markdown
---

### The Merchant's Confession

- What happened: Confronted a merchant selling cursed goods in his shop
- What I did: Drew on him when he reached under the counter - turned out to be a crossbow
- What I learned: He's been buying from smugglers in the old warehouse district. Claims ignorance about the curses.
- How I feel: Don't fully trust his "I didn't know" story. But he folded fast - probably just greedy, not evil.
- Notes: Aldric was right to push. The warehouse district lead is solid.
```

## Parallel Journaling

Like action mode, journal updates happen in parallel:

```
[JOURNAL_UPDATE: corwin, tilda, grimjaw, seraphine]
```

Spawn all four ai-player agents simultaneously in journal mode. They each update their own journal file.

## When GM Signals Journal Updates

The GM should signal journal updates at natural story beats:

- End of combat
- End of significant scene
- Major discovery or revelation
- Before/after rests
- Session save points

Not every minor interaction needs journaling - just meaningful moments.
