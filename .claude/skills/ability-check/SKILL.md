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

## Common Checks by Ability

### Strength
- **Athletics**: Climbing, jumping, swimming, grappling, shoving

### Dexterity
- **Acrobatics**: Balance, tumbling, escaping grapples
- **Sleight of Hand**: Pickpocketing, hiding objects, trickery
- **Stealth**: Moving unseen/unheard

### Constitution
- Raw checks: Holding breath, forced march, resisting poison without save

### Intelligence
- **Arcana**: Magic knowledge, identify spells
- **History**: Historical knowledge
- **Investigation**: Deduction, searching for clues, finding traps
- **Nature**: Natural world knowledge, tracking
- **Religion**: Religious knowledge, undead, divine matters

### Wisdom
- **Animal Handling**: Calm, control, or read animals
- **Insight**: Detect lies, read intentions
- **Medicine**: Stabilize dying, diagnose illness
- **Perception**: Notice things, spot hidden creatures
- **Survival**: Track, forage, navigate wilderness

### Charisma
- **Deception**: Lie convincingly
- **Intimidation**: Threaten, coerce
- **Performance**: Entertain, act, play music
- **Persuasion**: Convince, negotiate, charm

## Advantage & Disadvantage

**Advantage** (roll twice, take higher):
- Circumstances favor the character
- Ally is helping
- Clever use of environment/abilities

**Disadvantage** (roll twice, take lower):
- Circumstances hinder
- Distracted, injured, rushed
- Unfavorable conditions

They cancel out (any number of each = normal roll).

## Contested Checks

When opposing another creature:
1. Both roll appropriate checks
2. Higher result wins
3. Ties favor the one being acted upon (defender wins ties)

Examples:
- Grapple: Athletics vs Athletics/Acrobatics
- Stealth vs Perception
- Deception vs Insight

## Passive Checks

For ongoing awareness: 10 + all modifiers

Example: Passive Perception = 10 + WIS mod + proficiency (if proficient)

## Group Checks

When the whole party attempts something:
1. Everyone rolls
2. If half or more succeed, the group succeeds

Use for: Stealth as a group, navigating together

## Degrees of Success (Optional)

For more nuanced outcomes:
- **Beat DC by 5+**: Exceptional success
- **Meet DC**: Standard success
- **Miss by 1-4**: Partial success or success with cost
- **Miss by 5+**: Clear failure
- **Nat 1**: Possible complication
- **Nat 20**: Possible bonus

## Rolling

Use the dice-roll skill:
```bash
toss 1d20+{modifier}
```

Report format:
> **{Skill} Check** (DC {DC}): 1d20+{mod} = [{roll}]+{mod} = **{total}** - {Success/Failure}
