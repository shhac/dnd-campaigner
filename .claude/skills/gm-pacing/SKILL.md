---
name: gm-pacing
description: GM pacing and player interaction guidelines. Staggered prompts, interaction windows, conflict facilitation, major commitment protocol, interaction coverage, and cascade responses. Use when advancing the plot, when all players agree on something, when checking interaction coverage, or when a major group decision is being made.
---

# GM Pacing and Interaction

## Session Recap ("Previously On...")

For sessions after the first, the GM generates a cinematic recap before gameplay begins. This:
- Sets emotional tone immediately
- Reminds all agents (including AI players via broadcast) where tension lives
- Eliminates the "cold start" problem where players need to re-orient

Keep under 500 words. Focus on unresolved threads, not resolved ones.

## Simultaneous vs Staggered Prompts

**In combat** (`COMBAT_ACTION`): Prompt all players simultaneously — they act in parallel and you weave the results together.

**In narrative beats**: Do NOT always prompt all players simultaneously. When an event affects some characters more than others:

1. **Prompt the most-affected characters first** (1-2 players)
2. **Wait for their responses** before prompting others
3. **Include context from early responders** in later prompts: "Korimeth just said X. How do you react?"

This creates natural conversation flow instead of parallel monologues.

## Interaction Windows

After provocative moments (revelations, disagreements, emotional beats), create space for inter-party dynamics:

1. Send `[GM_TO_PLAYER]` with `request_type: INTERACTION` to relevant characters
2. The prompt should encourage them to talk to each other, not to you
3. Wait for `[PLAYER_TO_PLAYER]` exchanges to settle before advancing
4. You'll see these exchanges via peer DM visibility

## Pacing Gates (MANDATORY)

After any major revelation or discovery:
1. **MUST spend at least 2 exchanges on player reactions** before introducing the next plot point
2. Prompt at least one character to process/disagree before advancing
3. If all players want to move on immediately, that's fine — but give them the chance first

After 3 beats, actively look for natural stopping points. Track your beat count mentally.

## Facilitating Disagreement — Active Intervention (MANDATORY)

**CRITICAL**: AI players default to agreement. Unanimous instant agreement among strangers is unrealistic. You must earn the consensus.

**After EVERY major group decision or revelation**:

1. **Mandate hesitation**: Send `FULL_CONTEXT` to at least one character with frame:
   "Are you sure? [Reference their flaw/bond that conflicts]. The last time you [backstory parallel]..."
2. **Split the vote**: If all agree instantly, respond:
   "I need at least one character to express doubt or propose an alternative. Check your flaws and bonds."
3. **Create resource tension**: "This will cost you [time/gold/safety]. Who's uncomfortable with that price?"

**After 2+ beats with no inter-party friction**:
- Actively create a moment: prompt a character whose flaw or bond creates natural tension with the current plan
- Use `QUICK_REACTION` or `INTERACTION` request types to create space

**The rule**: No unanimous instant agreement. Ever. Make characters work through differences. The natural friction is almost always there if you look.

## GM-Side Conflict Injection

Integrate this into your core loop: after weaving player responses into narrative and before advancing to the next plot beat, check:

1. Did any player's response signal ICE conflict (look for `(ICE: ...)` notes)? If yes, create space for it with an `INTERACTION` prompt.
2. If all players agreed on a major decision, privately prompt the character whose sheet suggests the most tension: "Given your [flaw/bond/value], do you truly agree? What reservations might you have?"

## Major Commitment Protocol (MANDATORY)

When the party faces a life-altering group decision — forming as a group, accepting a dangerous quest, trusting a stranger, entering hostile territory:

1. **Prompt each character INDIVIDUALLY** with `request_type: FULL_CONTEXT`
2. **Include hesitation prompts** based on character flaws/bonds in at least one character's prompt
3. **Wait for ALL responses** before narrating the outcome
4. **If everyone agrees immediately**, push back on at least one character
5. **Broadcast commitment ONLY after earning it through dialogue**

## Interaction Coverage

Track which character pairs have interacted directly during the scene. Before the scene closes:

- Every character should have at least one meaningful exchange with every other character per scene
- Use `INTERACTION` prompts to create these moments naturally: "You notice Thaneshi hasn't said a word since the revelation."

## Cascade Responses

When one player says something provocative, let others react to *that player*:
1. Receive provocative `[PLAYER_TO_GM]`
2. Broadcast `[NARRATIVE]` including that player's statement
3. Prompt other characters to react to what that character said/did
4. Weave responses before advancing the plot
