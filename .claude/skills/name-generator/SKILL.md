---
name: name-generator
description: Generate varied, original names for D&D characters, places, and factions. Use when creating new NPCs, locations, or organizations to ensure variety and avoid duplicates.
---

# Name Generator Skill

Use this skill when creating names for characters, places, or things to ensure variety and originality.

## Core Principles

1. **Avoid common fantasy clichés** unless the setting calls for them
2. **Check existing names** in the campaign to prevent duplicates
3. **Match the culture/race/setting** - an elven name should feel different from a dwarven one
4. **Vary phonetic patterns** - don't let all names start with the same letter or follow the same rhythm

## Before Generating a Name

Check existing names in the campaign:
```
campaigns/{campaign}/party/*.md      # PC names
campaigns/{campaign}/npcs/*.md       # NPC names
campaigns/{campaign}/locations/*.md  # Place names
campaigns/{campaign}/factions/*.md   # Organization names
```

Avoid duplicates unless the user explicitly wants to reuse a character from another campaign.

## Name Generation Approaches

### For Character Names

**Consider:**
- Race (elf, dwarf, human, tiefling, etc.)
- Cultural background within that race
- Social class (noble vs commoner naming conventions)
- Region of origin

**Techniques:**
1. **Phonetic blending**: Combine syllables that "feel" right for the culture
2. **Meaning-based**: Choose words/concepts, then stylize them
3. **Historical inspiration**: Borrow from real-world cultures that match the vibe, then alter
4. **Sound symbolism**: Harsh consonants for warriors, flowing vowels for diplomats

### By Race (D&D defaults)

| Race | Sound Profile | Examples of Style |
|------|---------------|-------------------|
| Elf | Flowing, vowel-heavy, musical | Ae-, -iel, -wen, -lor |
| Dwarf | Hard consonants, short syllables | -in, -ur, -grim, Th-, Br- |
| Human | Varies by region/culture | Match to setting's analogue |
| Halfling | Warm, homey, sometimes doubled | -o, -a, -wise, -bottom |
| Tiefling | Virtue/vice names, or infernal-tinged | Concept words, -us, -ia |
| Orc/Half-orc | Guttural, strong stops | -gash, -krul, Gr-, Ur- |
| Dragonborn | Clan name + personal, draconic feel | -asar, -inn, -ax |
| Gnome | Playful, often long with nicknames | Multiple names, diminutives |
| Aasimar | Celestial, virtue-inspired | -ael, -iel, virtue names (Grace, Valor) |
| Genasi | Element-influenced | Fire: harsh (Ember, Ash), Water: flowing (Wave, Mist), Earth: solid (Stone, Clay), Air: light (Breeze, Zephyr) |

### For Place Names

**Techniques:**
1. **Descriptive compound**: What it looks like + geographic feature (Redcliff, Shadowmere)
2. **Historical**: Named after founder or event (Thorn's Landing, Dragonfall)
3. **Corrupted old name**: Ancient word that's been worn down by use
4. **Functional**: What happens there (Markethold, Crossways)

### For Organizations/Factions

**Techniques:**
1. **The [Adjective] [Noun]**: The Silver Hand, The Broken Crown
2. **[Noun] of [Concept]**: Order of the Flame, Guild of Shadows
3. **Simple and ominous**: The Syndicate, The Circle, The Accord
4. **Acronym or code name**: Groups that hide their true nature

## Avoiding Repetition

Track patterns you've already used in this campaign:

- Starting letters used for major characters
- Syllable patterns (avoid all names being 2 syllables)
- Sound families (if you have Grok, don't add Grak, Grum, Grax)

**Intentional echoes are fine** - related characters (siblings, clan members) might share naming elements.

## Reusing Characters Across Campaigns

If the user wants to bring back a character from another campaign:
1. Confirm this is intentional
2. Note the connection in the character file
3. Consider whether they're the same person or a "variant"

## Generation Process

1. **Ask context**: Race, culture, role, any preferences?
2. **Check existing**: Read campaign files for current names
3. **Generate options**: Offer 3-5 names with brief notes on feel/meaning
4. **Let user choose**: Or generate more if none fit

## Example Output

> For your elven ranger, here are some options:
>
> - **Faelindra** - "spirit wanderer" feel, soft and mysterious
> - **Thalion** - more masculine edge, Sindarin-inspired
> - **Whisperwind** (as surname/epithet) - earned name style
> - **Caelith** - gender-neutral, slightly unusual
> - **Miravyn** - musical, suggests grace
>
> Current party has: Grimjaw (hard G), Sera (S), Theron (Th)
> I avoided those starting sounds for variety.

## Don't Do This

- Don't default to overused names (Legolas-adjacent, Gandalf-like)
- Don't make every NPC name sound the same
- Don't ignore the existing name palette in the campaign
- Don't generate without considering race/culture fit
