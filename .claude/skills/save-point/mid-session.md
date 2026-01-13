# Mid-Session Save Protocol

When the player needs to stop unexpectedly during a session.

## When to Use

- Player says "I need to go" or "let's pause"
- Technical issues (connection problems, etc.)
- Real-life interruption
- Any unplanned stop

## Save Procedure

### 1. Note Exact Position

Record precisely where you are:

```markdown
## Mid-Session Save Point
- Location: {exact location}
- Situation: {what's happening}
- In combat: {Yes/No}
  - If yes: Round {N}, {character}'s turn
  - Initiative order: {list}
  - HP status: {for each combatant}
- Pending: {any unresolved actions or decisions}
```

### 2. Capture Transient State

Things that aren't normally saved but matter mid-scene:

```markdown
## Transient State
- Active conditions: {who has what condition}
- Concentration spells: {who concentrating on what}
- Temporary HP: {who has how much}
- Reactions used: {this round}
- Positioning: {rough positions if relevant}
```

### 3. Mark as Mid-Session

Add clear marker in story-state.md:

```markdown
---
**MID-SESSION SAVE**
Date: {date/time}
Resume from: {brief description}
---
```

### 4. Update Party Knowledge

Even for mid-session, update party-knowledge.md with anything that happened since last save.

## Resume Protocol

When resuming from a mid-session save:

### 1. Read State Aloud

Summarize for the player:
> "When we left off, you were in the warehouse, round 3 of combat. Grimjaw was about to attack the bandit leader. Tilda was prone from the last hit. The bandit archer still has an arrow nocked..."

### 2. Confirm with Player

> "Is that right? Anything you remember differently?"

### 3. Clear Mid-Session Marker

Remove the "MID-SESSION SAVE" marker from story-state.md.

### 4. Continue Exactly

Pick up precisely where you stopped. Don't skip ahead or summarize past the save point.

## Example Mid-Session Save

```markdown
## Mid-Session Save Point

**Location:** Abandoned warehouse, main floor
**Situation:** Combat with smugglers
**In combat:** Yes
- Round: 3
- Current turn: Grimjaw
- Initiative: Grimjaw (18), Tilda (15), Bandit Leader (12), Bandit Archer (10), Corwin (8)

**HP Status:**
- Grimjaw: 28/35
- Tilda: 12/24 (prone)
- Corwin: 30/30
- Bandit Leader: ~20 remaining (bloodied)
- Bandit Archer: full

**Transient State:**
- Tilda: prone condition
- Corwin: concentrating on Bless (Grimjaw, Tilda, self)
- Bandit Archer: used reaction (opportunity attack)

**Pending:** Grimjaw declared Reckless Attack on Bandit Leader, roll not yet made

---
**MID-SESSION SAVE**
Date: 2024-01-15 3:45pm
Resume from: Grimjaw's attack roll against Bandit Leader
---
```
