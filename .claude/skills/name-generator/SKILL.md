---
name: name-generator
description: Generate varied, original names for D&D characters, places, and factions. Use when creating new NPCs, locations, or organizations to ensure variety and avoid duplicates. Uses phonetic palettes tied to campaign cultures, not D&D race defaults.
---

# Name Generator Skill

Generate names that feel unique, memorable, and phonetically distinct — both within a campaign and across campaigns.

## Core Principles

1. **Palettes over races** — Names come from cultural/regional phonetic systems, not D&D race stereotypes
2. **Check existing names** before generating (avoid duplicates)
3. **The Gandalf Test** — Can you remember the name after hearing it once? Does it sound like any other character?
4. **Vary everything** — First letters, syllable counts, vowel/consonant density, stress patterns

## Before Generating

1. Check if the campaign has a `naming-palette.md` — if so, use those palettes
2. Check existing names in the campaign to avoid duplicates:
   ```
   campaigns/{campaign}/party/*.md
   campaigns/{campaign}/npcs/*.md
   campaigns/{campaign}/locations/*.md
   campaigns/{campaign}/factions/*.md
   ```
3. Note the distribution: starting letters used, syllable counts, phonetic density

## Generation Process

1. **Check palette** — Read `naming-palette.md` if it exists
2. **Check existing** — Read campaign files for current names
3. **Generate on-palette** — Use the assigned palette's rules (see [palettes.md](palettes.md))
4. **Run distinctiveness checks** (see below)
5. **Offer 3-5 options** with pronunciation hints and feel notes

## Distinctiveness Checks

After generating candidate names, verify:

1. **First-letter uniqueness** — No two major characters share a starting letter
2. **Syllable count variety** — Mix 2, 3, 4+ syllable names
3. **Phonetic density** — Mix consonant-heavy and vowel-rich names
4. **The Gandalf Test** — Memorable after one hearing? Distinct from all other names?
5. **Cross-campaign check** — Doesn't sound like a character from another campaign

## Techniques (from published authors)

- **Le Guin's method:** Generate by sound first, rationalize meaning second
- **Jemisin's method:** Names encode social information — build naming *systems*, not just names
- **Mieville's method:** Multicultural settings have creole names. Port cities sound different from mountain villages.

## Anti-Patterns

- Anglo-Germanic compound surnames as default (Harrowmoor, Duskhollow, Shadowmere)
- The -eth/-ath cluster for everything "exotic"
- Tolkien race stereotypes (elves = flowing, dwarves = harsh)
- "The [Adjective] [Noun]" for every faction name
- All names converging on the same phonetic density

## Detailed Reference

- For all 10 phonetic palettes with rules and examples, see [palettes.md](palettes.md)
