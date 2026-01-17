---
description: Generate MP3 audiobook from novel chapters using Chatterbox TTS
argument-hint: <campaign> [--chapter N] [--chapters N-M] [--resume] [--force] [--dry-run] [--test-voices] [--clean] [--parallel N] [--segment-only] [--generate-only] [--assemble-only] [--no-assemble]
---

# /audiobook

Generate audiobook MP3 files from novelized campaign chapters using Chatterbox TTS.

## Overview

This command transforms your novelized campaign chapters into audio files. It uses Chatterbox TTS with voice samples configured in `voices.yaml`.

## Arguments

- `campaign` (required): Campaign name (e.g., `the-rot-beneath`)
- `--chapter N`: Process only chapter N
- `--chapters N-M`: Process chapters N through M (inclusive)
- `--resume`: Continue from last checkpoint (reads audiobook-state.yaml)
- `--force`: Regenerate existing segments even if they exist
- `--dry-run`: Show plan without generating audio
- `--test-voices`: Generate short voice samples for each character
- `--clean`: Remove all generated audio files and state
- `--parallel N`: I/O parallelism level for generation (default: 1)
- `--segment-only`: Run segmentation phase only, skip generation
- `--generate-only`: Run generation phase only, skip segmentation and assembly
- `--assemble-only`: Run assembly phase only (combine existing WAVs to MP3)
- `--no-assemble`: Generate segments but don't combine into final MP3

## Prerequisites

1. **Novelized chapters**: Run `/novelize {campaign}` first
2. **Voice configuration**: Run `/setup-voices {campaign}` to create `voices.yaml`
3. **Chatterbox TTS**: Must be installed and accessible

## Examples

```
/audiobook the-rot-beneath                    # Generate all chapters
/audiobook the-rot-beneath --chapter 3        # Generate chapter 3 only
/audiobook the-rot-beneath --chapters 1-5     # Generate chapters 1-5
/audiobook the-rot-beneath --resume           # Continue interrupted generation
/audiobook the-rot-beneath --dry-run          # Preview plan
/audiobook the-rot-beneath --test-voices      # Generate voice samples
/audiobook the-rot-beneath --quality high     # High quality output
/audiobook the-rot-beneath --clean            # Remove generated audio
```

## What Gets Created

```
campaigns/{campaign}/audiobook/
├── audiobook-state.yaml    # Progress tracking for resume
├── voice-samples/          # Test voice clips (if --test-voices)
│   ├── corwin-voss.mp3
│   └── ...
├── chapter-01.mp3          # Generated audio chapters
├── chapter-02.mp3
└── ...
```

---

## Instructions for Claude

Load the audiobook-orchestration skill to handle the actual work.

### Argument Parsing

```
campaign: first positional argument (required)
single_chapter: --chapter N (extract N as integer)
chapter_range: --chapters N-M (extract N and M as integers)
resume_mode: --resume flag present
dry_run: --dry-run flag present
test_voices: --test-voices flag present
output_format: --format value (default: mp3)
quality: --quality value (default: standard)
clean_mode: --clean flag present
```

### Validation

1. **Campaign exists**: Check `campaigns/{campaign}/` directory exists
2. **Novel exists**: Check `campaigns/{campaign}/novel/` directory exists (unless --clean)
3. **Chapters exist**: Check at least one `chapter-*.md` file exists (unless --clean)
4. **Voices configured**: Check `campaigns/{campaign}/novel/voices.yaml` exists (unless --clean)
5. **Resume mode**: If `--resume`, verify `audiobook/audiobook-state.yaml` exists

If validation fails:
- Campaign not found: List available campaigns
- Novel missing: Suggest running `/novelize` first
- Voices missing: Suggest running `/setup-voices` first
- State file missing for resume: Suggest starting fresh

### Load Skill

After argument parsing and validation, load the `audiobook-orchestration` skill:

```
Skill: audiobook-orchestration
```

Pass the parsed arguments to the skill for processing.
