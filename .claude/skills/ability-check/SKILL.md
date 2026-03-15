---
name: ability-check
description: Handle D&D ability checks, saving throws, and contested rolls. Use when determining outcomes of character actions with DC tables and advantage/disadvantage rules.
---

# Ability Check Skill

Use this skill when a character attempts something with an uncertain outcome.

## The Core Loop

1. **Player declares intent**: "I want to pick the lock"
2. **GM determines**: ability + skill, DC, any advantage/disadvantage
3. **Roll**: `toss 1d20+{modifier}`
4. **Interpret**: Compare to DC, narrate outcome

## Difficulty Classes (DC)

| Task Difficulty | DC |
|----------------|-----|
| Very Easy | 5 |
| Easy | 10 |
| Medium | 15 |
| Hard | 20 |
| Very Hard | 25 |
| Nearly Impossible | 30 |

## Advantage & Disadvantage

**Advantage** (roll twice, take higher):
- Circumstances favor the character
- Ally is helping (Help action)
- Clever use of environment/abilities

**Disadvantage** (roll twice, take lower):
- Circumstances hinder
- Distracted, injured, rushed
- Unfavorable conditions

They cancel out (any number of each = normal roll).

## Rolling

Use the dice-roll skill:
```bash
toss 1d20+{modifier}
```

Report format:
> **{Skill} Check** (DC {DC}): 1d20+{mod} = [{roll}]+{mod} = **{total}** - {Success/Failure}

## Detailed Reference

- For common checks by ability, contested/passive/group checks, and degrees of success, see [checks-reference.md](checks-reference.md)
- For saving throws, tool checks, inspiration, cover, and conditions, see [conditions-and-extras.md](conditions-and-extras.md)

## Related Skills

- **dice-roll**: Execute dice rolls with the `toss` CLI
