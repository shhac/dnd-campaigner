# Write Workflow

Instructions for the writer agent in WRITE mode (drafting chapters from outline specs).

## Sources (What You Read)

1. **`{playthrough}/novel/outline.md`** — chapter spec (title, POV, type, scenes, target words)
2. **`{playthrough}/decision-log.md`** — structured scene summaries (those listed in chapter spec)
3. **`{playthrough}/scenes/*.md`** — full narrative for relevant scenes. Draw authentic dialogue from these. Use atmospheric details and sensory texture. Match scene files to the scenes listed in your chapter spec.
4. **`{playthrough}/party/{pov-character}.md`** — POV character sheet
5. **`{playthrough}/party/{pov-character}-journal.md`** — emotional context (optional)
6. **`{playthrough}/novel/story-so-far.md`** — running plot/character summary (if exists; useful for Ch 3+)
7. **`{playthrough}/novel/chapter-{N-1}.md`** — previous chapter FINAL version for voice continuity (if N > 1)
8. **Tone file** — `.claude/skills/novelization-style/tones/{tone}.md` matching the `Tone:` field in outline header. **MANDATORY. Contains craft gotchas that prevent common LLM failures. Read BEFORE writing.**

## Output

`{playthrough}/novel/chapter-{NN}-draft.md` (zero-padded: `chapter-03-draft.md`)

When reading previous chapters for continuity, always read the FINAL version (`chapter-{N-1}.md`), not the draft.

## Task Steps

1. Read outline → extract chapter spec
2. Extract tone from outline metadata → read tone file
3. Read relevant scenes from decision-log and scene files
4. Read POV character sheet and journal
5. Read previous chapter (if N > 1) for voice continuity
6. **Avoidance list**: Identify 5 overused constructions from previous chapter. These are banned.
7. **Choose distinctive technique**: Pick one not in chapter N-1 (flashback, list, pure dialogue stretch, sensory-only passage, half-scene summary, single-sentence paragraph, extended metaphor)
8. If VOICE_FEEDBACK provided: incorporate as high-priority style direction
9. Write the chapter
10. Hit target word count (within 20%)

## Permission to Invent

You are a novelist, not a court reporter. You may ADD:

- **Internal monologue**: What the POV character was thinking. Draw from character sheet.
- **Connective tissue**: Transitions between scenes, quiet moments, meals where nothing happens but everything shifts.
- **Backstory flashbacks**: Triggered by present-moment stimuli. Under 300 words.
- **Sensory expansion**: Scene files say what happened. You add what it smelled/sounded/felt like.
- **Subtext in dialogue**: Characters can hedge, deflect, say one thing and mean another.
- **Reactions not played**: If the session moved on before a character could react, give them that reaction.

You must NOT invent: plot events, character decisions contradicting the decision-log, information the POV character doesn't know, romantic/intimate content not established in play, deaths/injuries/consequences not in source material.

## Compression and Expansion

**Compress** (1 sentence to 1 paragraph): Travel, shopping, unremarkable checks, repeated discussions, static combat rounds.

**Expand** (1 game moment → 1-3 pages): Defining character choices, world-changing revelations, genuine disagreements, surprising outcomes, backstory triggers, near-death moments.

**Standard** (proportional): NPC conversations, exploration, planning.

## Voice Feedback

| Feedback | Response |
|----------|----------|
| "Too slow" | Tighten, shorter sentences, cut filler |
| "Too rushed" | Add beats, sensory details, breathing room |
| "Over-written" | Cut adjectives, trust nouns, simpler prose |
| "Too distant" | More internal thoughts, visceral reactions |

## Voice Continuity (Ch 2+)

Read the previous chapter for narrative continuity (what happened, emotional state, active threads). Do NOT replicate sentence structures, metaphor families, or transitional patterns. Maintain the avoidance list.

If `{playthrough}/novel/voice-profile-{pov-character}.md` exists, read it for voice guidance. Otherwise fall back to previous chapter voice.

## Multi-POV

For novels with multiple POV characters:
- Voice lock may extend to Chapters 1-2 if different POVs appear
- Per-POV voice feedback applies only when writing that POV's chapters
- Maintain distinct voices — characters should not all sound the same

## Reference Files (Load On Demand)

- `.claude/skills/novelization-style/references/craft-techniques.md` — For emotionally complex or quiet scenes
- `.claude/skills/novelization-style/references/prose-conversion-examples.md` — For combat/ability check conversion
- `.claude/skills/novelization-prose-diversity/references/ai-tell-vocabulary.md` — For AI-frequency word checking
