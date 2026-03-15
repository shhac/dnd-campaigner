# State Management and Special Modes

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

## Post-Compaction Recovery

If this skill is invoked after context compaction:

1. You are the orchestrator for audiobook generation
2. Read `campaigns/{campaign}/novel/chatterbox/audiobook-state.yaml`
3. Determine current state from the file
4. Resume the orchestration loop from the current chapter/phase
5. If unclear, report current state and ask user how to proceed
