# Death and Dying

Handling characters at 0 HP and death saves.

## Death Save Mechanics

When a character drops to 0 HP:
1. Fall unconscious
2. Start making death saves at start of each turn

### Rolling Death Saves

Roll `toss 1d20`:

| Roll | Result |
|------|--------|
| 10+ | Success |
| 1-9 | Failure |
| Natural 20 | Regain 1 HP, regain consciousness |
| Natural 1 | TWO failures |

### Resolution

- **3 Successes:** Stabilized (unconscious but not dying)
- **3 Failures:** Character dies

### Damage While Dying

- Taking damage at 0 HP = automatic failure
- Critical hit = 2 failures

## AI Character Death Saves

For AI party members:

1. **GM rolls death saves** and narrates tension
2. **Invoke AI briefly** for internal experience

**Prompt:**
```markdown
---
request_type: QUICK_REACTION
---

## Situation
You're dying. Two failures already. The battle rages around you.

## Request
What flashes through your mind? Brief internal moment.
```

**Build drama:**
> Tilda's breathing is shallow. That's two failures.
> *[Tilda's response: "Faces swim past—mother, the captain, the party..."]*
> One more and she's gone. Seraphine, it's your turn.

## On Character Death

When a character dies:

### Narrative Weight

Give the death a moment. Don't rush past it.

**Invoke surviving AI players:**
```markdown
---
request_type: QUICK_REACTION
---

## What Just Happened
Grimjaw just died. The orc's axe found his heart.

## Request
Your immediate reaction. This is not a veto situation—quick, raw response.
```

### Practical Options

1. **Resurrection** - If party has access (Revivify within 1 minute, Raise Dead within 10 days)
2. **Quest for revival** - Find powerful cleric, rare component, divine bargain
3. **New character** - Help create replacement PC
4. **Retire campaign** - If it feels right narratively (rare)

### AI Character Death

Treat with same weight as human character death:
- Create memorial moment
- Let party react
- Human may want replacement or smaller party

## Party Wipe Scenarios

If entire party falls:

### Before Declaring TPK

Consider:
- Did enemies want prisoners? (wake up captured)
- Would anyone intervene? (allied NPC, deity, mysterious stranger)
- Is there a narrative "out"? (dream sequence, time magic, divine intervention)

### If Death Is Appropriate

- Narrate the ending with weight and meaning
- Discuss with player: epilogue, restart, new campaign?
- This can be powerful if handled well

## Stabilization

**Medicine check (DC 10):** Stabilizes dying character

**Spare the Dying cantrip:** Automatically stabilizes

**Any healing:** Brings character to consciousness with healed HP

## Tracking Death Saves

Keep clear record:

```
**Grimjaw - Dying**
Successes: ⚪⚪⚪
Failures:  ⬛⬛⚪

Round 3: Rolled 14 - Success!
Successes: ⚪⚪⬛
Failures:  ⬛⬛⚪
```
