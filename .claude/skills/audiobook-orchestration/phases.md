# Audiobook Generation Phases

Detailed procedures for each phase of audiobook generation.

## Phase 1: Segmentation

For each chapter (or specified chapter range):

```
1. Spawn audiobook-segmenter agent:
   Task: audiobook-segmenter agent
   Prompt:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CAMPAIGN: {campaign}
   NOVEL_DIR: {playthrough}/novel
   CHAPTER: {N}
   VOICES_YAML: {playthrough}/novel/voices.yaml
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
   NOVEL_DIR: {playthrough}/novel
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
   ASSEMBLE CHAPTER
   CAMPAIGN: {campaign}
   NOVEL_DIR: {playthrough}/novel
   CHAPTER: {N}
   FORMAT: {output_format}
   QUALITY: {quality}
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
     output_path: {playthrough}/novel/chapter-01.mp3,
     duration_sec: 847.3,
     file_size_mb: 12.4
   }

4. Update state:
   chapters.{N}.status = complete
   chapters.{N}.output = chapter-01.mp3
```
