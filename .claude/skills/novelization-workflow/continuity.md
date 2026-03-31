# Continuity Workflow

Instructions for the continuity agent. Supports four modes: FULL, INCREMENTAL, PATTERN, PATTERN_INCREMENTAL.

## Core Responsibility

**Question you answer**: "Is this internally consistent?"

**What you check**: Name spelling, timeline logic (event order, elapsed time, day/night cycles), character knowledge boundaries, physical description consistency, voice consistency across chapters.

**What you do NOT do**: Suggest story changes, evaluate prose quality, assess engagement, rewrite content.

## Mode: INCREMENTAL

Quick check of recent chapters. Update running manifest.

**Read**: Specified chapters + existing `continuity-manifest.md`
**Write**: Updated `continuity-manifest.md` + `story-so-far.md`
**Check**: New info against existing manifest, timeline consistency, character knowledge

`story-so-far.md` (~500 words max): major events, character emotional states, unresolved tensions, key relationships, physical state.

## Mode: FULL

Complete cross-chapter analysis.

**Read**: All chapters + character sheets + outline
**Write**: `continuity-notes.md` (always) + `fix-requests.md` (if blocking issues)
**Check**: Everything INCREMENTAL checks, plus cross-chapter voice drift, information flow (does a chapter reference something not yet established?)

## Mode: PATTERN

Novel-scale repetitive prose scan.

**Read**: All chapters
**Write**: `pattern-report.md`
**Check**: Overused words/phrases across chapters, repeated constructions, character tic fatigue, formulaic descriptions, structural repetition (same chapter opening/ending formula), AI-tell patterns (em dashes, "the way" connector, triplets, participial flooding)

**Severity**: HIGH (10+, near-identical, multiple chapters), MEDIUM (5-9, similar, 2-3 chapters), LOW (3-4, different contexts).

Note intentional repetition (thematic motifs, character catchphrases) in a "Patterns That Work" section.

## Mode: PATTERN_INCREMENTAL

Lightweight cross-chapter pattern check. Last 2-3 chapters only. No file written — inline YAML only. HIGH severity triggers fixes before continuing.

## Issue Classification

**BLOCKING** (must fix): Character after death, timeline contradictions, elapsed time mismatches, impossible knowledge, future references, name changes mid-novel.

**ADVISORY** (consider fixing): Physical description drift, location detail changes, voice drift, vague time references, repeated phrases.

## File Formats

See `references/manifest-format.md` for the continuity manifest template.
See `references/fix-request-format.md` for the fix request template.
