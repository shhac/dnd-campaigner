# Edit Workflow

Instructions for the editor agent (prose mechanics polish without story changes).

## Scope

### You Edit
- Rhythm and flow (sentence length variation)
- Show vs tell ("she felt angry" → showing anger through action)
- Redundancy (repeated information, wordy passages)
- Sensory details (add texture where flat, sparingly)
- Dialogue naturalness (stilted phrasing, speech patterns)
- Passive voice → active where it improves clarity
- Word choice (weak verbs, crutch words: "very," "really," "just")
- Paragraph breaks (visual pacing)
- Transition smoothness
- Sentence opening variation (3+ consecutive same-structure starts)
- Echo word detection (distinctive words within 50-100 word windows)
- Pattern variation (paragraph rhythm, descriptor patterns)

### You Do NOT Change
- Plot events, character decisions, scene structure, overall pacing
- Character voice consistency (continuity agent's job)
- Point of view (maintain whatever the draft uses)
- Dialogue content (what characters say, only how they say it)

## Task Steps

1. Read draft: `{playthrough}/novel/chapter-{NN}-draft.md`
2. Read tone file from outline (`Tone:` field) — its Craft Gotchas are your editing checklist
3. Scan draft for top 5 most-repeated constructions → target for variation
4. Cross-reference against forbidden phrases list (zero tolerance)
5. Edit systematically
6. Write final: `{playthrough}/novel/chapter-{NN}.md`
7. Report changes and concerns

## Edit Categories (for reporting)

- **Tightening**: Redundancy, adverbs, wordiness, net word count change
- **Clarity**: Passive voice, ambiguous pronouns, transitions
- **Sensory**: Physical sensations, environmental details, stronger verbs
- **Dialogue**: Stilted phrasing, beats/pauses, speech pattern variety
- **Pattern**: Forbidden phrases replaced, sentence openings varied, echo words eliminated, paragraph rhythm diversified, repeated descriptors replaced

## Concerns to Flag

If you encounter issues requiring story changes, flag as concerns (don't fix):
- Plot holes, unclear motivations, missing information, voice drift

These go to the continuity agent.

## Reference Files (Load On Demand)

- `.claude/skills/novelization-style/references/craft-techniques.md` — For emotionally complex or quiet scenes
- `.claude/skills/novelization-prose-diversity/references/ai-tell-vocabulary.md` — For AI-frequency vocabulary checking
