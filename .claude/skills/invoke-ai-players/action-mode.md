# Action Mode

AI players respond to prompts with actions, dialogue, or decisions.

## When Used

- Combat turns
- Quick reactions to events
- Decision points
- Dialogue responses
- Secret action opportunities

## File Flow

```
GM writes:     tmp/{character}-prompt.md
AI player reads: tmp/{character}-prompt.md + character sheet + party-knowledge + journal
AI player writes: tmp/{character}-response.md
```

## Prompt File Structure

The GM writes prompts with this structure:

```markdown
---
request_type: QUICK_REACTION | COMBAT_ACTION | FULL_CONTEXT | SECRET_ACTION
---

## Scene
[Current scene from character's perspective]

## Just Happened
[What triggered this request]

## Request
[Specific ask - what the GM needs from them]
```

### Request Types

| Type | Purpose | Expected Response |
|------|---------|-------------------|
| `QUICK_REACTION` | Ambient reaction | 1-2 sentences or `[VETO]` |
| `COMBAT_ACTION` | Combat turn | Action declaration |
| `FULL_CONTEXT` | After a veto | Full response with reasoning |
| `SECRET_ACTION` | Private opportunity | Private decision |

## Response File Structure

AI players write their response:

```markdown
Tilda's hand moves to her sword hilt. "Easy there, merchant. Hands where we can see them."
```

Or for a veto:

```markdown
[VETO - need more input]

The merchant mentioned the Flaming Fist. I'm ex-Fist and this could involve people I know.
```

## Parallel Spawning

For quick reactions, the GM often requests multiple characters at once:

```
[AWAIT_AI_PLAYERS: tilda-brannock, grimjaw-ironforge, seraphine-dawnwhisper]
```

Spawn all three simultaneously. Each reads their own prompt file and writes their own response file.

## Veto Handling

When an AI player vetoes:

1. They write `[VETO - reason]` to their response file
2. GM reads the veto and reason
3. GM writes a new `FULL_CONTEXT` prompt with more information
4. GM signals for just that character again
5. AI player gives full response

The orchestrator doesn't need to detect vetoes - just spawn when signaled and resume GM.

## No Journaling in Action Mode

In action mode, AI players do NOT update their journals. Journaling happens in a separate phase after the GM narrates the outcome. This ensures journals capture:

- What was happening (scene)
- What they did (their action)
- What resulted (GM's narration)

## Example: Quick Reaction

**GM writes `tmp/tilda-prompt.md`:**
```markdown
---
request_type: QUICK_REACTION
---

## Scene
You're in the dusty merchant's shop. Aldric stands at the counter.

## Just Happened
Aldric accused the merchant of selling cursed goods. The merchant's face went pale and reached under the counter.

## Request
Brief reaction (1-2 sentences) or [VETO] if this touches your backstory.
```

**AI player writes `tmp/tilda-response.md`:**
```markdown
Tilda's hand drops to her sword. "Hands up, merchant. Slowly."
```

## Example: Combat Action

**GM writes `tmp/grimjaw-prompt.md`:**
```markdown
---
request_type: COMBAT_ACTION
---

## Scene
Fighting 3 bandits in a narrow alley. Round 2.

## Combat State
- Bandit 1: Wounded, engaged with Tilda
- Bandit 2: Fresh, 30ft away with crossbow
- Bandit 3: Wounded, flanking Corwin
- You: Full HP, greataxe ready, 10ft from Bandit 1

## Your Turn
Declare your action.
```

**AI player writes `tmp/grimjaw-response.md`:**
```markdown
Grimjaw roars and charges Bandit 3, bringing his greataxe down in a brutal overhead swing to protect Corwin's flank.

(Reckless Attack for advantage, targeting Bandit 3)
```
