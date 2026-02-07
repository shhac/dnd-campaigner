# Veto Examples

Examples of when to veto and when to give quick reactions.

## Should Veto

### Backstory NPC Appears

**Scene:** The party enters a tavern. The GM mentions a grizzled mercenary drinking alone.

**Your sheet says:** Bond - "I'm hunting the mercenary captain who betrayed my company."

**Response:**
```markdown
[PLAYER_TO_GM]
type: VETO
character: {character}

Need to know more about this mercenary. My bond is hunting a specific mercenary captain who betrayed my company.
I need full context to respond properly.
```

### Moral Dilemma Touching Ideal

**Scene:** Party debates executing a surrendered bandit who killed villagers.

**Your sheet says:** Ideal - "Redemption is always possible."

**Response:**
```markdown
[PLAYER_TO_GM]
type: VETO
character: {character}

This directly conflicts with my ideal about redemption. I need to engage with this decision fully.
```

### Flaw Triggered

**Scene:** Party finds hidden treasure worth thousands.

**Your sheet says:** Flaw - "I can't resist a pretty face or a shiny coin."

**Response:**
```markdown
[PLAYER_TO_GM]
type: VETO
character: {character}

My flaw about being unable to resist treasure is directly triggered. I need to roleplay this properly.
```

---

## Should NOT Veto

### Interesting But Not Personal

**Scene:** Party discovers a hidden temple to a dark god.

**Your sheet:** You're a cleric, but your deity isn't involved and your backstory doesn't mention this cult.

**Response:**
```markdown
Seraphine makes a warding sign, her face troubled. "We should be careful here."
```

Why: Your cleric would react, but this isn't your specific story. Quick reaction is appropriate.

### Combat Tactics

**Scene:** Fight is going well. GM asks for your action.

**Your sheet:** Normal combat situation, no special triggers.

**Response:**
```markdown
Grimjaw charges the nearest enemy, greataxe swinging. "For the clan!"
```

Why: Standard combat doesn't need full engagement unless it's truly pivotal.

### General Opinion

**Scene:** Party debates which path to take.

**Your sheet:** No particular stake in the direction.

**Response:**
```markdown
"I say we go left. Fewer tracks that way." Tilda shrugs.
```

Why: Having an opinion doesn't mean needing full spotlight.

---

## Borderline Cases

### Case 1: Related But Not Direct

**Scene:** NPC mentions your homeland in passing.

**Your sheet:** Background mentions you're from that region.

**Decision:** Quick reaction unless the NPC seems to know something specific about you.

### Case 2: Combat Gets Serious

**Scene:** Ally just dropped to 0 HP.

**Your sheet:** Bond says you protect this particular ally.

**Decision:** Veto if you have a bond with them. Quick reaction if it's general party concern.

### Case 3: Loot Distribution

**Scene:** Party found an item perfect for your class.

**Your sheet:** No special connection to the item.

**Decision:** Quick reaction advocating for yourself. Veto only if item has backstory connection.

---

## Veto Format Reminder

**Correct:**
```markdown
[PLAYER_TO_GM]
type: VETO
character: tilda-brannock

This merchant is from my hometown. My bond says I'm searching for someone there.
I need full context to respond properly.
```

**Incorrect (includes full response):**
```markdown
[PLAYER_TO_GM]
type: VETO
character: tilda-brannock

This merchant is from my hometown!

Tilda's eyes widen. "Wait. You're from Riverton?" She steps forward, hands shaking...
```

After vetoing, STOP. Wait for the GM to provide full context.
