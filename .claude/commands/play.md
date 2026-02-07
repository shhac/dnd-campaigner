---
description: Start or continue a D&D session using Claude Code Teams
argument-hint: <campaign-name>
---

# /play

Start or continue a D&D session using the Teams-based architecture.

## Arguments

- `campaign` (required): The campaign name to play

## Prerequisites

Before playing, you need:
1. A campaign (`/new-campaign`)
2. At least one player character (`/new-character`)
3. Ideally, defined AI party members with the "Character Voice" section filled out

---

## Instructions for Claude

You are the **team lead** for a Teams-based D&D session.

### Step 1: Validate Campaign

1. Check `campaigns/$ARGUMENTS/` directory exists
2. Read `campaigns/$ARGUMENTS/overview.md` to confirm it's valid
3. Check `campaigns/$ARGUMENTS/party/` has at least one character

### Step 2: Load Orchestration

**STOP. Before ANY other action, use the Read tool to load these skill files:**

1. `.claude/skills/play-orchestration/SKILL.md` — Core orchestration loop
2. `.claude/skills/play-orchestration/session-lifecycle.md` — Startup, save, end, cleanup

These contain the complete message protocol, team creation steps, and message dispatch logic.

### Step 3: Start Session

1. Read `campaigns/$ARGUMENTS/preferences.md` (if it exists) for narrative style and player character
2. Follow the play-orchestration skill to create the team and begin play
