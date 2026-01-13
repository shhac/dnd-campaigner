---
name: combat-orchestration
description: Manages theater-of-mind D&D combat with threat assessment and pacing tiers. Use when running combat encounters. Covers initiative, turn structure, AI player coordination, and narrative flow.
---

# Combat Orchestration

Theater-of-mind combat system focusing on narrative flow over tactical positioning.

## Threat Assessment

Before rolling initiative, determine the encounter tier:

| Tier | Description | Example |
|------|-------------|---------|
| **Trivial** | Party significantly outmatches foes | 4 goblins vs level 5 party |
| **Standard** | Meaningful encounter with real stakes | Equal-CR encounter |
| **Critical** | Boss fights, potential character death | BBEG, deadly encounters |

The tier determines pacing strategy.

## Pacing by Tier

### Trivial Combat

Offer quick resolution:
> "This looks like a quick fight. Play it out or resolve quickly?"

**If quick resolution:**
1. Narrate highlights cinematically
2. Roll a few dice for flavor
3. Apply minor resource cost (HP, maybe a spell slot)
4. Move on

### Standard Combat

Use quick-or-veto per round:
1. Resolve enemy actions
2. Request AI player actions (parallel, quick reaction)
3. Handle any vetoes with full context
4. Human player turn (full spotlight)
5. Narrate round as cohesive scene

### Critical Combat

Full engagement:
- Expect more vetoes, honor them
- Give each character spotlight moments
- Narrate dramatically between turns
- Every decision matters

## Turn Structure

Each turn:
1. Describe situation from character's perspective
2. Character declares action
3. Resolve with appropriate rolls
4. Narrate outcome vividly

**Track:** HP, conditions, positions (conceptual), concentration spells

## AI Player Combat Flow

Write prompts for ALL AI players, signal once:

```
[AWAIT_AI_PLAYERS: grimjaw, tilda, seraphine]
```

They respond in parallel. Batch their actions in narrative.

## Detailed Procedures

- For initiative and turn order, see [initiative.md](initiative.md)
- For batching AI actions in narrative, see [narration.md](narration.md)
- For death and dying, see [death-saves.md](death-saves.md)
