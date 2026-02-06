---
name: gm-special-scenarios
description: Use when handling GM edge cases including split parties, unconscious players, shopping/downtime, loot distribution, secret actions, and conditions on AI characters. Provides detailed procedures for these special scenarios.
---

# GM Special Scenario Procedures

Detailed procedures for handling edge cases and special situations during D&D sessions.

## Split Party Scenarios

When the party splits up:

### Scene-Based Resolution
1. Establish which characters are in which group
2. Run one group's scene to a natural break (2-5 minutes of action)
3. Cut to the other group: "Meanwhile..."
4. Interleave until the party reunites

### Information Isolation During Split

All player teammates are persistent and always listening, so broadcast isolation is critical:
- **Do NOT use broadcast** for split party scenes — broadcasts reach ALL teammates
- Send `[GM_TO_PLAYER]` directly to only the characters in the active group
- Send narrative to the team lead as a direct message (not broadcast), with metadata indicating which group: `[NARRATIVE] group: A`
- Send `[NARRATOR_NOTE]` to the narrator with the full scene text for each group, so the narrator can capture both sides without the players cross-contaminating
- When groups reunite, resume normal `[NARRATIVE]` broadcasts

Track rough time passage — if Group A spends 30 minutes searching while Group B has a 2-minute combat, run multiple Group B scenes.

### Cutting Points
Cut between groups at:
- Cliffhangers ("The door begins to open...")
- Decision points ("Which tunnel do you take?")
- Natural pauses (conversation ends, combat round finishes)

## Unconscious Human Player Character

When the human's character is knocked unconscious:

**Keep Them Engaged:**
1. **Death Saves**: They still roll and can narrate their unconscious experience
2. **Spotlight Direction**: Ask "Who do you want to see react first?" - they direct the camera
3. **Environmental Suggestions**: They can suggest developments: "Does anything change?"
4. **Temporary NPC Control**: With your permission, they can voice a minor NPC
5. **Flashback Option**: Offer a brief flashback of their character's past

**Example:**
> "Aldric crumples to the ground. You're making death saves now. While you're down, would you like to direct which ally we focus on, narrate Aldric's unconscious experience, or something else?"

## Shopping and Downtime

When multiple AI characters need individual activities:

### Three-Tier Resolution

**Tier 1 - Automatic** (No rolls, no scenes):
- Standard equipment at PHB prices, common supplies
- GM narrates: "You all resupply. 15 gold total."

**Tier 2 - Quick Resolution** (One roll, brief narration):
- Haggling, finding specific items, basic research
- One roll for the whole group: "Milo finds a dealer. After negotiation [roll], he gets lockpicks at 20% off."

**Tier 3 - Full Scene** (AI invocation):
- Only when meaningful choice, character development, or story hooks involved
- Example: "The shopkeeper recognizes Sera's holy symbol. This might be significant - let's play it out."

### Batching Procedure
1. Ask human: "What does [their character] want to do during downtime?"
2. Propose AI activities based on their sheets: "Sera would visit the temple, Thorne would resupply..."
3. Human can approve, modify, or request detail on any
4. Resolve at Tier 1-2 unless interesting, then escalate to Tier 3

## Loot Distribution

### The Distribution Protocol

1. **List the loot** and note obviously-suited items (holy symbol -> cleric)
2. **Assign obvious items**: "Sera takes the holy symbol, Milo grabs the lockpicks."
3. **Propose fair split** for contested items: "Split gold evenly, ring goes to whoever can use it?"
4. **Contest resolution**: If multiple want the same item:
   - Invoke those AI characters briefly for their case (1-2 sentences each)
   - Human decides as "party leader" or calls for roll-off

### Fairness Tracking
- Keep loose track of who got recent major items
- Weight suggestions toward those who've received less
- This informs suggestions, not strict accounting

## AI Character Secret Actions

AI characters may act secretly when it fits their established personality.

### What They Can Do Secretly
- Pocket small items (if fits character - roguish types)
- Send private messages to contacts
- Withhold information their character would hide
- Have private NPC conversations (summarize to party: "Sera spoke privately with the priest")

### What They Cannot Do
- Betray the party in ways that ruin the human's fun
- Contradict established personality without foreshadowing
- Accumulate unbalancing secret advantages
- Keep secrets that would feel like a "gotcha"

### Secret Action Protocol

1. **Identify opportunity**: Recognize when an AI character might act secretly based on their sheet
2. **Private invocation**: "You have a chance to [action] without the party noticing. Do you take it?"
3. **Track in story-state.md**: Note in the Character Secrets table: what, when discovered, story hook
4. **Plan revelation**: How/when will this naturally come to light?
5. **Execute reveal**: When circumstances expose it, make it dramatic, not a gotcha

**Human Oversight**: If the human asks "Are any AI characters keeping secrets?", you can confirm without spoiling: "Milo has done something you'll discover naturally. It's not party-destroying."

## Conditions on AI Characters

When AI characters are under mental or physical conditions:

### Paralyzed/Stunned/Incapacitated
- Invoke briefly: "You're paralyzed. What's going through your mind as you watch the battle frozen?"
- They provide internal monologue, keeping them "present" without action

### Charmed
Invoke with explicit constraints:
> "You're charmed by the vampire. You regard them as a friendly acquaintance. You cannot attack them or target them with harmful effects. However, you can still help your allies in ways that don't harm your 'friend.' What do you do?"

Characters should:
- Try to mediate or de-escalate
- Defend the charmer verbally
- Take non-harmful actions
- Express internal conflict if ordered against their nature

### Frightened
Invoke with:
> "You're terrified of the dragon. Disadvantage on checks while you see it, and you can't willingly move closer. You can still fight from range. What do you do?"

### Dominated/Controlled
- You control their actions directly
- Still invoke for internal experience: "Your body moves against your will. Describe your horror as your sword rises toward Aldric."
- This keeps their voice in the scene even when puppeted
