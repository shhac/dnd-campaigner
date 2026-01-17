---
description: Convert campaign sessions into novel chapters
argument-hint: <campaign> [--auto] [--resume] [--fresh] [--skip-publisher] [--review-each] [--dry-run] [--append] [--chapter N]
---

# /novelize

Convert campaign sessions into episodic novel chapters with editorial review.

## Overview

This command transforms your D&D campaign's decision logs and character journals into polished prose fiction. The novelization pipeline includes:

1. **Planning** - Outline creation with tone selection
2. **Writing** - Chapter drafts from campaign sources
3. **Editing** - Prose quality improvements
4. **Continuity** - Consistency checking across chapters
5. **Fixing** - Addressing blocking issues
6. **Publisher Review** - Reader experience assessment
7. **Final Assembly** - Metadata and table of contents

## Arguments

- `campaign` (required): Campaign name (e.g., `the-rot-beneath`)
- `--auto`: Automatic mode - pause only for voice lock and blocking issues
- `--resume`: Continue from last checkpoint (reads novelization-state.yaml)
- `--fresh`: Start over, archiving any existing novel
- `--skip-publisher`: Skip the publisher review phase
- `--review-each`: Pause after each chapter for user review
- `--dry-run`: Show plan without writing files
- `--append`: Extend existing novel with new content from decision-log
- `--chapter N`: Regenerate only chapter N

## Examples

```
/novelize the-rot-beneath                    # Interactive mode with all checkpoints
/novelize the-rot-beneath --auto             # Auto mode (voice lock + blocking only)
/novelize the-rot-beneath --resume           # Continue interrupted session
/novelize the-rot-beneath --fresh --auto     # Start over, automatic
/novelize the-rot-beneath --skip-publisher   # Skip reader experience review
/novelize the-rot-beneath --review-each      # Pause after every chapter
/novelize the-rot-beneath --dry-run          # Preview plan only
/novelize the-rot-beneath --append           # Add new chapters from recent sessions
/novelize the-rot-beneath --chapter 3        # Regenerate only chapter 3
```

## What Gets Created

```
campaigns/{campaign}/novel/
├── outline.md                 # Chapter plan with progress tracking
├── chapter-01.md              # Final edited chapter
├── chapter-02.md
├── ...
├── continuity-manifest.md     # Running tracker of names, descriptions, timeline
├── continuity-notes.md        # Full continuity report
├── publisher-feedback.md      # Reader experience assessment
├── metadata.yaml              # Final metadata
├── table-of-contents.md       # Final TOC
├── novelization-state.yaml    # Progress tracking for resume
└── drafts/                    # Archived intermediate files
    ├── chapter-01-draft.md    # Original drafts (pre-editing)
    ├── chapter-02-draft.md
    ├── ...
    ├── fix-requests.md        # Corrections needed (if any)
    └── fix-requests-approved.md  # User-approved corrections
```

Note: During processing, draft files are created at the root level. Upon completion, they are archived to the `drafts/` subdirectory.

## Checkpoints

| Checkpoint | When | Can Skip? |
|------------|------|-----------|
| Outline Approval | After Phase 1 | No |
| Voice Lock | After Chapter 1 edited | No (critical) |
| Continuity Review | After Phase 3 | No |
| Publisher Review | After Phase 5 | Yes (--skip-publisher) |

---

## Instructions for Claude

You are the **orchestrator** for the novelization pipeline. Your job is to:
- Parse arguments and validate prerequisites
- Spawn agents and relay their status to the user
- Manage checkpoints and user decisions
- Track progress in state file
- **NOT** read source content (agents do that)
- **NOT** receive chapter content back (agents write directly)

### Context Efficiency Rules

**CRITICAL**: These rules keep orchestrator context small.

- **DO NOT** read `decision-log.md`, character sheets, or journals
- **DO NOT** read chapter content from agents' output
- **DO** track progress via `novelization-state.yaml`
- **DO** relay status messages to user
- **DO** handle checkpoint interactions

Agents are self-sufficient. They read their own sources and write their own files.

### Argument Parsing

```
campaign: first positional argument (required)
auto_mode: --auto flag present
resume_mode: --resume flag present
fresh_mode: --fresh flag present
skip_publisher: --skip-publisher flag present
review_each: --review-each flag present
dry_run: --dry-run flag present
append_mode: --append flag present
single_chapter: --chapter N (extract N as integer)
```

### Validation

1. **Campaign exists**: Check `campaigns/{campaign}/` directory exists
2. **Decision-log exists**: Check `campaigns/{campaign}/decision-log.md` exists
3. **Resume mode**: If `--resume`, verify `novel/novelization-state.yaml` exists

If validation fails:
- Campaign not found: List available campaigns
- Decision-log missing: Explain it's required
- State file missing for resume: Suggest starting fresh

### Dry Run Mode

If `--dry-run`:
1. Spawn novelizer-planner with DRY_RUN header:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MODE: PLAN
   DRY_RUN: true
   CAMPAIGN: {campaign}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```
2. Display outline summary to user
3. Show estimated chapter count and word count
4. **Do not write any files** - the planner should only return the plan without creating outline.md
5. Exit

### Append Mode

If `--append`:
1. **Prerequisites**: Existing `novel/outline.md` and at least one chapter must exist
2. **Detect new content**: Compare decision-log.md against existing outline to find new sessions/events
3. **Extend outline**:
   - Spawn novelizer-planner with APPEND header:
     ```
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MODE: PLAN
     APPEND: true
     CAMPAIGN: {campaign}
     EXISTING_CHAPTERS: {N}
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ```
   - Planner reads existing outline and decision-log, adds new chapters starting at N+1
4. **Write only new chapters**: Skip chapters 1 through N, write N+1 onwards
5. **Continuity**: Run INCREMENTAL continuity on new chapters + last existing chapter (chapter N)
   - This ensures new content connects properly to existing content
6. **State**: Update state file to include new chapters, preserve existing chapter status

### Single Chapter Regeneration

If `--chapter N`:
1. **Prerequisites**: Existing `novel/outline.md` must exist with chapter N defined
2. **Regenerate chapter N only**:
   - Spawn novelizer-writer for chapter N
   - Spawn novelizer-editor for chapter N
3. **Continuity check**:
   - Run INCREMENTAL continuity on chapter N and its neighbors (N-1, N, N+1)
   - This catches issues at chapter boundaries
4. **No outline changes**: Uses existing outline, does not modify other chapters
5. **Use case**: Fixing individual chapters without full re-run

### Fresh Mode / Archive Behavior

If `--fresh` and `novel/` exists:
1. Create timestamp: `YYYYMMDD-HHMMSS`
2. Create archive: `novel/archive-{timestamp}/`
3. Move all existing files to archive
4. Proceed with fresh novelization

### State File Management

The state file tracks progress and enables resume:

```yaml
# novelization-state.yaml
campaign: the-rot-beneath
started: 2024-01-15T10:30:00Z
last_updated: 2024-01-15T11:45:00Z

phase: writing  # planning, writing, continuity, fixing, publisher, assembly
current_chapter: 3

chapters:
  1: { draft: complete, edited: complete, continuity: checked }
  2: { draft: complete, edited: complete, continuity: checked }
  3: { draft: in_progress, edited: pending, continuity: pending }
  ...

validation: passed  # pending, passed, or failed

voice_lock: passed  # pending, passed, or failed:{attempt_count}
continuity:
  incremental_checks: [2]
  last_checked_chapter: 2  # highest chapter included in any incremental check
  full_check: pending
  blocking_issues: 0
  advisory_issues: 0

fix_cycles: 0  # track fix/re-verify cycles (max 3)

publisher_review: pending

drafts_archived: false  # true after Phase 6 archival
```

**Update state file after each significant step.**

---

## Orchestration Flow

### Phase 1: Planning

```
1. Spawn novelizer-planner:
   Task prompt:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MODE: PLAN
   CAMPAIGN: {campaign}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Receive status (outline summary, tone, chapter count)

3. CHECKPOINT: Outline Approval
   - Show user: tone, chapter titles, POV assignments
   - Auto mode: approve automatically
   - Manual mode: ask for approval or changes
   - If changes requested: re-run PLAN with user notes

4. Update state: phase=validation, create chapter entries
```

### Phase 1.5: Validation

After outline approval, validate that the plan is coherent before writing begins.

```
1. Spawn novelizer-planner:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MODE: VALIDATE
   CAMPAIGN: {campaign}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Validation checks:
   - POV character exists in campaign for each chapter
   - Timeline makes sense (no backwards jumps without reason)
   - All major decision-log events are covered
   - Chapter scope is reasonable (not too much/little per chapter)

3. If validation fails:
   - Show issues to user
   - Ask: "Approve fixes to outline?" or "Adjust manually?"
   - If fixes approved: re-run PLAN with fix notes
   - If manual: allow user to specify changes, re-run PLAN

4. Update state: validation = passed, phase = writing
```

### Phase 2: Writing + Editing (per chapter)

For each chapter N:

```
2a. Write Draft
    Spawn novelizer-writer:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    CAMPAIGN: {campaign}
    CHAPTER: {N}
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Receive status: word count, scenes covered
    Update state: chapters.{N}.draft = complete

2b. Edit Draft
    Spawn novelizer-editor:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    CAMPAIGN: {campaign}
    CHAPTER: {N}
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Receive status: changes made, word count delta
    Update state: chapters.{N}.edited = complete

2c. Voice Lock (Chapter 1 only)
    CHECKPOINT: Voice Lock
    - Read first 500 words of chapter-01.md (this is allowed - it's a sample)
    - Present to user: "Does this voice feel right?"
    - If no:
      - Ask for feedback (e.g., "too formal", "more gritty")
      - Re-run WRITE and EDIT for chapter 1 with VOICE_FEEDBACK header:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        CAMPAIGN: {campaign}
        CHAPTER: 1
        VOICE_FEEDBACK: "more gritty, less formal"
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      - Max 3 attempts; then offer "provide style reference" option
    - Update state: voice_lock = passed

2d. Per-Chapter Review (if --review-each)
    - Show user: chapter title, word count, any editor concerns
    - Ask: approve, request regeneration, or skip

2e. Incremental Continuity (prevent dangling unchecked chapters)

    **Trigger Logic** - run INCREMENTAL continuity when ANY of these are true:
    - Current chapter number is even (2, 4, 6, 8...)
    - This is the final chapter being written
    - `chapters_since_last_check >= 2` (catches edge cases)

    Track in state: `continuity.last_checked_chapter` (the highest chapter included in any check)

    **Calculate chapters to check**:
    - Include all chapters from `last_checked_chapter + 1` to current chapter
    - Always include at least the current chapter and its immediate predecessor

    Example: If last_checked_chapter=4 and current=7, check chapters [5, 6, 7]

    Spawn novelizer-continuity (INCREMENTAL mode):
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    MODE: INCREMENTAL
    CAMPAIGN: {campaign}
    CHAPTERS: [{chapters to check}]
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Receive status: blocking issues found, manifest updates
    Update state: continuity.incremental_checks, continuity.last_checked_chapter

    If blocking issues found in incremental check:
    - Alert user immediately
    - Go to Phase 4 (Fix) before continuing
```

### Phase 3: Full Continuity Check

```
1. Spawn novelizer-continuity (FULL mode):
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MODE: FULL
   CAMPAIGN: {campaign}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Receive status: blocking count, advisory count, issue summaries

3. Update state: continuity.full_check = complete, issue counts

4. CHECKPOINT: Continuity Review
   - Show user: blocking issues (must fix), advisory issues (optional)
   - For advisory: ask which to address (enter numbers, 'all', or 'none')

5. Create fix-requests-approved.md:
   Combine all BLOCKING issues + user-selected ADVISORY issues:

   ```markdown
   # Approved Fix Requests

   ## Blocking Issues (Auto-Included)

   ### Issue B1: [Title]
   - **Chapter**: N
   - **Type**: BLOCKING
   - **Description**: [what's wrong]
   - **Fix**: [what to change]

   ### Issue B2: [Title]
   ...

   ## Advisory Issues (User-Selected)

   ### Issue A3: [Title]
   - **Chapter**: N
   - **Type**: ADVISORY
   - **Description**: [what's wrong]
   - **Fix**: [what to change]

   ...
   ```
```

### Phase 4: Fix Issues (if any)

For each chapter with approved fixes:

```
1. Spawn novelizer-fixer:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CAMPAIGN: {campaign}
   CHAPTER: {N}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Receive status: fixes applied

2. Re-run editor on fixed chapter:
   Spawn novelizer-editor for chapter N

3. Re-verify fixed chapters (INCREMENTAL continuity):
   After all fixes applied and re-edited, run INCREMENTAL continuity
   on the fixed chapters to verify fixes didn't introduce new issues.

   Spawn novelizer-continuity (INCREMENTAL mode):
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MODE: INCREMENTAL
   CAMPAIGN: {campaign}
   CHAPTERS: [{fixed chapter numbers}]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. If new BLOCKING issues found:
   - Increment fix_cycles in state
   - If fix_cycles < 3: repeat Phase 4 (fix, edit, verify)
   - If fix_cycles >= 3: mark affected chapters as "needs manual review"

   **Error Recovery (fix_cycles >= 3):**
   - Store failed chapters in state: `failed_fix_chapters: [N, M, ...]`
   - Display warning to user:
     ```
     ⚠️  Fix cycle limit reached for chapter(s): [N, M]
     These chapters still have BLOCKING issues after 3 fix attempts.
     ```
   - In auto mode: warn and continue to Phase 5
   - In manual mode: ask user whether to continue or pause for manual fixes
   - Continue processing remaining chapters (don't halt entire pipeline)
   - At final completion, list all chapters needing manual review

5. Update state: fix_cycles, chapters.{N}.continuity = checked
```

### Phase 5: Publisher Review

Skip if `--skip-publisher`.

```
1. Spawn novelizer-publisher:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CAMPAIGN: {campaign}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Receive status: overall assessment, rating, key recommendations

3. CHECKPOINT: Publisher Review
   - Show user: strengths, weaknesses, recommendations
   - Auto mode: display and continue
   - Manual mode: ask if user wants to address any recommendations
   - (Addressing recommendations is manual - out of scope for auto-fix)

4. Update state: publisher_review = complete
```

### Phase 5.5: Revision (optional)

If publisher review identified issues worth addressing and user requests revisions:

```
1. Spawn novelizer-reviser:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CAMPAIGN: {campaign}
   FEEDBACK_SOURCE: publisher
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Receive status: chapters revised, changes made

2. Re-run continuity INCREMENTAL on revised chapters:
   Spawn novelizer-continuity (INCREMENTAL mode):
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MODE: INCREMENTAL
   CAMPAIGN: {campaign}
   CHAPTERS: [{revised chapter numbers}]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. Update state: revision_applied = true
```

Note: This phase is triggered when user requests revisions after publisher review.
Auto-mode skips revisions (displays publisher feedback and continues to Phase 6).

### Phase 6: Final Assembly

```
1. Create metadata.yaml:
   campaign: {campaign}
   tone: {from outline}
   style: fantasy-novel
   created: {timestamp}
   completed: {timestamp}
   total_chapters: {N}
   total_words: {sum from all chapters}
   sessions_covered: {from outline}

2. Create table-of-contents.md:
   # Table of Contents

   | Chapter | Title | POV | Words |
   |---------|-------|-----|-------|
   | 1 | The Price of Answers | Corwin Voss | 2147 |
   | 2 | Where Gods Cannot Hear | Seraphine Duskhollow | 2847 |
   ...

3. Archive intermediate files:
   - Create novel/drafts/ subdirectory (if not exists)
   - Move all chapter-*-draft.md files to drafts/
   - Move fix-requests.md and fix-requests-approved.md to drafts/ (if they exist)
   - Update state: drafts_archived = true

   **Important**: This step only runs on full completions.
   --append and --chapter N modes do NOT archive (they exit before Phase 6).

   **Idempotent behavior**: Check if files already archived before moving.
   If drafts/ exists and no draft files at root, skip archival.

4. Update state: phase = complete

5. Report completion
```

---

## Checkpoint Interactions

### Outline Approval

```
Outline created for "{campaign}"

Tone: {tone}
Chapters: {N}

| # | Title | POV | Type |
|---|-------|-----|------|
| 1 | {title} | {character} | {type} |
...

Options:
1. Approve and continue
2. Request changes
```

### Voice Lock

```
Here's a sample from Chapter 1:

---
{first 500 words of chapter-01.md}
---

Does this voice feel right for your campaign?

Options:
1. Yes, continue
2. No, it needs adjustment
```

If "No", ask: "What should change? (e.g., 'more gritty', 'less formal', 'more internal monologue')"

### Continuity Review

```
Continuity check complete.

Blocking Issues (must fix): {N}
{list each with chapter and brief description}

Advisory Issues (optional): {N}
{list each with chapter and brief description}

Which advisory issues should we address?
(Enter numbers, 'all', or 'none')
```

### Publisher Review

```
Publisher Assessment

Rating: {N}/10
Overall: "{assessment}"

Strengths:
{bullet list}

Weaknesses:
{bullet list}

Recommendations:
{bullet list}

These are suggestions for future revision. Continue to final assembly?
```

---

## Resume Mode

When `--resume`:

1. Read `novelization-state.yaml`
2. Determine current phase and chapter
3. Resume from that point:
   - If mid-writing: continue with next chapter
   - If at checkpoint: re-present checkpoint
   - If in fix phase: continue fixes

---

## Error Handling

**Agent returns malformed output:**
- Retry once with stricter prompt
- If still fails: log error, continue with next step if possible

**Voice lock fails 3 times:**
- Offer "provide style reference" option
- User can paste a paragraph of prose they like
- Append to tone guidance and retry

**Fix loop (>3 cycles):**
- Mark chapter as needing manual review
- Continue with other work
- Report at end

---

## Completion Report

```
Novelization complete!

Campaign: {campaign}
Tone: {tone}
Chapters: {N}
Total words: {word_count}

Quality:
- Editor: {N} prose improvements made
- Continuity: {N} issues found, {N} fixed
- Publisher: {rating}/10

Output: campaigns/{campaign}/novel/

Files:
- outline.md
- chapter-01.md through chapter-{NN}.md
- metadata.yaml
- table-of-contents.md
- publisher-feedback.md
- drafts/ (archived intermediate files)
```

---

## Related Files

- **Agents**:
  - `.claude/agents/novelizer-planner.md` - Outline creation and validation
  - `.claude/agents/novelizer-writer.md` - Chapter draft writing
  - `.claude/agents/novelizer-fixer.md` - Applying continuity fixes
  - `.claude/agents/novelizer-reviser.md` - Applying publisher/editorial revisions
  - `.claude/agents/novelizer-editor.md` - Prose quality editing
  - `.claude/agents/novelizer-continuity.md` - Consistency checking
  - `.claude/agents/novelizer-publisher.md` - Reader experience assessment
- **Tone files**: `.claude/skills/novelization-style/tones/`
- **Style files**: `.claude/skills/novelization-style/styles/`
