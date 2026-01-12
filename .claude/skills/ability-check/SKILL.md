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
- Ally is helping (Help action)
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

## Saving Throws

Saves are reactions to threats (spells, traps, effects) - the character isn't actively trying, they're reacting.

**Spell Save DC** = 8 + proficiency bonus + spellcasting ability modifier

**Monster abilities** use the DC specified in their stat block.

**Character proficiencies**: Each class grants proficiency in 2 saving throws.

**Format**: Roll 1d20 + ability modifier + proficiency bonus (if proficient)

## Tool Proficiency Checks

When using tools, the relevant ability depends on the task:

- **Thieves' Tools**: DEX to pick locks, disable traps
- **Herbalism Kit**: INT/WIS for identifying plants, crafting potions
- **Musical Instruments**: CHA to perform, entertain
- **Smith's/Carpenter's/Other Artisan Tools**: Follow similar patterns based on the task

Proficiency with a tool lets you add your proficiency bonus to checks using it.

## Inspiration

Characters can hold Inspiration (maximum 1 at a time).

**Spending**: Use Inspiration to gain advantage on one attack roll, ability check, or saving throw.

**Awarding**: Grant Inspiration for great roleplay, clever solutions, or embracing character flaws.

## Cover (Theater of Mind)

| Cover Type | Benefit |
|------------|---------|
| Half cover | +2 AC and DEX saves |
| Three-quarters cover | +5 AC and DEX saves |
| Total cover | Can't be targeted directly |

## Common Conditions

| Condition | Effect |
|-----------|--------|
| Blinded | Can't see, auto-fail sight checks, attacks have disadvantage, attacks against have advantage |
| Charmed | Can't attack charmer, charmer has advantage on social checks |
| Deafened | Can't hear, auto-fail hearing checks |
| Frightened | Disadvantage on checks/attacks while source visible, can't willingly move closer |
| Grappled | Speed 0, ends if grappler incapacitated or knocked away |
| Incapacitated | Can't take actions or reactions |
| Invisible | Impossible to see, attacks have advantage, attacks against have disadvantage |
| Paralyzed | Incapacitated, auto-fail STR/DEX saves, attacks have advantage, hits within 5ft are crits |
| Petrified | Turned to stone, incapacitated, unaware, attacks have advantage, immune to poison/disease |
| Poisoned | Disadvantage on attack rolls and ability checks |
| Prone | Disadvantage on attacks, attacks within 5ft have advantage, ranged attacks have disadvantage |
| Restrained | Speed 0, attacks have disadvantage, attacks against have advantage, DEX saves disadvantage |
| Stunned | Incapacitated, auto-fail STR/DEX saves, attacks have advantage |
| Unconscious | Incapacitated, prone, auto-fail STR/DEX saves, attacks have advantage, hits within 5ft are crits |
