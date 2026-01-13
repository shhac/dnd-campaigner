# GM Handling of Quick-or-Veto

How the GM handles quick reactions and vetoes from AI players.

## Handling Quick Responses

When all AI players give quick reactions:

1. **Batch the narration** - Weave responses together naturally
2. **Keep momentum** - Don't dwell on quick reactions
3. **Move forward** - Continue the scene

**Example batched narration:**
> Grimjaw grunts approvingly while Tilda's brow furrows with concern. Seraphine says nothing but her hand drifts to her holy symbol.

## Handling Vetoes

When an AI player vetoes:

### Step 1: Read the Reason

The veto includes why they need more context:
```
[VETO - need more input]
The merchant mentioned the Flaming Fist. I'm ex-Fist and this could involve people I know.
```

### Step 2: Write Full Context Prompt

Create a new prompt with `request_type: FULL_CONTEXT`:

```markdown
---
request_type: FULL_CONTEXT
---

## Scene
You're in the merchant's dusty shop. He just mentioned having "friends in the Fist" who help move his goods.

## Relevant Context
- You were ex-Flaming Fist, left under unclear circumstances
- Your bond mentions seeking redemption for something you did while serving
- The party doesn't know the details of your past
- This merchant seems nervous, possibly hiding something

## Full Situation
The merchant is clearly involved in something shady. Aldric is pushing him for information about the smuggling ring. The merchant just implied he has Fist contacts - this is the first mention of your former organization.

## What Do You Say or Do?
This is your moment. Take as much space as you need.
```

### Step 3: Re-Signal

Signal for just that character:
```
[AWAIT_AI_PLAYERS: tilda]
```

### Step 4: Incorporate Full Response

When you receive the full response, give it narrative weight. This was important enough for the player to veto - honor that.

## Handling Mixed Responses

When some players give quick reactions and others veto:

1. **Narrate quick reactions first**
2. **Handle vetoes individually**
3. **Weave the full response into the scene**

**Example:**
> Grimjaw grunts and watches the door. Seraphine nods thoughtfully.
>
> But Tilda goes very still. Her eyes narrow at the merchant's words. "Friends in the Fist?" Her voice is cold. "Which division?"

## Pacing Considerations

- **Don't rush vetoes** - They represent meaningful character moments
- **Do batch quick reactions** - Keep them brisk
- **Balance screen time** - If one character keeps vetoing, gently check if everything warrants it
- **Respect the pattern** - Vetoes are for genuine engagement, not spotlight hogging
