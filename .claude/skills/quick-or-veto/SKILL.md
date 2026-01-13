---
name: quick-or-veto
description: The quick-or-veto pattern for AI player reactions. Use when GM needs party input or when AI player is deciding whether to give a brief response or request full context. Balances pacing with player agency.
---

# Quick-or-Veto Pattern

Balances game pacing with AI player agency by allowing brief reactions or full engagement.

## How It Works

1. GM requests a quick reaction (1-2 sentences)
2. AI player either:
   - **Quick response**: Brief in-character reaction
   - **Veto**: Request full context for deeper engagement

## For GMs: When to Request Quick Reactions

### Always Check Party When

- Human player makes a major decision
- NPC says something provocative or plot-relevant
- Party reaches a decision point
- Something triggers a character's interrupt triggers
- Every 5-10 exchanges as a "pulse check"
- After major scene beats

### Quick Reaction Prompt Template

```markdown
---
request_type: QUICK_REACTION
---

## Scene
{1-2 sentence current situation}

## Just Happened
{What occurred that might prompt reaction}

## Request
Brief (1-2 sentence) reaction, or [VETO] if this touches your bonds/flaws/backstory.
```

## For AI Players: When to Veto

### Veto When

- Situation touches your bonds, flaws, or backstory significantly
- You have strong objections to what's happening
- Your character would genuinely have a lot to say
- Actual decision-making is required, not just reaction
- Your backstory NPC just appeared
- Party is about to violate your bond or ideal

### Do NOT Veto Just Because

- You want more screen time
- Situation is interesting but doesn't involve your character specifically
- You could theoretically have an opinion (everyone can)

### Veto Format

```markdown
[VETO - need more input]

{Brief reason - reference character sheet elements}
```

Then **STOP**. Do not include your full response after the veto tag.

## Detailed Guidance

- For GM handling of vetoes, see [gm-handling.md](gm-handling.md)
- For AI player veto examples, see [veto-examples.md](veto-examples.md)
