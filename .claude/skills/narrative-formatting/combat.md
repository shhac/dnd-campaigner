# Combat Scene Formatting

Format guide for initiative-based combat encounters.

## Markdown Conventions

- **Bold** character names: `**Kira**`, `**Theron**`, `**Dire Rat**`
- *Italic* for action descriptions: `*The arrow punches clean through the rat.*`
- `Inline code` for all dice roll results
- Keep Unicode symbols (⚔, ☠, ❤, ⚄) as visual markers

## Combat Header

Start every combat with a header announcing the encounter:

```
═══════════════════
⚔ COMBAT: [Encounter Name]
═══════════════════
```

## Initiative Order

Display initiative immediately after the header:

```
**Initiative Order:**
1. **Kira** (18)
2. **Cultist Leader** (15)
3. **Theron** (12)
4. **Cultist** x2 (8)
5. **Lyra** (6)
```

## Turn Structure

Each turn follows this pattern:

```
─── **CHARACTER NAME**'s Turn ───

→ *[Character action description]*

⚄ [Roll]: `[dice]+[mod] = [result]+[mod] = [total]`

★ *[Result narration]*
```

## Attack Rolls

```
⚄ Attack (Longsword): `1d20+5 = [13]+5 = 18 vs AC 14 → HIT`

⚄ Damage: `1d8+3 = [6]+3 = 9 slashing`
```

## Miss Results

```
⚄ Attack (Crossbow): `1d20+4 = [7]+4 = 11 vs AC 15 → MISS`

★ *The bolt sails wide, clattering off the stone wall behind the orc.*
```

## Critical Hits

```
⚄ Attack (Dagger): `1d20+6 = [20]+6 = 26 → CRITICAL HIT!`

⚄ Damage: `2d4+4 = [3]+[4]+4 = 11 piercing`
```

## Status Effects

Mark ongoing conditions clearly:

```
★ *The ghoul's claws rake across **Theron**'s arm.*

⚄ Constitution Save: `1d20+2 = [8]+2 = 10 vs DC 13 → FAIL`

☠ **Theron** is **PARALYZED** *(can repeat save at end of each turn)*
```

## Death and Dying

```
☠ **Lyra** drops to 0 HP — *she's **UNCONSCIOUS** and making death saves!*

⚄ Death Save: `1d20 = [14] → SUCCESS (1/3)`
```

## Enemy Defeat

```
★ *Your blade finds the gap in the cultist's guard. He crumples
with a wet gasp, dark blood pooling beneath him.*

☠ **Cultist Leader** defeated
```

## Healing in Combat

```
→ ***Theron*** *channels divine energy into **Lyra**'s wounds.*

⚄ Cure Wounds: `1d8+3 = [5]+3 = 8 HP restored`

❤ **Lyra** regains 8 HP (now at 12/28)
```

## End of Round

```
─── End of Round 2 ───

**Status:**
• **Kira**: 24/24 HP
• **Theron**: 18/22 HP
• **Lyra**: 12/28 HP
• **Enemies**: 1 cultist remaining *(bloodied)*
```

## Combat End

```
═══════════════════
⚔ COMBAT COMPLETE
═══════════════════

★ *The last cultist falls. Silence returns to the chamber, broken
only by your ragged breathing and the distant drip of water.*

**Aftermath:**
• XP earned: 450 (150 each)
• Loot: 23 gp, **rusty ceremonial dagger**, **torn ritual notes**
```

## Full Example: Combat Round

```
═══════════════════
⚔ COMBAT: Sewer Ambush
═══════════════════

**Initiative Order:**
1. **Kira** (18)
2. **Dire Rat** x3 (14)
3. **Theron** (11)

─── **KIRA**'s Turn ───

→ ***Kira*** *looses an arrow at the nearest rat as it scrabbles toward her.*

⚄ Attack (Shortbow): `1d20+5 = [16]+5 = 21 vs AC 12 → HIT`

⚄ Damage: `1d6+3 = [4]+3 = 7 piercing`

★ *The arrow punches clean through the rat. It squeals once and
goes still, pinned to the muck.*

☠ **Dire Rat #1** defeated

─── **DIRE RATS**' Turn ───

★ *The remaining two rats surge forward, yellow teeth bared.*

→ ***Dire Rat #2*** *lunges at **Kira**'s ankle.*

⚄ Attack (Bite): `1d20+4 = [8]+4 = 12 vs AC 15 → MISS`

★ ***Kira*** *sidesteps, the rat's jaws snapping on empty air.*

→ ***Dire Rat #3*** *leaps at **Theron**.*

⚄ Attack (Bite): `1d20+4 = [17]+4 = 21 vs AC 16 → HIT`

⚄ Damage: `1d4+2 = [3]+2 = 5 piercing`

★ *The rat sinks its teeth into **Theron**'s calf. He grunts in pain.*

─── **THERON**'s Turn ───

→ ***Theron*** *brings his mace down on the rat latched to his leg.*

⚄ Attack (Mace): `1d20+4 = [11]+4 = 15 vs AC 12 → HIT`

⚄ Damage: `1d6+2 = [5]+2 = 7 bludgeoning`

★ *The mace crushes the rat with a sickening crunch.*

☠ **Dire Rat #3** defeated

─── End of Round 1 ───

**Status:**
• **Kira**: 18/18 HP
• **Theron**: 17/22 HP
• **Enemies**: 1 dire rat remaining
```
