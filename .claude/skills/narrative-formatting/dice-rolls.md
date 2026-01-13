# Dice Roll Formatting

Format guide for all mechanical roll results.

## Markdown Conventions

- **Bold** character names: `**Kira**`, `**Theron**`
- **Bold** outcomes: `**SUCCESS**`, `**FAIL**`, `**HIT**`, `**MISS**`
- *Italic* for narrative consequences: `*The arrow catches the cultist in the shoulder.*`
- `Inline code` for ALL dice roll results and formulas
- Keep Unicode symbols (⚄, ☠, ❤) as visual markers

## Standard Format

All rolls follow this pattern:

```
⚄ [Type]: `[dice]+[mod] = [result]+[mod] = [total] vs DC [dc] → [OUTCOME]`
```

## Ability Checks

### With DC (GM knows the target)

```
⚄ Perception: `1d20+4 = [13]+4 = 17 vs DC 15 → SUCCESS`
⚄ Athletics: `1d20+2 = [6]+2 = 8 vs DC 12 → FAIL`
```

### Without DC (player-facing, GM decides)

```
⚄ Insight: `1d20+3 = [14]+3 = 17`
```

### Skill Variants

```
⚄ Stealth: `1d20+5 = [18]+5 = 23 vs DC 14 → SUCCESS`
⚄ Persuasion: `1d20+2 = [4]+2 = 6 vs DC 15 → FAIL`
⚄ Investigation: `1d20+4 = [11]+4 = 15 vs DC 12 → SUCCESS`
⚄ Arcana: `1d20+6 = [19]+6 = 25 vs DC 20 → SUCCESS`
```

## Attack Rolls

### Standard Attack

```
⚄ Attack (Longsword): `1d20+5 = [14]+5 = 19 vs AC 15 → HIT`
```

### Miss

```
⚄ Attack (Shortbow): `1d20+4 = [6]+4 = 10 vs AC 14 → MISS`
```

### Critical Hit (Natural 20)

```
⚄ Attack (Dagger): `1d20+6 = [20]+6 = 26 → CRITICAL HIT!`
```

### Critical Miss (Natural 1)

```
⚄ Attack (Greataxe): `1d20+4 = [1]+4 = 5 → CRITICAL MISS!`
```

### Ranged Attack

```
⚄ Attack (Longbow, 60ft): `1d20+5 = [16]+5 = 21 vs AC 13 → HIT`
```

### Spell Attack

```
⚄ Spell Attack (Fire Bolt): `1d20+6 = [12]+6 = 18 vs AC 12 → HIT`
```

## Damage Rolls

### Standard Damage

```
⚄ Damage: `1d8+3 = [5]+3 = 8 slashing`
```

### Critical Damage (doubled dice)

```
⚄ Damage (Critical): `2d8+3 = [6]+[4]+3 = 13 slashing`
```

### Multiple Dice Types

```
⚄ Damage: `2d6+1d4+4 = [5]+[3]+[2]+4 = 14 fire`
```

### Damage with Type

```
⚄ Damage: `1d10+4 = [7]+4 = 11 bludgeoning`
⚄ Damage: `2d6 = [4]+[5] = 9 necrotic`
⚄ Damage: `1d6+2 = [3]+2 = 5 piercing`
```

## Saving Throws

### Standard Save

```
⚄ Dexterity Save: `1d20+3 = [14]+3 = 17 vs DC 15 → SUCCESS`
⚄ Constitution Save: `1d20+2 = [7]+2 = 9 vs DC 13 → FAIL`
```

### Death Save

```
⚄ Death Save: `1d20 = [11] → SUCCESS (1/3)`
⚄ Death Save: `1d20 = [8] → FAIL (1/3)`
⚄ Death Save: `1d20 = [20] → CRITICAL SUCCESS!` *Regain 1 HP!*
⚄ Death Save: `1d20 = [1] → CRITICAL FAIL!` *(2 failures)*
```

## Contested Rolls

### Format

```
⚄ [Char A] [Skill]: `[roll]` vs [Char B] [Skill]: `[roll]` → **[WINNER]** wins
```

### Examples

```
⚄ **Kira** Stealth: `1d20+5 = [15]+5 = 20` vs **Guard** Perception: `1d20+2 = [11]+2 = 13` → **KIRA** wins

⚄ **Theron** Athletics: `1d20+4 = [8]+4 = 12` vs **Orc** Athletics: `1d20+3 = [14]+3 = 17` → **ORC** wins
```

## Advantage and Disadvantage

### Advantage (take higher)

```
⚄ Attack (Advantage): `1d20+5 = [8, 17]+5 = 22 vs AC 14 → HIT`
```

### Disadvantage (take lower)

```
⚄ Stealth (Disadvantage): `1d20+4 = [16, 5]+4 = 9 vs DC 12 → FAIL`
```

## Healing Rolls

```
⚄ Cure Wounds: `1d8+3 = [6]+3 = 9 HP restored`
⚄ Healing Word: `1d4+4 = [3]+4 = 7 HP restored`
⚄ Hit Dice (Short Rest): `1d10+2 = [7]+2 = 9 HP restored`
```

## Special Rolls

### Initiative

```
⚄ Initiative: `1d20+3 = [14]+3 = 17`
```

### Hit Dice Recovery

```
⚄ Hit Dice: `1d8+2 = [5]+2 = 7 HP recovered`
```

### Concentration Check

```
⚄ Concentration (Constitution): `1d20+3 = [12]+3 = 15 vs DC 10 → SUCCESS` *(spell maintained)*
```

## Full Example: Combat Round Mechanics

```
─── **KIRA**'s Turn ───

→ ***Kira*** *fires at the cultist from behind cover.*

⚄ Attack (Shortbow, Half Cover): `1d20+5 = [16]+5 = 21 vs AC 14 → HIT`

⚄ Damage: `1d6+3 = [4]+3 = 7 piercing`

★ *The arrow catches the cultist in the shoulder. He staggers
but stays upright, hissing in pain.*

→ *Bonus Action: **Kira** ducks behind the pillar.*

───

★ *The cultist chants a word of power, dark energy gathering
in his palm.*

⚄ Spell Attack (Inflict Wounds): `1d20+5 = [18]+5 = 23 vs AC 15 → HIT`

⚄ Damage: `3d10 = [7]+[4]+[9] = 20 necrotic`

★ *Necrotic energy surges through **Kira**. She screams as the
darkness tears at her life force.*

☠ **Kira** takes 20 necrotic damage (4/24 HP remaining)

───

─── **THERON**'s Turn ───

→ ***Theron*** *rushes to **Kira**'s side, invoking his god's mercy.*

⚄ Cure Wounds: `1d8+3 = [6]+3 = 9 HP restored`

❤ **Kira** regains 9 HP (13/24 HP)

→ ***Theron*** *interposes himself between **Kira** and the cultist,
shield raised.*
```
