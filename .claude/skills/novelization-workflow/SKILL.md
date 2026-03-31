---
name: novelization-workflow
description: Pipeline orchestration for novelizing D&D campaigns. Defines the default agent chain, mode dispatch, and checkpoint gates. Use when orchestrating the /novelize command, when deciding which novelizer agent to spawn next, or when planning a novelization workflow.
autoLoad: false
---

# Novelization Workflow

Orchestration guide for the novelization pipeline. Defines which agents to use, in what order, and when to pause for user input.

## Agents

| Agent | Role | Modes | When to Use |
|-------|------|-------|-------------|
| `novelizer-writer` | Creates content | WRITE, PLAN, REVISE, FIX | Drafting chapters, creating outlines, applying feedback, fixing issues |
| `novelizer-editor` | Polishes prose | (single mode) | After every draft, after revisions |
| `novelizer-continuity` | Checks consistency | FULL, INCREMENTAL, PATTERN, PATTERN_INCREMENTAL | After chapters, after fixes, before publisher |
| `novelizer-publisher` | Evaluates experience | (single mode) | After all chapters written and checked |
| `novelizer-reader` | Beta reader reactions | CHAPTER | After fixes, before publisher (emotional/experiential lens) |

## Default Pipeline

```
1. PLAN          Writer (PLAN mode) creates outline from scenes/decision-log
                 ⏸ Checkpoint: Outline Approval

2. WRITE Ch 1    Writer (WRITE mode) drafts Chapter 1
3. EDIT Ch 1     Editor polishes Chapter 1
                 ⏸ Checkpoint: Voice Lock (critical — all subsequent chapters follow this voice)

4. WRITE Ch 2-N  Writer drafts each chapter sequentially (reads previous final for voice)
   EDIT Ch 2-N   Editor polishes each chapter after drafting
   CONTINUITY    Continuity (INCREMENTAL) every 2-3 chapters

5. CONTINUITY    Continuity (FULL) after all chapters written
6. FIX           Writer (FIX mode) applies blocking fixes from fix-requests.md
                 ⏸ Checkpoint: Continuity Review (if blocking issues were found)

7. PATTERN       Continuity (PATTERN) cross-chapter repetition scan
8. REVISE        Writer (REVISE mode) addresses pattern issues

9. REVIEW        Publisher evaluates full manuscript
                 ⏸ Checkpoint: Publisher Review (skippable with --skip-publisher)

10. REVISE       Writer (REVISE mode) applies publisher feedback
11. EDIT         Final editor pass on revised chapters
```

## Checkpoint Gates

| Checkpoint | When | What Happens |
|------------|------|-------------|
| Outline Approval | After PLAN | User reviews chapter breakdown, POV assignments, pacing |
| Voice Lock | After Ch 1 edited | User reads Ch 1, confirms voice. All subsequent writing matches this. Critical — don't skip. |
| Continuity Review | After FIX | User reviews fix-requests, approves/rejects each fix |
| Publisher Review | After REVIEW | User reads publisher feedback, decides what to action |

## Mode Dispatch

When spawning the writer agent, specify the mode in the header:

```
MODE: WRITE     → Load novelization-workflow/write
MODE: PLAN      → Load novelization-workflow/plan
MODE: REVISE    → Load novelization-workflow/revise
MODE: FIX       → Load novelization-workflow/fix
```

The writer agent reads its mode from the header and loads the corresponding workflow skill.

## Sub-Skills

| Sub-Skill | File | Used By |
|-----------|------|---------|
| `novelization-workflow/write` | `write.md` | Writer (WRITE mode) |
| `novelization-workflow/plan` | `plan.md` | Writer (PLAN mode) |
| `novelization-workflow/revise` | `revise.md` | Writer (REVISE mode) |
| `novelization-workflow/fix` | `fix.md` | Writer (FIX mode) |
| `novelization-workflow/edit` | `edit.md` | Editor |
| `novelization-workflow/continuity` | `continuity.md` | Continuity agent |
| `novelization-workflow/review` | `review.md` | Publisher agent |
| `novelization-workflow/orchestrate` | `orchestrate.md` | Orchestrator (main agent via /novelize) |

## Parallel vs Sequential

- **Sequential**: Chapter writing (each reads previous final), continuity after fixes
- **Parallel safe**: Editor + continuity incremental (different outputs), pattern check + publisher review (both read-only)
- **Never parallel**: Two writer instances on adjacent chapters (voice drift risk)
