# AI-Tell Vocabulary Reference

Words and phrases that appear 2x-182x more often in LLM output than human writing. Their presence signals AI authorship. Replace with specific, concrete language.

## Flagged Words

**Verbs:** delve, underscore, showcase, foster, harness, leverage, elevate, navigate, embark, illuminate, bolster, cultivate, encompass, resonate, align, unleash, unlock

**Adjectives:** pivotal, crucial, intricate, nuanced, robust, seamless, profound, vibrant, meticulous, multifaceted, holistic, dynamic, unprecedented, palpable, myriad, transformative, enduring, comprehensive

**Nouns:** tapestry, interplay, intricacies, testament, synergy, confluence, trajectory, spectrum, facet, cornerstone, paradigm, framework, ecosystem, realm

**Adverbs:** fundamentally, meticulously, arguably, seemingly

## Fiction-Specific Tells

- "unspoken" — appears in ~15% of LLM fiction vs near-zero in human fiction
- "tragically" — 11x more frequent than human writing
- "hung in the air" — dead metaphor used as atmospheric filler
- "a sense of [emotion]" — vague emotional hedging
- "a mix of [emotion] and [emotion]" — false complexity through enumeration

## Structural Tells

- **Present participial clauses** at 2-5x human rate: "-ing" phrases appended for shallow significance
- **Nominalizations** at 1.5-2x human rate: "the realization that..." instead of "she realized"
- **Em-dash overuse** for manufactured dramatic pauses
- **Oscillating register**: swinging between purple metaphor and curt cliché with nothing in between. The middle register — observed, specific, unsentimental — is where most good prose lives.
- **"The way" as simile connector**: natural in moderation, becomes a tic. Cap at 2 per chapter.

## Quantified Grammatical Tells (arXiv study)

These are measured against human fiction baselines:

| Pattern | LLM rate vs human | What to do |
|---------|-------------------|------------|
| Present participial clauses ("-ing") | 481-527% | Limit to 1-2 per page |
| Nominalizations (verb→abstract noun) | 209-214% | Use the verb: "she realized" not "the realization struck her" |
| That-clauses as subject | 263-331% | Restructure: "That he'd lied was obvious" → "He'd lied. Obviously." |
| Clausal coordination ("and"/"but") | 59-63% | Use MORE compound sentences — human prose flows through coordination |
| Profanity/colloquialisms | 0.3-1.4% | Allow "damn," "hell," regional speech — sanitized dialogue is a tell |

## Burstiness (Sentence Length Variation)

The single most reliable quantitative AI detector:

| Metric | Human writing | AI writing |
|--------|--------------|------------|
| Burstiness score | 0.65-0.85 | 0.15-0.30 |
| Sentence length range | 3-40+ words | 15-20 words (tight cluster) |
| Avg words per sentence | Varies by author | ~27 (ChatGPT), similar for Claude |

Burstiness = standard deviation of sentence lengths / mean. Higher = more human.

## Claude-Specific Tells

- Maintains a "quality floor" that humans rarely sustain — no lazy sentences, no fatigue
- Over-hedges with qualifiers
- Tends toward philosophical tangents
- Explains everything immediately rather than letting mystery build
- Prose reads as "detailed summary rather than lived experience"
- Known em-dash overuse

## Sources

- arXiv: "Do LLMs write like humans? Grammatical patterns" (2410.16107)
- PNAS study: "Do LLMs Write Like Humans?"
- GPTZero AI vocabulary frequency analysis
- GPTNone: "AI Writing Patterns That Get You Caught"
- Record Crash: "How to Identify AI-Written Web Fiction"
- Sean Goedecke: "Why do AI models use so many em-dashes?"
- Coyote Tracks: "Creative writing and AI's failure modes"
- Alexander Wales: "Adventures in AI Text Generation"
