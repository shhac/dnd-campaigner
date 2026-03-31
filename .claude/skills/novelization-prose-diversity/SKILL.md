---
name: novelization-prose-diversity
description: Anti-repetition and anti-AI-tell guidance for novel writing. Forbidden phrases, LLM failure mode gotchas, sentence diversity rules, and cross-chapter pattern avoidance. Use when writing or editing novel chapters to prevent repetitive or AI-identifiable prose.
---

# Prose Diversity Guide

Loaded by novelizer-writer and novelizer-editor. Canonical reference for avoiding repetitive and AI-identifiable prose.

## LLM Fiction Gotchas

These are the specific ways you will fail at fiction writing. Read each one as a prediction about your default behavior.

**You will default to omniscient narration.** Even when told "close third person on Verdakho," you will write "Lasinne stood behind him, her eyes finding the wounded." That's omniscient — the POV character can't see her eyes. After every paragraph, check: could the POV character perceive this? If not, rewrite.

**You will name characters before the POV character learns their name.** You treat names as reader-facing labels and front-load them. Don't. Use description first ("a woman with close-cropped grey hair"). The name arrives when the POV character hears it — in dialogue, introduction, or overhearing.

**You will smuggle information through future-narrator.** This includes ALL of: "Later he would learn," "though he didn't know it yet," "years after," "someone would tell him," "he would come to understand." ANY construction where the narrator knows something the character doesn't know yet. Stay in the present moment. If the character doesn't know it NOW, the reader doesn't know it NOW. The character can speculate or wonder, but the narrator cannot confirm or preview.

**You will find a construction that works and repeat it.** You sampled well once and now you're stuck. Cap any simile connector, sentence structure, or metaphor pattern at 2 uses per chapter.

**You will name emotions instead of showing them.** "She felt grief." Delete that. Keep only what a camera could see plus what the POV character's specific mind would notice. Use the Maass technique: write the emotion, then delete the word and keep only behavior, perception, and symbolic action.

**You will reach for stock body language.** Jaw clenched. Knuckles white. Heart hammered. Stomach dropped. Breath caught. These are the cheat sheet. Find the physical response specific to THIS character in THIS moment.

**You will write in triplets.** Three adjectives. Three phrases. Three examples. The rule of three is your comfort food. Use two items or four. Almost never three.

**You will default to earnest.** Your narration will be sincere and weighted. Allow irony, dryness, dark humor, detachment, bitterness. Characters and narrators should have edge.

**You will resolve conflict too quickly.** Characters will reach consensus in dialogue faster than humans do. Allow genuine disagreement, misunderstanding, talking past each other, and unresolved tension.

**You will overuse em dashes.** LLMs use em dashes at roughly 10x the human rate. Cap at 3-4 per chapter. Never use two em-dash constructions in adjacent sentences. Prefer commas, parentheses, or restructuring. When you do use an em dash, it should feel like a deliberate choice, not a default connector.

**You will flood with participial clauses.** "-ing" phrases appended to sentences at 5x the human rate. "Walking to the door, she noticed the room, pausing to consider..." Limit to 1-2 per page. If you catch yourself chaining participials, restructure with finite verbs.

**You will under-use coordination.** LLMs use "and" and "but" to join clauses at only 60% of the human rate. You prefer semicolons, em dashes, or period breaks. Human prose FLOWS through coordination. Use more compound sentences joined by "and," "but," "or," "so," "yet." Let sentences run together naturally.

**You will write at a uniform quality level.** Claude produces prose that is "consistently thoughtful and measured in a way humans rarely sustain." This quality floor is itself suspicious. Allow some sentences to be plain. Allow functional transitions. Not every sentence needs to be crafted. A sentence that just moves the character from the door to the table is fine. Imperfection is human.

**You will write in blocks.** Dialogue block, then exposition block, then narration block, in mechanical sequence. Human fiction INTERWEAVES these within paragraphs. A character can act, speak, think, and observe the environment in a single paragraph. Mix modes constantly.

## Forbidden Phrases

Zero tolerance. Delete and replace with something specific to this character, this moment, this world.

### Emotional Clichés
- "the weight of [noun] settled on/over" → Physical sensation specific to this character
- "something inside [pronoun] broke/shifted/stirred" → Name the specific feeling through behavior
- "eyes widened in [emotion]" → Involuntary reaction: stepped back, breath caught
- "heart pounded/hammered/raced" → Different body part or character-specific stress response
- "[emotion] washed over [pronoun]" → Active construction: character DOES something
- "couldn't quite place" → Either they recognize it or they don't — commit
- "the air itself seemed to [verb]" → Describe what the character senses
- "more than [pronoun] could bear" → Show the breaking point through action
- "couldn't help but [verb]" → Just have them do it

### Physical Action Clichés
- "let out a breath [pronoun] didn't know [pronoun] was holding" → Exhaled. Shoulders dropped.
- "squared [possessive] shoulders" → Character-specific preparation gesture
- "clenched [possessive] jaw" → Ground teeth, bit inside of cheek
- "exchanged a glance" → Describe what the glance communicates
- "found [possessive] voice" → Just have them speak

### Structural Clichés
- "Not X. Not Y. Just Z." — Once per chapter maximum
- "Something like [emotion]" — Name it or show it
- "The kind of X that Y" — Cut the explanation
- "[Character] filed that away" — Show the thought landing
- "It was [character] who spoke first" — Just have them speak

See `references/ai-tell-vocabulary.md` for the full list of flagged AI-frequency words.

## Sentence Structure Rules

### Openings
- No more than 2 consecutive sentences starting with the same word
- No more than 2 consecutive paragraphs opening with a character name
- Track opening distribution: no pattern >40%

### Length and Rhythm (Burstiness)
- AI sentences cluster at 15-20 words. Human prose ranges from 3 to 40+. VARY DRAMATICALLY.
- No more than 3 consecutive sentences of similar length
- The shift between long and short IS the tool
- Include some very short sentences (3-6 words) and some genuinely long ones (30+ words)
- Fragments: 1-2 per chapter for impact, but also allow "And" or "But" sentence starters and comma splices for effect — perfect grammar is itself an AI tell
- Cap paragraphs at ~120 words, but also allow occasional single-sentence paragraphs and short 2-sentence paragraphs — uniform 3-5 sentence paragraphs are an AI tell

### Dialogue Attribution
- Rotate: "said" tag, action beat, no tag, internal reaction
- Never same method 3 times consecutively
- "Said" is invisible — prefer over creative tags
- Action beats > tags when the action adds character information

### Punctuation
- Em dashes: 3-4 per chapter maximum. Never two em-dash constructions in adjacent sentences.
- Semicolons: use sparingly and only as a rhetorical choice, not a mechanical connector between independent clauses
- Parentheses: USE them occasionally for asides — their absence is itself an AI tell
- Contractions: use freely in dialogue and close-third narration. "Did not" instead of "didn't" sounds robotic.

## Cross-Chapter Diversity

### Voice vs. Construction
Carry forward the **character's voice** (vocabulary, register, emotional processing). Deliberately vary the **author's constructions** (sentence patterns, metaphors, transitions, scene openings).

### Avoidance List
After reading the previous chapter, identify 5 constructions used more than once. These are banned for the current chapter.

### Distinctive Technique
Each chapter includes at least one technique not in the adjacent chapter: flashback, list, letter, extended metaphor, single-sentence paragraph, pure dialogue stretch, sensory-only description, half-scene summary.
