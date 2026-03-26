---
name: audiobook-orchestration
description: Use when generating audiobooks from novel chapters via the /audiobook command. Tracks progress, spawns agents for segmentation/generation/assembly phases, handles user confirmations, and survives context compaction by reading state from files.
---

# Audiobook Orchestration Skill

Lightweight coordination layer for the audiobook generation pipeline. This skill guides the main conversation through spawning agents, tracking progress, and handling user interactions.

## When This Skill Activates

Use this skill when:
- User invokes `/audiobook` command
- Resuming audiobook generation after interruption
- Context has been compacted during a long generation session

## Quick Reference: The Orchestration Loop

```
/audiobook {campaign} [options]
    |
    v
Parse arguments & validate prerequisites
    |
    v
Create/load audiobook-state.yaml
    |
    v
For each chapter N:
    +---> Phase 1: Segmentation (audiobook-segmenter agent)
    +---> Phase 2: Generation (audiobook-generator agent)
    +---> Phase 3: Assembly (audiobook-assembler agent)
    +---> Update state, report progress
    |
    v
Final report
```

## Command Arguments

```
/audiobook {campaign} [options]

Options:
  --chapter N          Process only chapter N
  --chapters N-M       Process chapters N through M
  --resume             Continue from last checkpoint
  --force              Regenerate existing segments
  --dry-run            Show plan without generating
  --no-assemble        Generate segments only (skip MP3 creation)
  --test-voices        Preview voice samples before full generation
  --clean              Remove intermediate files after assembly
  --parallel N         I/O parallelism level (default: 1)

Phase Control:
  --segment-only       Run segmentation phase only
  --generate-only      Run generation phase only (requires segments)
  --assemble-only      Run assembly phase only (requires WAV files)
```

## Validation

### Prerequisites Check

1. **Campaign exists**: Check `campaigns/{campaign}/` directory exists
2. **Novel exists**: Check `{playthrough}/novel/` directory exists
3. **Chapters exist**: Check for `chapter-*.md` files in novel directory
4. **Voices config exists**: Check `{playthrough}/novel/voices.yaml` exists
5. **Voice samples exist**: Validate `.chatterbox-voices/` directory contains required samples

### Voice Sample Validation

Read `voices.yaml` and verify each referenced voice sample exists. The voices.yaml uses a namespaced format to support multiple TTS engines, with characters at the root level:

```yaml
# voices.yaml example (namespaced format)
narrator:
  chatterbox:
    voice: narrator-male

corwin-voss:
  chatterbox:
    voice: narrator-male
    gender: male
    exaggeration_offset: 0.05
```

For each voice referenced in `*.chatterbox.voice`, check:
- `.chatterbox-voices/{voice}.wav` exists
- File is non-empty (> 1KB)

If validation fails:
- List missing voice samples
- Suggest running `/setup-voices` if voices.yaml is missing
- Provide instructions for recording/obtaining samples

## Progress and Completion Reporting

### Per-Chapter Progress

```
Chapter {N}: {title}
  Phase: {segmenting|generating|assembling}
  Progress: {current}/{total} ({percent}%)
  Elapsed: {time}
  Est. remaining: {time}
```

### Completion Report

```
Audiobook generation complete!

Campaign: {campaign}
Chapters: {N}
Total duration: {HH:MM:SS}
Total size: {size} MB

Output files:
  - chapter-01.mp3 (14:07, 12.4 MB)
  - chapter-02.mp3 (17:23, 15.1 MB)
```

## Detailed Procedures

Load the relevant sub-file based on what you need:

| Procedure | File | When to Load |
|-----------|------|-------------|
| Phase details (segmentation, generation, assembly) | [phases.md](phases.md) | Running any phase |
| State management, resume, force, dry-run, test-voices, errors | [state-and-modes.md](state-and-modes.md) | Managing state or using special modes |
| Voice sample reference (available samples, creation) | [voice-samples.md](voice-samples.md) | Setting up or troubleshooting voice samples |

## Directory Structure Reference

```
{playthrough}/novel/
├── chapter-01.md              # Source
├── chapter-01.mp3             # Output
├── voices.yaml                # Voice mappings
└── chatterbox/                # Intermediate files
    ├── audiobook-state.yaml   # Progress tracking
    ├── chapter-1/
    │   ├── manifest.yaml      # Chapter metadata
    │   ├── segment-001.txt    # Text to speak
    │   ├── segment-001.yaml   # TTS settings
    │   ├── segment-001.wav    # Generated audio
    │   └── ...
    └── voice-tests/           # Test voice samples

.chatterbox-voices/            # Voice samples (repo-level)
├── narrator-male.wav
├── narrator-female.wav
└── {character}.wav
```

## Related Agents

- **audiobook-segmenter**: Parse chapters and create segment files
- **audiobook-generator**: Generate WAV files from segments
- **audiobook-assembler**: Combine WAVs into final MP3

## Related Files

- **CLI Tool**: `scripts/chatterbox-audiobook.py`
- **Voice Config**: `{playthrough}/novel/voices.yaml`
- **Voice Samples**: `.chatterbox-voices/*.wav`
