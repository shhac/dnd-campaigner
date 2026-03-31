# Orchestration Details

Implementation details for the novelization pipeline. The orchestrator (main agent) reads this when running `/novelize`.

## Argument Parsing

```
campaign: first positional argument (required)
game_name: second positional argument (required)
playthrough: playthroughs/{campaign}/{game_name}  (derived)
auto_mode: --auto
resume_mode: --resume
fresh_mode: --fresh
skip_publisher: --skip-publisher
review_each: --review-each
dry_run: --dry-run
append_mode: --append
single_chapter: --chapter N
```

## Validation

1. `campaigns/{campaign}/` exists
2. `playthroughs/{campaign}/{game_name}/` exists
3. `{playthrough}/decision-log.md` exists (or `{playthrough}/scenes/` has files)
4. If `--resume`: `{playthrough}/novel/novelization-state.yaml` exists

## State File Schema

```yaml
# novelization-state.yaml
campaign: the-ember-tithe
started: 2026-03-30T10:30:00Z
last_updated: 2026-03-30T11:45:00Z
phase: writing  # planning, writing, continuity, pattern_review, fixing, reader, publisher, assembly
current_chapter: 3
chapters:
  1: { draft: complete, edited: complete, continuity: checked }
  2: { draft: complete, edited: complete, continuity: checked }
  3: { draft: in_progress, edited: pending, continuity: pending }
voice_lock: passed  # pending, passed, failed:{attempt_count}
continuity:
  incremental_checks: [2]
  last_checked_chapter: 2
  full_check: pending
  blocking_issues: 0
pattern_review:
  status: pending
  high_severity: 0
publisher_review: pending
fix_cycles: 0  # max 3
drafts_archived: false
```

## Agent Spawn Headers

### Writer (WRITE mode)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: WRITE
CAMPAIGN: {campaign}
PLAYTHROUGH: {playthrough}
CHAPTER: {N}
[VOICE_FEEDBACK: "..."]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Writer (PLAN mode)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: PLAN
CAMPAIGN: {campaign}
PLAYTHROUGH: {playthrough}
[DRY_RUN: true]
[APPEND: true]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Writer (FIX mode)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: FIX
CAMPAIGN: {campaign}
PLAYTHROUGH: {playthrough}
CHAPTER: {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Writer (REVISE mode)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: REVISE
CAMPAIGN: {campaign}
PLAYTHROUGH: {playthrough}
FEEDBACK_SOURCE: {publisher|pattern|user}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Editor
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMPAIGN: {campaign}
PLAYTHROUGH: {playthrough}
CHAPTER: {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Continuity (all modes)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: {FULL|INCREMENTAL|PATTERN|PATTERN_INCREMENTAL}
CAMPAIGN: {campaign}
PLAYTHROUGH: {playthrough}
[CHAPTERS: [N, M]]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Publisher
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMPAIGN: {campaign}
PLAYTHROUGH: {playthrough}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Reader (beta reader, per chapter)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: CHAPTER
CAMPAIGN: {campaign}
PLAYTHROUGH: {playthrough}
CHAPTER: {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Checkpoint UI Templates

### Outline Approval
Show: tone, chapter count, title/POV/type table. Ask: approve or request changes. Auto mode: approve automatically.

### Voice Lock (Chapter 1 only)
Read first 500 words of `chapter-01.md`. Ask: "Does this voice feel right?" If no: get feedback, re-run WRITE+EDIT with VOICE_FEEDBACK. Max 3 attempts, then offer style reference option.

### Continuity Review
Show: blocking count + list, advisory count + list. Blocking auto-included in fixes. Ask which advisory issues to address (numbers, 'all', or 'none').

### Publisher Review
Show: rating, strengths, weaknesses, recommendations. Auto mode: display and continue. Manual: ask if user wants to address recommendations.

## Special Modes

### --dry-run
Run PLAN with DRY_RUN: true. Display outline summary. Exit without writing files.

### --append
Requires existing outline + chapters. Run PLAN with APPEND: true. Write only new chapters. Run INCREMENTAL continuity on new + last existing chapter.

### --chapter N
Requires existing outline with chapter N. Regenerate chapter N only (WRITE + EDIT). Run INCREMENTAL continuity on [N-1, N, N+1].

### --fresh
Archive existing `novel/` to `novel/archive-{YYYYMMDD-HHMMSS}/`. Start fresh.

### --resume
Read state file. Resume from current phase/chapter.

## Incremental Continuity Trigger

Run INCREMENTAL continuity when ANY of:
- Current chapter number is even (2, 4, 6, 8...)
- This is the final chapter
- 2+ chapters since last check

Check chapters from `last_checked_chapter + 1` to current. Always include current and its predecessor.

## Fix Loop

Max 3 cycles. If blocking issues persist after 3 fix attempts: mark chapter as "needs manual review," warn user, continue pipeline.

## Final Assembly

1. Create `metadata.yaml` (campaign, tone, timestamps, word count)
2. Create `table-of-contents.md`
3. Archive drafts to `novel/drafts/`
4. Update state: phase = complete
