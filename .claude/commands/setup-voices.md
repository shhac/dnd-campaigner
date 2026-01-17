---
description: Generate voices.yaml for novel TTS reading
argument-hint: <campaign-name>
---

# /setup-voices

Generate a `voices.yaml` file for a campaign's novel, mapping POV characters to Piper TTS voices with per-voice settings.

## Usage

```
/setup-voices {campaign-name}
```

## What This Does

1. Scans the campaign's novel chapters to identify POV characters
2. Looks up each character's gender from their character sheet
3. Creates `campaigns/{campaign}/novel/voices.yaml` with voice mappings and optimal settings

## Prerequisites

- Campaign must have a novel directory with chapters
- Characters should have character sheets in `party/` with gender or pronouns specified

---

## Instructions for Claude

### Step 1: Validate Campaign

Check that the campaign exists and has a novel:

```
campaigns/{campaign}/novel/
```

If no novel directory exists, inform the user they should run `/novelize {campaign}` first.

### Step 2: Find POV Characters

Scan all chapter files to extract unique POV characters:

```
campaigns/{campaign}/novel/chapter-*.md
```

Skip any files ending in `-draft.md`.

For each chapter, extract the `pov` field from the YAML frontmatter:
```yaml
---
pov: character-name
---
```

Collect unique POV character names.

### Step 3: Determine Voice and Settings for Each Character

For each POV character:

1. **Check character sheet** at `campaigns/{campaign}/party/{character}.md`
2. Look for gender indicators:
   - `Gender: Female` or `Gender: Male` in frontmatter or content
   - `Pronouns: she/her` or `Pronouns: he/him`
3. Assign voice and settings based on gender:

**Female characters:**
- voice: `en_US-amy-medium`
- length_scale: `1.0`
- sentence_silence: `0.3`

**Male characters:**
- voice: `en_US-ryan-high`
- length_scale: `1.1`
- sentence_silence: `0.4`

**Unknown gender (default to male):**
- voice: `en_US-ryan-high`
- length_scale: `1.1`
- sentence_silence: `0.4`

### Step 4: Generate voices.yaml

Create `campaigns/{campaign}/novel/voices.yaml` with this format:

```yaml
# Voice mapping for novel reading
# Maps POV character names to TTS engine-specific voice settings
#
# Namespaced format supports multiple TTS engines:
#   - piper: Piper TTS settings (voice name, speed, pauses)
#   - chatterbox: Chatterbox TTS settings (voice sample, gender)
#
# Available Piper voices (after running: source scripts/piper-env.sh):
#   - en_US-ryan-high (male, natural, 114MB)
#   - en_US-amy-medium (female, professional, 63MB)
#
# Piper Settings:
#   - voice: Piper voice model name
#   - length_scale: Speech speed (1.0 = default, higher = slower)
#   - sentence_silence: Pause between sentences in seconds
#
# Chatterbox Settings:
#   - voice: Voice sample name (e.g., narrator-male, narrator-female)
#   - gender: male or female (used for narrator selection)

{character-1}:
  piper:
    voice: {piper_voice}
    length_scale: {length_scale}
    sentence_silence: {sentence_silence}
  chatterbox:
    voice: narrator-{gender}
    gender: {gender}

{character-2}:
  piper:
    voice: {piper_voice}
    length_scale: {length_scale}
    sentence_silence: {sentence_silence}
  chatterbox:
    voice: narrator-{gender}
    gender: {gender}
```

### Step 5: Report Results

Display what was created:

```
## Voice Mapping Created

| Character | Gender | Voice | Speed | Pause |
|-----------|--------|-------|-------|-------|
| {name} | {gender} | {voice} | {length_scale} | {sentence_silence}s |
...

File: campaigns/{campaign}/novel/voices.yaml

To use: source scripts/piper-env.sh && read-novel {campaign}
```

### Edge Cases

- **No chapters found**: Error - novel has no chapters yet
- **No POV in chapter**: Skip that chapter, warn user
- **Character sheet missing**: Use default voice (male), note in output
- **File already exists**: Ask user if they want to overwrite
