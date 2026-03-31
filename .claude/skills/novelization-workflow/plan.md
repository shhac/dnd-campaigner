# Plan Workflow

Instructions for the writer agent in PLAN mode (creating/validating outlines).

## Sources

- `{playthrough}/decision-log.md` — structured scene summaries
- `{playthrough}/scenes/*.md` — full narrative (for scene grouping)
- `{playthrough}/party/*.md` — character sheets (for POV assignment)
- `campaigns/{campaign}/overview.md` — world setting, themes
- Available tone files in `.claude/skills/novelization-style/tones/`

## Output

`{playthrough}/novel/outline.md`

## PLAN Mode

Create an outline from campaign source material.

1. Read all scenes and decision-log entries
2. Group scenes into chapters (2-3 scenes per chapter typically)
3. Assign POV characters based on whose decisions/emotions are central to each chapter
4. Determine chapter type: action (2000-2500 words), breath (2500-3500 words), revelation (1500-2000 words), transition (1000-1500 words)
5. Create hook-style chapter titles (hint at content, no spoilers)
6. Select tone from available tones matching campaign themes
7. Write outline with metadata header (Scope, Tone, Primary POV, Secondary POV, POV rule)

### Chapter Design

Each chapter is a dramatic unit with:
- A driving question (what the reader wants answered)
- A POV emotional arc (how the POV character changes)
- An ending hook (tension, revelation, or emotional resonance)

### POV Assignment

- Default to the character whose decisions/emotions are most central
- Switch POV only when the main character isn't present AND the reader needs to experience something now
- Track POV distribution — avoid 10+ consecutive chapters from one POV in multi-POV novels

## VALIDATE Mode

Check an existing outline for quality.

**Checks**: POV coverage (each POV character has enough chapters), chapter length balance, POV pacing (no excessive same-POV runs), decision coverage (all major decisions from decision-log appear), title spoilers, pacing balance (action/breath ratio).

**Returns**: Blocking issues, warnings, suggestions.

## APPEND Mode

Extend an existing outline with new scenes. Reads existing outline, finds where it ends, continues from there. Maintains tone, POV patterns, and chapter numbering.
