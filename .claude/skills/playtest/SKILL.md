---
name: playtest
description: Run a full-auto playtest of a D&D campaign to validate agent behavior. Use when testing changes to agents, skills, or protocols. Creates a team with GM, narrator, and all AI players, observes metrics, then cleans up. No human player needed.
---

# Playtest Skill

Run a full-auto D&D session to validate agent behavior. You (the team lead) create the team, spawn all agents, send the session-start command, observe the session, send the end command, score metrics, and clean up.

## Prerequisites

- `toss` CLI installed (`brew tap shhac/tap && brew install toss`) — used by all agents for dice rolls
- A campaign directory with at minimum: `story-state.md`, `party-knowledge.md`, `preferences.md`, character sheets in `party/`

## Why You Must Be the Team Lead

Subagents cannot create teams (platform limitation). You must act as the team lead directly — do not try to delegate the playtest to a background agent.

## Setup

### 1. Create the team

```
TeamCreate: playtest-{campaign}
```

### 2. Read campaign config

Read `campaigns/{campaign}/preferences.md` for narrative style. List character sheets in `campaigns/{campaign}/party/` (exclude `*-brief.md` and `*-journal.md`).

### 3. Create playthrough

Create a temporary playthrough for the test:

```bash
mkdir -p playthroughs/{campaign}/playtest/party playthroughs/{campaign}/playtest/scenes playthroughs/{campaign}/playtest/npcs playthroughs/{campaign}/playtest/items playthroughs/{campaign}/playtest/tmp
cp campaigns/{campaign}/story-state.md playthroughs/{campaign}/playtest/
cp campaigns/{campaign}/party-knowledge.md playthroughs/{campaign}/playtest/
cp campaigns/{campaign}/preferences.md playthroughs/{campaign}/playtest/
# Copy character sheets (not briefs, not journals)
for f in campaigns/{campaign}/party/*.md; do
  [[ "$f" == *-brief.md || "$f" == *-journal.md || "$f" == *-relationships.md ]] && continue
  cp "$f" playthroughs/{campaign}/playtest/party/
done
```

Set `{playthrough}` = `playthroughs/{campaign}/playtest`.

### 4. Spawn teammates (all in parallel)

Spawn 6 agents as teammates on the team:

| Name | Agent Type | Prompt Includes |
|------|-----------|-----------------|
| `gm` | `gm` | Campaign, playthrough, `mode: full_auto`, narrative style, AI characters |
| `narrator` | `narrator` | Campaign, playthrough |
| One per character | `player-teammate` | Campaign, playthrough, character name |

Example spawn prompt for GM:
```
You are the Game Master for the "{campaign}" campaign.
Campaign: {campaign}
Playthrough: {playthrough}
Use {narrative_style} formatting style.
Mode: full_auto (all characters are AI-controlled, no human player).
AI characters: {char1}, {char2}, {char3}, {char4}

Read your campaign files and wait for the session-start message.
```

Example spawn prompt for players:
```
Campaign: {campaign}
Playthrough: {playthrough}
Character: {character}
Control: AI

You are {character} in the "{campaign}" campaign.
Read your character files and wait for the session to begin.
```

### 5. Send session-start command

Once all teammates are idle (ready), send to GM:

```
[SESSION_COMMAND]
command: start
campaign: {campaign}
playthrough: {playthrough}
player_character: none
narrative_style: {style}
verbosity: verbose
mode: full_auto
ai_characters:
  - {char1}
  - {char2}
  - ...
```

If the GM doesn't respond within ~30 seconds, resend with explicit instructions to read files and begin.

## Observation

### What You See

As team lead, you see:
- `[NARRATIVE]` broadcasts from the GM (full text)
- `[ACTIVITY]` pings from players (status updates)
- `[COMMAND_ACK]` and `[SESSION_END]` from GM
- Peer DM summaries in idle notifications (brief summaries of direct GM↔player and player↔player messages)

You do NOT see the full text of `[GM_TO_PLAYER]` or `[PLAYER_TO_GM]` messages — only summaries in idle notifications. This is by design (information isolation).

### Metrics to Track

| Metric | What to Count | Target |
|--------|--------------|--------|
| **Dice compliance** | `## Dice` sections visible in Party Activity footer results | 1+ roll per beat |
| **Session-end** | Messages after `[SESSION_COMMAND] end` before `[SESSION_END]` | 0-1 (platform allows 1 in-flight) |
| **Secret control** | Any mention of locked act content in narratives | Zero leaks |
| **Character conflict** | Disagreements, conditional agreements, ICE notes in Party Activity | 1+ per 2 beats |
| **ICE engagement** | ICE activations noted in Party Activity footers and `[ACTIVITY]` pings | 3-8 per session |
| **Activity visualization** | `## Party Activity` footers in narratives, `[ACTIVITY]` pings from players | Footer in every narrative |
| **Player-to-player** | Direct exchanges visible in peer DM summaries | 2+ per session |
| **Pacing** | Beats before the GM advances past a revelation | 2+ exchanges after revelations |

### Ending the Session

After the target number of beats (typically 3), send:

```
[SESSION_COMMAND]
command: end
reason: "Playtest complete"
```

Wait for `[COMMAND_ACK]` then `[SESSION_END]` with session metrics.

## Cleanup

### 1. Shut down all teammates

Send shutdown requests to all 6 teammates. Players may journal before shutting down — this is expected.

### 2. Delete playthrough

The playtest writes all state to the playthrough directory. Delete it:

```bash
rm -rf playthroughs/{campaign}/playtest/
```

Campaign files are untouched — no `git checkout` needed. Verify with `git status -s`.

### 3. Score and report

Compile a scorecard grading each metric (A/B/C/D/F) with specific evidence from the session. Note:
- **What worked** — improvements visible from recent changes
- **What still needs work** — with concrete fix recommendations (file path + description)
- **Platform learnings** — any new insights about Teams behavior

### 4. Apply fixes

If the playtest revealed issues:
1. Edit the relevant skill/agent files
2. Commit with a message referencing the playtest finding
3. Do NOT commit playtest artifacts (scenes, journals, state changes)

## Playtest Variations

### Quick Playtest (1-2 beats)
For testing a specific change (e.g., dice compliance after a skill update). Send end command after 1-2 beats.

### Extended Playtest (5+ beats)
For testing pacing, session structure, and context compaction. Monitor for context-related degradation in later beats.

### Combat Playtest
Set up a campaign state where combat is imminent. Tests combat-orchestration skill, threat tiers, and batched player actions.

### Novelization Playtest
Run a session, then test the novelization pipeline on the generated scenes. Validates the full chain from play → scenes → novel chapters.

## Known Platform Behaviors

- **Agents finish current work before checking inbox** — a `[SESSION_COMMAND] end` sent while the GM is mid-composition will be processed after the current message is sent. Expect 0-1 in-flight messages. This is not a compliance failure.
- **Idle notifications are normal** — teammates go idle between every message. This does not mean they're stuck.
- **Peer DM summaries are brief** — you won't see full GM↔player message text, only summaries in idle notifications. Use Party Activity footers and `[ACTIVITY]` pings for visibility.
- **Players may not respond to broadcasts** — this is correct behavior. Players wait for direct `[GM_TO_PLAYER]` prompts.
