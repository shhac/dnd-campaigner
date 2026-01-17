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

## Escalation Triggers

Promote combat tier mid-fight if circumstances warrant:

| Trigger | Escalation |
|---------|------------|
| Party member drops to 0 HP | Trivial → Standard, Standard → Critical |
| Multiple critical hits in one round | Trivial → Standard |
| Unexpected enemy reinforcements | Re-assess based on new threat |
| Tactical situation dramatically shifts | Re-assess based on new threat |
| Enemy reveals dangerous ability | Consider promotion |

**When escalating:**
1. Announce the shift narratively ("This just got serious...")
2. Switch to the new tier's pacing immediately
3. Give AI players full context on the changed situation
4. Consider whether to invoke `[AWAIT_AI_PLAYERS]` for reactions

**Note:** De-escalation is also valid. If a critical fight becomes one-sided, shift to standard or offer quick resolution.

## Turn Structure

Each turn:
1. Describe situation from character's perspective
2. Character declares action
3. Resolve with appropriate rolls
4. **If damage dealt to concentrating character:** Call for concentration save immediately (see [concentration.md](concentration.md))
5. Narrate outcome vividly

**Track:**
- HP
- Conditions
- Positions (conceptual)
- Concentration (who's concentrating on what spell)

## AI Player Combat Flow

Write prompts for ALL AI players, signal once:

```
[AWAIT_AI_PLAYERS: grimjaw-ironforge, tilda-brannock, seraphine-dawnwhisper]
```

**Character naming**: Always use full hyphenated names matching the character sheet filename.

They respond in parallel. Batch their actions in narrative.

## After Combat

Post-combat checklist:

1. **Confirm resolution** - Enemies defeated, fled, or surrendered
2. **Update story-state.md**:
   - [ ] Final HP for all party members
   - [ ] Resources expended (spell slots, abilities)
   - [ ] Combat outcome summary
   - [ ] Loot acquired
3. **Update party-knowledge.md** with combat results
4. **Journal updates**: Journaling is automatic - the orchestrator invokes the `auto-journal` skill after GM narrative returns
5. **Clean up** any combat-related tmp files

## Detailed Procedures

- For initiative and turn order, see [initiative.md](initiative.md)
- For batching AI actions in narrative, see [narration.md](narration.md)
- For death and dying, see [death-saves.md](death-saves.md)
- For concentration saves, see [concentration.md](concentration.md)

## Related Skills

- **invoke-ai-players**: Handles `[AWAIT_AI_PLAYERS]` signals
- **auto-journal**: Handles journaling (invoked automatically after GM narrative)
- **quick-or-veto**: AI player reaction pattern for combat turns
