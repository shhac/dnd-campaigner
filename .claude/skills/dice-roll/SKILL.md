---
name: dice-roll
description: Roll dice for D&D mechanics using the toss CLI. Use for attack rolls, damage, ability checks, saving throws, and stat generation.
---

# Dice Roll Skill

Use this skill when rolling dice for D&D mechanics using the `toss` CLI.

## When to Use

- Attack rolls
- Damage rolls
- Ability checks
- Saving throws
- Random tables
- Stat generation

## How to Roll

Use the `toss` CLI via Bash. Common patterns:

### Basic Rolls
```bash
toss 1d20           # Standard d20
toss 1d20+5         # d20 with modifier
toss 2d6+3          # Multiple dice with modifier
```

### Advantage/Disadvantage
```bash
# Roll twice, report both, player/GM picks
toss 1d20 1d20      # Outputs two results
```
For advantage: take the higher result.
For disadvantage: take the lower result.

### Keep Highest/Lowest
```bash
toss 4d6k3          # Roll 4d6, keep highest 3 (stat generation)
toss 2d20kh1        # Keep highest 1 of 2d20 (advantage shorthand)
toss 2d20kl1        # Keep lowest 1 of 2d20 (disadvantage shorthand)
```

### Damage Rolls
```bash
toss 1d8+3          # Longsword + STR
toss 2d6+2          # Greatsword + STR
toss 8d6            # Fireball
```

### Healing Rolls
```bash
toss 1d8+3          # Cure Wounds (1st level)
toss 2d8+3          # Cure Wounds at 2nd level
toss 2d6            # Healing Word
```

### Multi-Creature Initiative
```bash
toss 1d20+2 1d20+2 1d20+2   # Initiative for 3 goblins (DEX +2)
```

### Critical Hits
Double the dice, not the modifier:
```bash
toss 2d8+3          # Critical longsword (normally 1d8+3)
```

### Stat Generation (4d6 drop lowest)
```bash
toss 4d6k3 4d6k3 4d6k3 4d6k3 4d6k3 4d6k3
```

## Output Format

Always report:
1. What the roll is for
2. The dice expression
3. The result
4. The total with modifiers

Example narration:
> **Attack Roll** (longsword): 1d20+5 = [14]+5 = **19**
> **Damage**: 1d8+3 = [6]+3 = **9 slashing damage**

## toss Reference

Full notation supported:
- `NdS` - N dice with S sides
- `k`, `kh<N>` - Keep highest N
- `kl<N>` - Keep lowest N
- `d`, `dl<N>` - Drop lowest N
- `!` - Explode on max
- `r`, `r<N>` - Reroll (default 1s)
- `+`, `-`, `*`, `/` - Arithmetic

## Troubleshooting

If `toss` is not installed, you'll see "command not found". Install with:
```bash
brew tap shhac/tap && brew install toss
```

## Related Skills

- **ability-check**: DC tables and check interpretation
- **combat-orchestration**: Combat turn structure using dice rolls
