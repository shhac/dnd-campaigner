# Initiative and Turn Order

Setting up and tracking combat initiative.

## Pre-Combat Setup

Before rolling initiative, establish the battlefield state:

1. **Active Concentration Spells** - List any ongoing concentration spells:
   ```
   **Concentration Active:**
   - Seraphine: Bless (Grimjaw, Tilda, self)
   - Enemy Druid: Entangle (zone near door)
   ```

2. **Conditions** - Note any pre-existing conditions on combatants

3. **Positions** - Briefly describe relative positions in theater-of-mind terms

If no concentration spells are active, note: "No active concentration"

## Rolling Initiative

Roll `toss 1d20+{DEX mod}` for each combatant.

**Group similar enemies:**
- All goblins act on one initiative
- Named enemies get individual rolls

**Example:**
```
Initiative:
- Grimjaw: 18 (1d20+2)
- Bandit Leader: 15 (1d20+1)
- Tilda: 14 (1d20+4)
- Bandits (x3): 12 (1d20+1)
- Corwin: 8 (1d20+0)
```

## Turn Order Display

Present clearly at combat start:

```
**Initiative Order:**
1. Grimjaw (18)
2. Bandit Leader (15)
3. Tilda (14)
4. Bandits x3 (12)
5. Corwin (8)
```

## Tracking Current Turn

Mark whose turn it is:

```
**Round 2:**
1. Grimjaw ✓
2. Bandit Leader ✓
3. → Tilda (current)
4. Bandits x3
5. Corwin
```

## Delaying and Readying

**Delay:** Character can move lower in initiative order. They stay at new position.

**Ready:** Character sets trigger condition. Uses reaction when triggered.

```
Tilda readies: "I attack the first enemy who approaches Corwin"
(Uses reaction when triggered)
```

## Surprise

If one side is surprised:
- Surprised creatures can't take actions or reactions in round 1
- They act normally from round 2

```
**Round 1 (Bandits Surprised):**
1. Grimjaw - acts
2. Tilda - acts
3. Bandit Leader - surprised, no action
4. Bandits - surprised, no action
5. Corwin - acts
```

## Joining Combat

When new combatants enter:
1. Roll their initiative
2. Insert into existing order
3. They act on their initiative count starting next round

## Combat AI Player Prompts

For AI player turns, write prompt with combat context:

```markdown
---
request_type: COMBAT_ACTION
---

## Combat Situation
Round 2 of fight against bandits in warehouse.

## Battlefield
- Bandit Leader: Wounded, engaged with Grimjaw
- Bandit Archer: Fresh, on raised platform 30ft away
- Bandit Thug: Near door, blocking exit

## Concentration Active
- Corwin: Bless (you, Grimjaw, self)

## Party Status
- Grimjaw: 28/35 HP, engaged with Leader
- Corwin: Full HP, concentrating on Bless
- You: Full HP, in shadows near Archer

## Your Turn
Declare your action. Quick decision or [VETO] for tactical choice.
```

Always include concentration status in combat prompts so AI players know:
- Which allies are concentrating (avoid breaking their line of sight/effect)
- What buffs/debuffs are active from concentration spells
