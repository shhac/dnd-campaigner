---
name: name-generator
description: Generate varied, original names for D&D characters, places, and factions. Use when creating new NPCs, locations, or organizations to ensure variety and avoid duplicates. Uses phonetic palettes tied to campaign cultures, not D&D race defaults.
---

# Name Generator Skill

Generate names that feel unique, memorable, and phonetically distinct — both within a campaign and across campaigns.

## Core Principles

1. **Palettes over races** — Names come from cultural/regional phonetic systems, not D&D race stereotypes
2. **Check existing names** before generating (avoid duplicates)
3. **The Gandalf Test** — Can you remember the name after hearing it once? Does it sound like any other character? If you cover it and try to recall it 30 seconds later, do you get it right?
4. **Vary everything** — First letters, syllable counts, vowel/consonant density, stress patterns

## Before Generating

1. Check if the campaign has a `naming-palette.md` — if so, use those palettes
2. Check existing names in the campaign to avoid duplicates and track patterns:
   ```
   campaigns/{campaign}/party/*.md
   campaigns/{campaign}/npcs/*.md
   campaigns/{campaign}/locations/*.md
   campaigns/{campaign}/factions/*.md
   ```
3. Note the distribution: starting letters used, syllable counts, phonetic density

## Campaign Phonetic Identity

Each campaign should have 1-2 assigned palettes documented in `campaigns/{campaign}/naming-palette.md`. This ensures every campaign sounds phonetically distinct from every other.

At campaign creation, assign palettes. The palette determines how ALL names in the campaign sound — characters, places, factions, items. Different cultures within the campaign can use different palettes, but the set is fixed.

## Phonetic Palettes

### Palette: Kartvelian (Georgian-inspired)
**Feel:** Craggy, dense, percussive. Good for mountain/underground settings.
- Initial consonant clusters: ts-, mk-, sv-, dz-, gv-
- End names in -i, -a, -uri
- Vowels: mostly a, e, i
- Surnames with -dze (son of) or -shvili (child of)
- Examples: Tsikara, Mkvari, Dzevani, Svela, Gvirokha
- Places: Mkhedrioni, Tsveri, Gvardza

### Palette: Euskaran (Basque-inspired)
**Feel:** Ancient, pre-Indo-European, slightly alien but warm. Good for isolated/old cultures.
- Sibilant digraphs: tx, tz, ts
- End in -a, -e, -ko, -ren, -txe
- No initial r-
- Compound suffixes: -berri (new), -gorri (red), -zuri (white), -alde (near)
- Examples: Itzalko, Amattsa, Zuriene, Txaraldi, Goiztia
- Places: Aritzberri, Menditzar, Goialde

### Palette: Suomi (Finnish-inspired)
**Feel:** Spacious, melancholic, crisp. Good for subarctic/silent/magical settings.
- Vowel harmony: front vowels (y, o, a) or back vowels don't mix within a name
- Double vowels (aa, ii, uu) and consonants (kk, tt, pp)
- No initial consonant clusters
- End in -nen, -la, -sto, -va, -ri
- Examples: Aatturi, Kyosti, Hiileva, Tuurikka, Neijala
- Places: Kaurilampi, Vuotikko, Hiidenmaa

### Palette: Yoruba (West African-inspired)
**Feel:** Musical, flowing, rhythmic. Good for riverlands/trading cultures.
- Every syllable is CV or V (all open syllables)
- Accent marks suggest tone
- gb- is a single labial-velar stop (signature sound)
- Names carry meaning (circumstance, aspiration)
- Examples: Adukole, Gbemisoke, Olufade, Titilayo, Iremide
- Places: Ogunode, Alatise, Igbodara

### Palette: Khalkha (Mongolian-inspired)
**Feel:** Vast, guttural, powerful. Good for steppe/nomadic cultures.
- Vowel harmony (back or front sets)
- Kh- onset (velar fricative)
- Compound names from meaningful roots: altan (gold), munkh (eternal), batu (firm)
- Allow final clusters: -lg, -nd, -nkh
- Examples: Khutulun, Batumunkh, Odtsetseg, Temulgar, Sarangol
- Places: Kharaguur, Erdenebaatar, Burkhant

### Palette: Aotearoa (Maori-inspired)
**Feel:** Oceanic, resonant, long. Good for coastal/island/water settings.
- Only 10 consonants: h, k, m, n, ng, p, r, t, w, wh
- All syllables open (CV or V)
- Long vowels: aa, ee, ii, oo, uu
- 3-5 syllable names common
- Examples: Tukimata, Wairehu, Ngapuhi, Korimako, Hinewai
- Places: Raukumara, Wharepuni, Taumata

### Palette: Tamil (Dravidian-inspired)
**Feel:** Precise, rhythmic, warm. Good for ancient/scholarly/contractual civilizations.
- Retroflex consonants (doubled: tt, nn, ll)
- Endings: -an (masc), -ai (fem), -am (place)
- Initial vowels common
- Gemination is meaningful
- Examples: Arulkanni, Ilavarasi, Tamilventhan, Kovindai, Uttaman
- Places: Marudhalai, Karunagam, Thiruvennam

### Palette: Quechua (Andean-inspired)
**Feel:** High-altitude, sharp, mineral. Good for volcanic/underground/stone settings.
- Only 3 vowels: a, i, u
- Ejective stops: p', t', k', ch' (apostrophe marks)
- Uvular q (deeper than k)
- Nature roots: inti (sun), killa (moon), rumi (stone), yaku (water)
- Examples: Q'illari, Tupaq'inti, Sach'akusi, Warik'uchu, Rit'isqa
- Places: Qusqupata, Rumich'aka, Intiwatana

### Palette: Amharic (Ethiopian Semitic-inspired)
**Feel:** Ancient, resonant, layered. Good for arcane/religious/ancient civilizations.
- Three-consonant roots: k-t-b, m-l-k
- Vowels inserted between consonants in patterns
- Gemination (doubled consonants) changes meaning
- Endings: -u (masc), -a (fem), -awi (adj)
- Examples: Takkele, Birukta, Dessalegn, Hiwottu, Melkamu
- Places: Debre Tessam, Gonderawi, Selkasa

### Palette: Creole (Constructed multicultural)
**Feel:** Lived-in, layered, port-city grime. Good for cosmopolitan/trade/diverse settings.
- Combine Romance/Latin roots with non-Indo-European suffixes
- Class affects naming: short worn-down names for commoners, baroque for elites
- Nicknames and use-names common
- Examples: Verdakho, Lumetzari, Currodze, Pellinaste, Motumba-Krel
- Places: Port Sulevari, Gorundtzal, The Merkavikha

## Distinctiveness Checks

After generating candidate names, verify:

1. **First-letter uniqueness** — No two major characters share a starting letter
2. **Syllable count variety** — Mix 2, 3, 4+ syllable names
3. **Phonetic density** — Mix consonant-heavy and vowel-rich names
4. **The Gandalf Test** — Memorable after one hearing? Distinct from all other names?
5. **Cross-campaign check** — Doesn't sound like a character from another campaign

## Techniques (from published authors)

- **Le Guin's method:** Generate by sound first, rationalize meaning second. Names should feel right subconsciously before they mean anything.
- **Jemisin's method:** Names encode social information. What does a name tell you about caste, profession, or community? Build naming *systems*, not just names.
- **Mieville's method:** Multicultural settings have creole names. Port cities sound different from mountain villages. Elite names sound different from street names.

## Generation Process

1. **Check palette** — Read `naming-palette.md` if it exists
2. **Check existing** — Read campaign files for current names
3. **Generate on-palette** — Use the assigned palette's rules
4. **Run distinctiveness checks**
5. **Offer 3-5 options** with pronunciation hints and feel notes

## Anti-Patterns

- Anglo-Germanic compound surnames as default (Harrowmoor, Duskhollow, Shadowmere)
- The -eth/-ath cluster for everything "exotic"
- Tolkien race stereotypes (elves = flowing, dwarves = harsh)
- "The [Adjective] [Noun]" for every faction name
- All names converging on the same phonetic density
