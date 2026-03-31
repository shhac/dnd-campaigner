---
description: Convert campaign sessions into novel chapters
argument-hint: <campaign> <game-name> [--auto] [--resume] [--fresh] [--skip-publisher] [--review-each] [--dry-run] [--append] [--chapter N]
---

# /novelize

Convert D&D campaign sessions into a polished novel.

## What To Do

You are the orchestrator. Load the `novelization-workflow` skill and follow its pipeline.

1. Parse arguments from the user's input
2. Read `novelization-workflow/SKILL.md` for the pipeline overview and agent chain
3. Read `novelization-workflow/orchestrate.md` for implementation details (arg parsing, state management, spawn headers, checkpoint UI)
4. Validate prerequisites (campaign exists, playthrough exists, source material exists)
5. Execute the pipeline phase by phase, spawning agents as specified

## Key Principles

- **You are lightweight**: Don't read source content (scenes, decision-log, character sheets). Agents do that.
- **Agents are self-sufficient**: They read their own inputs and write their own outputs. You track status.
- **State file is your memory**: Update `novelization-state.yaml` after each step. This enables `--resume`.
- **Checkpoints are user interactions**: Outline approval, voice lock, continuity review, publisher review. Pause and ask.

## Agents

| Agent | Modes | Role |
|-------|-------|------|
| `novelizer-writer` | WRITE, PLAN, REVISE, FIX | Creates all content |
| `novelizer-editor` | (single) | Polishes prose |
| `novelizer-continuity` | FULL, INCREMENTAL, PATTERN, PATTERN_INCREMENTAL | Checks consistency |
| `novelizer-publisher` | (single) | Evaluates reading experience |
| `novelizer-reader` | CHAPTER | Beta reader reactions |

## Options

| Flag | Effect |
|------|--------|
| `--auto` | Pause only for voice lock and blocking issues |
| `--resume` | Continue from last checkpoint |
| `--fresh` | Archive existing novel, start over |
| `--skip-publisher` | Skip publisher review phase |
| `--review-each` | Pause after each chapter for user review |
| `--dry-run` | Show plan without writing files |
| `--append` | Extend existing novel with new content |
| `--chapter N` | Regenerate only chapter N |
