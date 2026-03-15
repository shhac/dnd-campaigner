# Split Party Scenarios

When the party splits up:

## Scene-Based Resolution
1. Establish which characters are in which group
2. Run one group's scene to a natural break (2-5 minutes of action)
3. Cut to the other group: "Meanwhile..."
4. Interleave until the party reunites

## Information Isolation During Split

All player teammates are persistent and always listening, so broadcast isolation is critical:
- **Do NOT use broadcast** for split party scenes — broadcasts reach ALL teammates
- Send `[GM_TO_PLAYER]` directly to only the characters in the active group
- Send narrative to the team lead as a direct message (not broadcast), with metadata indicating which group: `[NARRATIVE] group: A`
- Send `[NARRATOR_NOTE]` to the narrator with the full scene text for each group, so the narrator can capture both sides without the players cross-contaminating
- When groups reunite, resume normal `[NARRATIVE]` broadcasts

Track rough time passage — if Group A spends 30 minutes searching while Group B has a 2-minute combat, run multiple Group B scenes.

## Cutting Points
Cut between groups at:
- Cliffhangers ("The door begins to open...")
- Decision points ("Which tunnel do you take?")
- Natural pauses (conversation ends, combat round finishes)
