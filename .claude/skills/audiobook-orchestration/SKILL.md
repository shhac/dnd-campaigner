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
    |
    +---> Spawn audiobook-segmenter agent
    |         - Parse chapter, detect voices
    |         - Create segment files
    |         - Return segment count + voices
    |
    +---> Spawn audiobook-generator agent
    |         - Generate WAV for each segment
    |         - Checkpoint after each segment
    |         - Return success/failure count
    |
    +---> Spawn audiobook-assembler agent
    |         - Concatenate WAVs
    |         - Apply crossfades + normalization
    |         - Encode to MP3
    |         - Return output path + duration
    |
    +---> Update state, report progress
    |
    v
Loop until all chapters complete
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

### Argument Parsing

```
campaign: first positional argument (required)
chapter_single: --chapter N (extract N as integer)
chapter_range: --chapters N-M (extract N and M as integers)
resume_mode: --resume flag present
force_mode: --force flag present
dry_run: --dry-run flag present
no_assemble: --no-assemble flag present
test_voices: --test-voices flag present
clean_mode: --clean flag present
parallel_level: --parallel N (extract N, default 1)
segment_only: --segment-only flag present
generate_only: --generate-only flag present
assemble_only: --assemble-only flag present
```

## Validation

### Prerequisites Check

1. **Campaign exists**: Check `campaigns/{campaign}/` directory exists
2. **Novel exists**: Check `campaigns/{campaign}/novel/` directory exists
3. **Chapters exist**: Check for `chapter-*.md` files in novel directory
4. **Voices config exists**: Check `campaigns/{campaign}/novel/voices.yaml` exists
5. **Voice samples exist**: Validate `.chatterbox-voices/` directory contains required samples

### Voice Sample Validation

Read `voices.yaml` and verify each referenced voice sample exists. The voices.yaml uses a namespaced format to support multiple TTS engines, with characters at the root level:

```yaml
# voices.yaml example (namespaced format)
narrator:
  chatterbox:
    voice: narrator-male

corwin-voss:
  piper:
    voice: en_US-ryan-high
    length_scale: 1.1
  chatterbox:
    voice: narrator-male
    gender: male
    exaggeration_offset: 0.05

seraphine:
  piper:
    voice: en_US-amy-medium
    length_scale: 1.0
  chatterbox:
    voice: narrator-female
    gender: female

tilda-brannock:
  piper:
    voice: en_US-amy-medium
    length_scale: 1.0
  chatterbox:
    voice: narrator-female
    gender: female
```

Note: A legacy format with a `characters:` wrapper is also supported for backwards compatibility.

For each voice referenced in `*.chatterbox.voice`, check:
- `.chatterbox-voices/{voice}.wav` exists
- File is non-empty (> 1KB)

If validation fails:
- List missing voice samples
- Suggest running `/setup-voices` if voices.yaml is missing
- Provide instructions for recording/obtaining samples

## State File Management

The state file tracks progress and enables resume:

```yaml
# campaigns/{campaign}/novel/chatterbox/audiobook-state.yaml
campaign: the-rot-beneath
started: 2024-01-15T10:00:00Z
last_updated: 2024-01-15T11:30:00Z

settings:
  format: mp3
  parallel: 1
  clean: false

# Source file checksums for change detection
source_hashes:
  voices_yaml: sha256:def456...

chapters:
  1:
    status: complete          # pending | segmenting | generating | assembling | complete | failed
    source_hash: sha256:abc123...
    segments_total: 45
    segments_generated: 45
    segments_failed: 0
    duration_sec: 847.3
    output: chapter-01.mp3

  2:
    status: generating
    source_hash: sha256:789xyz...
    segments_total: 52
    segments_generated: 28
    segments_failed: 0
    current_segment: 29

  3:
    status: pending
    segments_total: null
```

**Update state file after each significant step.**

## Test Voices Mode

When `--test-voices` is specified:

1. List all voice samples that will be used
2. For each unique voice:
   - Generate a short test phrase (5-10 words)
   - Play or save to temp file
3. Ask user to confirm voices sound acceptable
4. If not acceptable:
   - Identify problematic voices
   - Suggest adjustments (different sample, re-record)
5. Exit without full generation

### Test Voice Invocation

```
Task: audiobook-generator agent
Prompt:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: TEST_VOICES
CAMPAIGN: {campaign}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate test samples for all voices in voices.yaml.
Output to: campaigns/{campaign}/novel/chatterbox/voice-tests/
```

Present results to user:
```
Voice samples generated:

| Voice | Sample | Duration |
|-------|--------|----------|
| narrator-male | "The night air carried whispers..." | 3.2s |
| narrator-female | "The night air carried whispers..." | 3.4s |
| corwin-voss | "The night air carried whispers..." | 3.1s |

Listen to samples in: novel/chatterbox/voice-tests/

Do all voices sound acceptable?
1. Yes, proceed with generation
2. No, need adjustments (specify which voices)
3. Exit
```

## Dry Run Mode

When `--dry-run` is specified:

1. Parse all chapter files to count segments (without creating files)
2. Calculate estimated durations
3. Report plan without executing

```
Dry Run: Audiobook Generation Plan

Campaign: the-rot-beneath
Chapters: 1-5

| Chapter | Title | Est. Segments | Est. Duration |
|---------|-------|---------------|---------------|
| 1 | The Price of Answers | ~45 | ~14 min |
| 2 | Where Gods Cannot Hear | ~52 | ~17 min |
| 3 | Into the Rot | ~38 | ~12 min |
| 4 | What Waits Below | ~61 | ~20 min |
| 5 | The Reckoning | ~44 | ~14 min |

Total estimated: ~240 segments, ~77 minutes
Voice samples required: narrator-male, narrator-female, corwin-voss

Ready to proceed? (run without --dry-run)
```

## Phase 1: Segmentation

For each chapter (or specified chapter range):

```
1. Spawn audiobook-segmenter agent:
   Task: audiobook-segmenter agent
   Prompt:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CAMPAIGN: {campaign}
   CHAPTER: {N}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Agent:
   - Reads chapter-{NN}.md
   - Reads voices.yaml
   - Detects voice boundaries
   - Creates segment files in chatterbox/chapter-{N}/
   - Creates manifest.yaml
   - Returns status

3. Receive status:
   {
     status: success,
     segments_created: 47,
     voices_detected: [narrator-male, corwin-voss, seraphine],
     manifest_path: chatterbox/chapter-1/manifest.yaml
   }

4. Update state:
   chapters.{N}.status = segmented
   chapters.{N}.segments_total = 47

5. Validate segmentation:
   - Contiguous segment numbering
   - All voices have samples
   - Word count sanity check
```

If `--segment-only`, stop after all chapters segmented.

## Phase 2: Generation

For each chapter with segments:

```
1. Spawn audiobook-generator agent:
   Task: audiobook-generator agent
   Prompt:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MODE: GENERATE
   CAMPAIGN: {campaign}
   CHAPTER: {N}
   RESUME: {true if resume_mode and partially complete}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Agent:
   - Invokes chatterbox-audiobook.py generate
   - Monitors progress
   - Updates manifest with per-segment status
   - Returns status

3. Receive status:
   {
     status: success,
     segments_generated: 47,
     segments_failed: 0,
     duration_sec: 847.3
   }

4. Update state:
   chapters.{N}.status = generated
   chapters.{N}.segments_generated = 47
   chapters.{N}.duration_sec = 847.3

5. Handle failures:
   - If segments_failed > 0:
     - Log failed segments
     - Ask user: retry, skip, or abort
```

If `--generate-only`, stop after all chapters generated.

### Generation Progress Reporting

For long chapters, report progress periodically:

```
Chapter 2: Generating audio...
  [##########..........] 25/50 segments (50%)
  Elapsed: 8m 32s | Est. remaining: ~8m
```

## Phase 3: Assembly

For each chapter with generated audio:

```
1. Spawn audiobook-assembler agent:
   Task: audiobook-assembler agent
   Prompt:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CAMPAIGN: {campaign}
   CHAPTER: {N}
   CLEAN: {clean_mode}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Agent:
   - Invokes chatterbox-audiobook.py assemble
   - Applies crossfades and normalization
   - Encodes to MP3
   - Optionally cleans intermediate files
   - Returns status

3. Receive status:
   {
     status: success,
     output_path: campaigns/the-rot-beneath/novel/chapter-01.mp3,
     duration_sec: 847.3,
     file_size_mb: 12.4
   }

4. Update state:
   chapters.{N}.status = complete
   chapters.{N}.output = chapter-01.mp3
```

## Resume Mode

When `--resume` is specified:

1. Read `audiobook-state.yaml`
2. Determine last complete state for each chapter
3. Resume from appropriate phase:

```
For each chapter:
  if status == pending:
    Start from segmentation
  elif status == segmenting:
    Re-run segmentation (may have partial files)
  elif status == segmented or status == generating:
    Resume generation from current_segment
  elif status == generated or status == assembling:
    Re-run assembly
  elif status == complete:
    Skip (unless --force)
  elif status == failed:
    Ask user: retry or skip
```

## Force Mode

When `--force` is specified:

- Regenerate segments even if they exist
- Regenerate audio even if WAV files exist
- Re-assemble even if MP3 exists
- Useful for updating after voice sample changes

## Error Handling

### Segmentation Errors

| Error | Recovery |
|-------|----------|
| Parse error | Show error, ask user to fix chapter |
| Voice not in voices.yaml | Warn and use fallback narrator |

### Generation Errors

| Error | Recovery |
|-------|----------|
| Model OOM | Suggest reducing parallel, retry |
| Voice sample invalid | Skip segment, log error, continue |
| Segment fails 3x | Mark as failed, continue with others |

### Assembly Errors

| Error | Recovery |
|-------|----------|
| Missing WAV files | List missing, offer to regenerate |
| ffmpeg error | Show error output, suggest fix |

## Progress Reporting

### Per-Chapter Progress

```
Chapter {N}: {title}
  Phase: {segmenting|generating|assembling}
  Progress: {current}/{total} ({percent}%)
  Elapsed: {time}
  Est. remaining: {time}
```

### Overall Progress

```
Audiobook Generation Progress

| Chapter | Title | Status | Duration |
|---------|-------|--------|----------|
| 1 | The Price of Answers | Complete | 14:07 |
| 2 | Where Gods Cannot Hear | Generating (75%) | ~17:00 |
| 3 | Into the Rot | Pending | - |

Overall: 1/3 complete, ~31 min generated
```

## Completion Report

```
Audiobook generation complete!

Campaign: {campaign}
Chapters: {N}
Total duration: {HH:MM:SS}
Total size: {size} MB

Output files:
  - chapter-01.mp3 (14:07, 12.4 MB)
  - chapter-02.mp3 (17:23, 15.1 MB)
  - chapter-03.mp3 (12:45, 11.2 MB)

Location: campaigns/{campaign}/novel/

Quality notes:
  - Segments generated: {total}
  - Segments failed: {failed} (if any)
  - Voices used: {list}
```

## Post-Compaction Recovery

If this skill is invoked after context compaction:

1. You are the orchestrator for audiobook generation
2. Read `campaigns/{campaign}/novel/chatterbox/audiobook-state.yaml`
3. Determine current state from the file
4. Resume the orchestration loop from the current chapter/phase
5. If unclear, report current state and ask user how to proceed

## Directory Structure Reference

```
campaigns/{campaign}/novel/
├── chapter-01.md              # Source
├── chapter-01.mp3             # Output
├── chapter-02.md
├── chapter-02.mp3
├── ...
├── voices.yaml                # Voice mappings
└── chatterbox/                # Intermediate files
    ├── audiobook-state.yaml   # Progress tracking
    ├── chapter-1/
    │   ├── manifest.yaml      # Chapter metadata
    │   ├── segment-001.txt    # Text to speak
    │   ├── segment-001.yaml   # TTS settings
    │   ├── segment-001.wav    # Generated audio
    │   └── ...
    ├── chapter-2/
    │   └── ...
    └── voice-tests/           # Test voice samples
        ├── narrator-male.wav
        └── ...

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
- **Voice Config**: `campaigns/{campaign}/novel/voices.yaml`
- **Voice Samples**: `.chatterbox-voices/*.wav`
