---
description: Convert campaign sessions into novel chapters
argument-hint: <campaign> [--auto] [--append|--fresh] [--tone <tone>] [--style <style>] [--pov <character>] [--chapter <N>]
---

# /novelize

Convert campaign sessions into episodic novel chapters.

## Overview

This command transforms your D&D campaign's decision logs and character journals into polished prose fiction. The novelization process preserves the collaborative, emergent nature of tabletop roleplaying while shaping raw play records into compelling narrative.

The novelizer agent handles the actual writing, operating in different modes (tone recommendation, outline creation, validation, chapter writing). This command orchestrates that process, managing the flow from source materials to finished chapters.

## Arguments

- `campaign` (required): Campaign name (e.g., `the-rot-beneath`)
- `--auto`: Full automatic mode - agent makes all decisions without interaction
- `--append`: Add new chapters to existing novel (default if novel/ exists)
- `--fresh`: Start over, archiving any existing novel
- `--tone <tone>`: Specify tone (gritty-noir, heroic-adventure, literary-drama)
- `--style <style>`: Specify style (fantasy-novel, mechanics-visible)
- `--pov <character>`: Lock all chapters to one character's POV
- `--chapter <N>`: Regenerate only chapter N (requires existing outline)

## Examples

```
/novelize the-rot-beneath
/novelize the-rot-beneath --auto
/novelize the-rot-beneath --tone gritty-noir --style fantasy-novel
/novelize the-rot-beneath --fresh --auto
/novelize the-rot-beneath --chapter 3
/novelize the-rot-beneath --pov tilda-brannock --tone literary-drama
```

## What Gets Created

```
campaigns/{campaign}/novel/
├── metadata.yaml     # Tracks tone, style, progress, timestamps
├── outline.md        # Chapter outline with scene mapping
├── chapter-01.md     # Individual chapters with frontmatter
├── chapter-02.md
└── ...
```

Each chapter file includes YAML frontmatter with:
- Chapter number and title
- POV character
- Chapter type (action/breath/revelation/transition)
- Word count
- Sessions and scenes covered

## Modes

**Manual mode** (default): You review and approve the outline before writing begins. The orchestrator will ask for your input on tone selection (if not specified) and outline approval. Good for first-time novelization or when you want creative control.

**Auto mode** (`--auto`): Agent selects tone based on campaign analysis, creates outline, validates it internally, applies auto-fixes, and writes all chapters without interaction. Good for batch processing or when you trust the defaults.

## Prerequisites

Before novelizing, ensure your campaign has:
1. A populated `decision-log.md` with scene records
2. Character journals (optional but enriches emotional depth)
3. Completed sessions worth converting

## Tone Options

| Tone | Best For |
|------|----------|
| gritty-noir | Dark, morally ambiguous campaigns with consequences |
| heroic-adventure | Classic fantasy heroism with clear stakes |
| literary-drama | Character-focused stories with emotional depth |

## Style Options

| Style | Description |
|-------|-------------|
| fantasy-novel | Balanced, accessible prose (default) |
| mechanics-visible | Preserves some game terminology for gaming audiences |

---

## Instructions for Claude

You are the **orchestrator** for the novelization process. Your job is to parse arguments, validate prerequisites, manage the flow between modes, and spawn the novelizer agent appropriately.

### Argument Parsing

Parse the command arguments:
- First positional argument: campaign name (required)
- `--auto`: Set auto_mode = true
- `--append`: Set append_mode = true (explicit)
- `--fresh`: Set fresh_mode = true
- `--tone <value>`: Set specified_tone
- `--style <value>`: Set specified_style (default: "fantasy-novel")
- `--pov <value>`: Set locked_pov (character name, hyphenated)
- `--chapter <N>`: Set single_chapter = N

If both `--append` and `--fresh` are specified, error and ask user to choose one.

### Validation

1. **Campaign exists**: Check `campaigns/{campaign}/` directory exists
2. **Decision-log exists**: Check `campaigns/{campaign}/decision-log.md` exists and has content
3. **Single chapter mode**: If `--chapter N`, verify `novel/outline.md` exists
4. **POV character**: If `--pov`, verify character exists in `party/`

If validation fails:
- Campaign not found: List available campaigns with `ls campaigns/`
- Decision-log missing: Explain it's required, offer to create a stub structure
- Outline missing for --chapter: Explain full novelization must run first

### Existing Novel Detection

Check if `campaigns/{campaign}/novel/` exists:

```
If novel/ exists:
  If --fresh:
    → Archive existing, proceed fresh
  Else if --append:
    → Append mode (continue from last chapter)
  Else if auto_mode:
    → Default to append
  Else:
    → Ask user: append or fresh?
```

### Archive Behavior

When archiving (--fresh with existing novel/):

1. Create timestamp: `YYYYMMDD-HHMMSS` format
2. Create archive directory: `novel/archive-{timestamp}/`
3. Move files: `metadata.yaml`, `outline.md`, all `chapter-*.md`
4. Log the archive location to user
5. Proceed with fresh novelization

### Orchestration Flow

```
1. Parse arguments
2. Validate campaign and prerequisites
3. Handle existing novel (append/fresh/ask)
4. If --chapter N → Single Chapter Flow
5. If no --tone → Spawn novelizer (TONE_RECOMMEND), get recommendation
   - Auto mode: use recommendation
   - Manual mode: present recommendation, allow override
6. Set style (--style or default "fantasy-novel")
7. Spawn novelizer (OUTLINE_CREATION) with tone, style, locked_pov
8. Validate outline:
   - Auto mode: spawn novelizer (VALIDATION), apply auto-fixes if needed
   - Manual mode: present outline, ask for approval/edits
9. For each chapter in outline:
   - Gather sources (within context budget)
   - Spawn novelizer (CHAPTER_WRITING)
   - Write output to chapter-NN.md
10. Update/create metadata.yaml
11. Report completion
```

### Mode Invocation

When spawning the novelizer agent, use explicit mode headers in the Task prompt:

**TONE_RECOMMEND:**
```
Task: novelizer agent
Prompt:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: TONE_RECOMMEND
Campaign: {campaign}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Include campaign overview excerpt]
[Include first 500 words of decision-log]
[Include sample journal entry if available]
```

**OUTLINE_CREATION:**
```
Task: novelizer agent
Prompt:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: OUTLINE_CREATION
Campaign: {campaign}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tone: {tone}
Style: {style}
Locked POV: {pov or "none"}

[Include full decision-log content]
[Include character list from party/]
```

**VALIDATION:**
```
Task: novelizer agent
Prompt:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: VALIDATION
Campaign: {campaign}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Include outline to validate]
[Include decision-log for coverage check]
```

**CHAPTER_WRITING:**
```
Task: novelizer agent
Prompt:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: CHAPTER_WRITING
Campaign: {campaign}
Chapter: {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Chapter Specification
{chapter spec from outline}

## Tone Guidelines
{content from tone file}

## Style Guidelines
{content from style file}

## Combat Prose Guidelines (if action chapter)
{content from combat-prose.md}

## Voice Sample (if chapter 2+)
{final 300-500 words from previous chapter}

## Voice Notes
POV Character: {character}
{character voice/personality notes from their sheet}

## Source Material: Decision Log Scenes
{extracted scenes for this chapter only}

## Source Material: Journal Entries
{relevant journal entries for POV character}
```

### Context Budget Management

For CHAPTER_WRITING mode, stay within ~4500 words of source content to leave room for output:

| Component | Budget |
|-----------|--------|
| Tone file | ~800 words |
| Style file | ~800 words |
| Combat prose (if action) | ~600 words |
| Voice sample | 300-500 words |
| Decision-log scenes | ~1500 words |
| Journal entries | ~500 words |
| Chapter spec + voice notes | ~300 words |

**Source Extraction**:
- Extract only the scenes listed in the chapter spec from decision-log
- Extract only the POV character's journal entries relevant to those scenes
- If sources exceed budget, prioritize: spec > tone > decision-log > style > journal > voice sample

### Single Chapter Revision Flow (--chapter N)

When `--chapter N` is specified:

1. Read existing `novel/outline.md`
2. Parse to extract chapter N specification
3. If N > 1, read `novel/chapter-{N-1}.md` and extract final 300-500 words for voice sample
4. Read relevant tone and style files (from metadata.yaml or defaults)
5. Gather source materials for just that chapter
6. Spawn novelizer (CHAPTER_WRITING) for chapter N only
7. Write output to `novel/chapter-{NN}.md` (overwriting existing)
8. Update metadata.yaml with regeneration timestamp
9. Report completion

### Append Mode Flow

When appending to existing novel:

1. Read `novel/metadata.yaml` to get current state
2. Read `novel/outline.md` to find last completed chapter
3. Check decision-log for new content since last novelization
4. If new content exists:
   - Re-run OUTLINE_CREATION with new content, append to existing outline
   - Validate the updated outline
   - Write only the new chapters
5. If no new content: inform user, exit

### Append Mode Behavior

When appending to an existing novel:
1. Read existing `outline.md` to get current chapter count and coverage
2. Read `metadata.yaml` for tone, style, voice_notes
3. Identify NEW sessions not yet novelized (compare `last_session_novelized`)
4. Run OUTLINE_CREATION for NEW content only
5. Append new chapters to existing outline (don't regenerate existing chapters)
6. Continue chapter numbering from where it left off
7. Write only the new chapters
8. Update metadata.yaml with new `last_session_novelized` and `last_chapter`

The existing outline and chapters are NOT regenerated - only extended.

### Manual Mode Interactions

In manual mode, use appropriate prompts (not agent spawning) for:

**Append vs Fresh Decision** (if novel exists and neither flag specified):
```
Existing novel found with {N} chapters.
Options:
1. Append - Continue adding new chapters
2. Fresh - Archive existing and start over

Which would you prefer?
```

**Tone Selection** (if no --tone and not auto):
Present the TONE_RECOMMEND output:
```
Based on your campaign's themes, I recommend: {tone}
Reasoning: {justification}

Options:
1. Use recommended ({tone})
2. Gritty Noir - Dark, morally ambiguous
3. Heroic Adventure - Classic fantasy heroism
4. Literary Drama - Character-focused depth

Your choice?
```

**Outline Approval** (if not auto):
```
Here's the proposed outline:

{outline summary - chapter titles and POVs}

Total: {N} chapters covering sessions {X-Y}

Options:
1. Approve and proceed
2. Request changes (describe what to adjust)

Your choice?
```

If user requests changes, re-run OUTLINE_CREATION with their notes appended.

### Error Handling

**Campaign not found:**
```bash
ls campaigns/
```
List available and ask user to choose or check spelling.

**Decision-log missing or empty:**
Explain that the decision-log is the primary source for novelization. Offer to create a stub:
```markdown
# Decision Log

## Session 1

### Scene: [Scene Name]
**Date**: [Date]
**Location**: [Location]

[Record of character decisions and actions...]
```

**Outline validation fails:**
- Auto mode: If auto_fix_available, apply the suggested outline from validation output
- Manual mode: Show issues and suggested fixes, ask user to approve or manually edit

**Chapter writing fails (malformed output):**
Retry once with stricter instructions:
```
CRITICAL: Output must begin immediately with --- frontmatter.
No preamble text. No code fences around the chapter.
```

If retry fails, save partial output and report the issue.

### File Outputs

**metadata.yaml** (created/updated):
```yaml
campaign: {campaign}
tone: {tone}
style: {style}
locked_pov: {pov or null}
created: {ISO timestamp}
last_updated: {ISO timestamp}
last_session_novelized: "Session N"
last_chapter: N
chapters_completed: {N}
total_word_count: {sum}
sessions_covered:
  - "Session 1"
  - "Session 2"
voice_notes:
  character-name: "Brief style description. Sentence patterns. Key traits."
```

### Voice Notes Handling

Voice notes help maintain character voice consistency across chapters.

**First novelization**:
- Voice notes are optional
- If not provided, agent infers voice from character sheets and journals
- After first chapter per POV character, orchestrator can optionally generate voice notes

**Subsequent novelizations (append mode)**:
- Read existing voice_notes from metadata.yaml
- Use to maintain consistency with prior chapters

**Voice notes format** in metadata.yaml:
```yaml
voice_notes:
  character-name: "Brief style description. Sentence patterns. Key traits."
```

**outline.md**: The approved outline in the format specified by novelizer agent

**chapter-NN.md**: One file per chapter, with two-digit padding (01, 02, ... 10, 11)

### Completion Report

After successful completion, report:
```
Novelization complete!

Campaign: {campaign}
Tone: {tone}
Style: {style}
Chapters: {N}
Total words: {word_count}
Output: campaigns/{campaign}/novel/

Files created:
- metadata.yaml
- outline.md
- chapter-01.md through chapter-{NN}.md
```

### Related Files

- **Novelizer agent**: `.claude/agents/novelizer.md`
- **Tone files**: `.claude/skills/novelization-style/tones/`
- **Style files**: `.claude/skills/novelization-style/styles/`
- **Combat prose**: `.claude/skills/novelization-style/styles/combat-prose.md`
