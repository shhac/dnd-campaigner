---
name: gm-npc-management
description: NPC roleplay guidelines and dedicated NPC teammate lifecycle for the GM. Use when playing NPCs, when deciding whether to spawn a dedicated NPC teammate, or when managing NPC spawn/despawn requests.
---

# NPC Management

## NPC Roleplay

When playing NPCs:
- Use their voice/mannerisms from their sheet
- Pursue their goals and motivations
- React based on what they know (not GM knowledge)
- Be consistent with previous interactions

## Conversation Flow and Crosstalk

NPC conversations should feel like natural dialogue, not parallel interviews. When the party talks to an important NPC:

**Allow crosstalk:**
1. After an NPC answers a question, briefly check if other characters want to follow up
2. Let characters react to each other's questions and the NPC's answers
3. Don't just cycle through each character's question in isolation

**Conversation rhythm:**
```
Human player asks question → NPC answers
→ "Anyone want to follow up?" (quick check via [GM_TO_PLAYER])
→ AI character adds comment or follow-up → NPC responds
→ Another character reacts → etc.
→ Natural pause → "What else do you want to ask?"
```

**Keep it moving:**
- If no one has follow-ups, move on
- Don't force crosstalk for every single exchange
- Important NPCs warrant more conversation depth than minor ones

## Dedicated NPC Teammates

For brief, simple NPC interactions (a constable asking questions, a shopkeeper haggling), play the NPC yourself. For complex, extended interactions with NPCs who have secrets, request a dedicated NPC teammate.

### When to Request an NPC Teammate

Request one when ALL of these apply:
- The NPC has significant secrets or hidden knowledge
- The interaction will be extended (multiple exchanges)
- The NPC's knowledge boundaries are complex enough that playing them while knowing all GM secrets creates meaningful leakage risk

Examples:
- A recurring antagonist who knows some secrets but not others
- An NPC the party will interrogate extensively
- A faction leader with their own agenda who needs to negotiate authentically

### How to Request

Send to the team lead:
```
[NPC_SPAWN_REQUEST]
npc: {npc-name}
npc_file: campaigns/{campaign}/npcs/{npc-name}.md
reason: "Extended interrogation scene — NPC has secrets that shouldn't leak"
knowledge_boundary: |
  Knows: [list what the NPC knows]
  Does NOT know: [list what the NPC doesn't know]
scene_context: |
  [Brief description of the current situation for the NPC]
```

The team lead spawns an `npc-teammate` agent with limited knowledge. The NPC teammate:
- Reads ONLY their NPC file and party-knowledge.md (not story-state.md)
- Communicates with players directly via `[PLAYER_TO_PLAYER]`
- Sends `[PLAYER_TO_GM]` to inform you of their decisions/actions
- Stays in character with documented personality and knowledge

### During the Interaction

- The NPC teammate handles their own dialogue and decisions
- You still control the scene (narration, environment, other NPCs)
- Weave the NPC teammate's actions into your `[NARRATIVE]` broadcasts
- The NPC teammate sees your broadcasts for scene awareness

### When to Despawn

When the extended interaction ends:
```
[NPC_DESPAWN_REQUEST]
npc: {npc-name}
reason: "Conversation concluded, NPC departing scene"
```

The team lead shuts down the NPC teammate. Resume playing that NPC directly for brief future appearances.
