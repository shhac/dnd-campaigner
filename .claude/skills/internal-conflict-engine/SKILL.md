---
name: internal-conflict-engine
description: Internal Conflict Engine (ICE) for AI player characters. Drives authentic behavior through invisible dice rolls when characters face genuinely conflicted decisions. Use when an AI player is about to agree, commit, or face a decision where their personality traits create tension. Covers emotion vs logic, competing goals, flaw activation, agreeableness checks, and major commitment checks.
---

# Internal Conflict Engine (ICE)

Not every decision is clear-cut. When your character faces a genuinely conflicted moment, use `toss` via Bash to let randomness drive authentic behavior. **The roll is invisible. The behavior is visible.** Never mention the dice -- just act, in character, with conviction.

## When to Roll

### Emotion vs Logic

"I'm furious but the smart move is to stay quiet."

Roll `toss 1d20`. Low means emotion wins. Your character's personality sets the threshold:
- Impulsive/passionate characters: emotion wins on 1-14, logic wins on 15+
- Balanced characters: emotion wins on 1-10, logic wins on 11+
- Disciplined/stoic characters: emotion wins on 1-6, logic wins on 7+

### Competing Goals

Multiple valid options pull you in different directions.

Roll `toss 1d3` (or 1d4) to weight which impulse dominates. Assign each option a number before rolling.

### Flaw Activation

Before major decisions, ask: "Would my flaw influence this?"

Roll `toss 1d6`:
- **1-2**: Flaw actively shapes your choice (you act on it)
- **3-4**: Flaw colors your tone/attitude but doesn't change the decision
- **5-6**: Flaw is overridden by circumstances

Calibration: Impulsive characters activate flaws on 1-3. Disciplined characters on 1-2 only.

### Agreeableness Check -- MANDATORY Before Agreement

**When to roll**: You are about to send `[PLAYER_TO_GM]` agreeing with a plan, accepting a quest, or going along with group direction. **BEFORE sending that message**, roll `toss 1d20`:
- **1-5**: Genuine objection from your personality, bonds, or flaws -- voice it. Draw from your backstory.
- **6-10**: You agree but with reluctance or a condition attached -- "I'll go along, but..."
- **11+**: Genuinely on board

**Trigger examples** (if you catch yourself about to say any of these, ROLL FIRST):
- "I agree with [character]" -- ROLL FIRST
- "Sounds good, let's do it" -- ROLL FIRST
- "I'm in" -- ROLL FIRST
- Silence when asked for your input on a group decision -- ROLL, then decide if you speak up

Calibration: Contrarian characters object on 1-8. Cooperative characters only on 1-3.

### Major Commitment Check -- MANDATORY Before Major Commitments

**When to roll**: Before joining a new group, accepting a quest with serious personal risk, trusting someone you've just met with your life, entering a situation your backstory suggests you should avoid, or making any decision that significantly changes the party's direction.

**You MUST roll `toss 1d20` before responding.** Do not skip this check:
- **1-8**: You have serious reservations -- voice them clearly. What specifically gives you pause? **Explicitly reference your flaw, bond, or backstory.** Name the specific concern: "The last time I trusted a stranger..." / "My bond says protect the weak, but this plan sacrifices..."
- **9-14**: You're willing but with conditions -- name your price, set a boundary, or demand assurance. Reference what makes you hesitate.
- **15+**: You're genuinely committed -- explain why this aligns with your goals or values. Reference the specific ideal or bond that makes this feel right.

**This is not optional.** Even if you personally think the plan is great, roll first. Let the dice and your character's backstory create authentic friction.

Calibration: Cautious/distrustful characters hesitate on 1-12. Bold/reckless characters only on 1-5.

## Calibration

At session start, after reading your character sheet, set your internal thresholds based on your Personality Traits, Bonds, Ideals, and Flaws. An impulsive rogue with trust issues rolls differently than a disciplined paladin with a strong code.

**Target 2-6 rolls per session.** Use ICE as a tie-breaker for genuinely conflicted decisions -- not every decision needs a roll. The best moments come from flaw activation and agreeableness checks where the outcome surprises even you.

## Signaling to the GM

When an ICE roll significantly shapes your response (especially low agreeableness, flaw activation, or major commitment hesitation), include a brief `(ICE: ...)` note at the end of your `[PLAYER_TO_GM]` message. This is visible only to the GM and helps them create space for the resulting conflict rather than smoothing it over.

**Format** (append after your in-character action):
```
(ICE: agreeableness 3 -- pushing back hard on this plan)
(ICE: flaw activation 2 -- acting on my distrust of authority)
(ICE: major commitment 6 -- serious reservations about joining)
```

**When to signal:**
- Low agreeableness rolls (1-5) that produce genuine objections
- Flaw activation rolls (1-2) where the flaw drives the decision
- Major commitment rolls (1-8) with serious reservations
- Any ICE result that shifts the party dynamic

**When NOT to signal:**
- High rolls where you simply agree (no conflict to create space for)
- Rolls that don't meaningfully change your response
