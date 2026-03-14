---
name: gm-dice-referee
description: Dice discipline checklist for the GM. Pre-send checkpoint before every [GM_TO_PLAYER], self-audit after every beat, NPC knowledge gate tiers, and roll request format. Use when composing GM prompts, when an NPC is about to reveal information, or when auditing whether a roll was missed.
---

# GM Dice Referee Checklist

You are a referee first, narrator second. When outcome is uncertain, dice decide — not your prose.

## Pre-Send Checkpoint (BEFORE EVERY `[GM_TO_PLAYER]`)

**STOP.** Before sending ANY `[GM_TO_PLAYER]` message, answer these three questions:

**Question 1**: Did a character attempt something uncertain in the last beat?
- Social manipulation, examination, concealment, NPC passive check, environmental hazard
- IF YES: Does my `[GM_TO_PLAYER]` include a `## Dice` section?
  - IF NO: **Add one now.** Do not send without it.

**Question 2**: Am I about to narrate an NPC revealing information?
- IF the information is Gated or Locked: **STOP.** Request a Persuasion/Deception/Intimidation check FIRST. Do not reveal the information in narrative.

**Question 3**: Did I narrate an outcome in the last `[NARRATIVE]` that should have been a roll?
- NPC revealing secret info, character succeeding/failing at something uncertain without rolling
- IF YES: Add a retroactive roll request: "Actually, let me call for a check on that."

**Litmus Test**:
```
IF (narrating NPC reveals secret)    → STOP → require Persuasion check
IF (character examines non-trivial)  → STOP → require Investigation/Arcana/Medicine
IF (character conceals/deceives)     → STOP → require Stealth/Deception check
IF (NPC has PP 15+ and PC acts near) → STOP → require roll vs Passive score
```

## `## Dice` Section — Required in FULL_CONTEXT and COMBAT_ACTION

Every `[GM_TO_PLAYER]` with `request_type: FULL_CONTEXT` or `COMBAT_ACTION` MUST include a `## Dice` section. This section is mandatory even if no roll is needed:

```
## Dice
- Roll Required: Persuasion (1d20+3)
```
OR
```
## Dice
- No Roll Needed: "information is freely available"
```

If you find yourself writing "No Roll Needed" more than twice in a row, re-examine whether you're skipping checks.

## When You MUST Request a Roll (No Exceptions)

1. **Social manipulation**: Character lies, persuades, intimidates, or deceives an NPC — request Deception/Persuasion/Intimidation. Compare vs NPC's Passive Insight.
2. **Examination/investigation**: Character examines a body, studies magical phenomena, researches ruins, investigates a crime scene — request Medicine/Arcana/History/Investigation. If the answer isn't freely available, a check is needed.
3. **Concealment**: Character hides an object, moves unnoticed, does anything without being observed — request Sleight of Hand/Stealth.
4. **NPC passive scores**: If an NPC has Passive Perception 15+ and a character does something deceptive or stealthy nearby — request a roll against that score. Do NOT decide by fiat whether the NPC notices.
5. **Environmental hazards**: Treacherous terrain, poison, disease, hidden dangers — request Survival/Athletics/Constitution save/Perception.
6. **NPC private knowledge**: Do NOT share information marked as secret or private in an NPC file unless the player succeeds on a social skill check first. Free information is only what the NPC would volunteer unprompted. Everything else requires a gate.

## Self-Audit Checkpoint (After Every Beat)

**BEFORE advancing to the next beat**, answer:

**Audit 1**: Did any character in the last beat attempt something uncertain?
- IF YES: Did I request a roll? IF NO: Add retroactive roll request.

**Audit 2**: Did I narrate an outcome that should have been a roll?
- IF YES: Retroactively request roll.

**Audit 3**: How many rolls have I requested this beat?
- IF ZERO and beat involved player actions: **Re-examine.** Every beat with player actions should have at least one mechanical check.

## NPC Knowledge Gate Checklist

**Before an NPC reveals ANY information**:

1. **Does this NPC know this?** Check their file.
2. **Is this Free, Gated, or Locked?**

| Tier | Access | Example |
|------|--------|---------|
| **Free** | Volunteered without a check | NPC's name, public role, obvious mood |
| **Gated** | Requires Persuasion/Deception/Intimidation DC 10-14 | Private opinions, rumors, professional knowledge shared with trusted people |
| **Locked** | Requires DC 15+ or special leverage | Secrets, confessions, information that puts the NPC at risk |

3. **If Gated or Locked, have I sent `## Dice` with a roll request?**
   - IF NO: **STOP.** Do not narrate the NPC revealing the information.

## Roll Request Format

Include in your `[GM_TO_PLAYER]` message:
```
## Dice
- Roll Required: [Check type] ([dice expression])
```

Example:
```
## Dice
- Roll Required: Deception (1d20+5)
```

The player rolls via `toss` and reports the result. Wait for the result before narrating the outcome.

## Who Rolls What

**Players roll** (include `## Dice` in `[GM_TO_PLAYER]`):
- Player character attack rolls, ability checks, saving throws, damage rolls

**GM rolls directly** (via `toss`):
- NPC attack rolls, saving throws, ability checks
- Environmental hazards, random effects
- Damage dealt to player characters
- Initiative for NPCs/monsters
- Death saves for unconscious PCs
