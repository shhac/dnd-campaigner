---
name: novelization-style
description: Provides tone and style guidelines for converting D&D campaigns into prose fiction. Load only the relevant tone and style files.
autoLoad: false
---

# Novelization Style Skill

This skill provides guidance for converting D&D campaign sessions into light novel format prose.

**Important**: This skill uses selective loading. Agents should specify which sub-skills they need rather than loading the entire skill.

## Available Sub-Skills

### Core Guidance (for full style reference)
| Sub-Skill | File | Purpose |
|-----------|------|---------|
| `novelization-style/core` | `SKILL.md` | Full style reference - chapter structure, POV handling, party dynamics, humor, flashbacks |

### Tone Files (load ONE per novelization)
| Sub-Skill | File | When to Use |
|-----------|------|-------------|
| `novelization-style/tones/gritty-noir` | `tones/gritty-noir.md` | Dark urban fantasy, moral ambiguity, mystery |
| `novelization-style/tones/heroic-adventure` | `tones/heroic-adventure.md` | Classic fantasy, clear heroes, epic quests |
| `novelization-style/tones/literary-drama` | `tones/literary-drama.md` | Character-driven, introspective, emotional depth |

### Style Files
| Sub-Skill | File | When to Use |
|-----------|------|-------------|
| `novelization-style/styles/fantasy-novel` | `styles/fantasy-novel.md` | Default style for most campaigns |
| `novelization-style/styles/combat-prose` | `styles/combat-prose.md` | Supplement for action-heavy chapters |
| `novelization-style/styles/mechanics-visible` | `styles/mechanics-visible.md` | LitRPG style with visible stats |

### Index Files (for discovery)
| Sub-Skill | File | Purpose |
|-----------|------|---------|
| `novelization-style/tones/index` | `tones/index.md` | List all available tones |
| `novelization-style/styles/index` | `styles/index.md` | List all available styles |

## Usage in Agent Frontmatter

Instead of loading the entire skill, specify needed components:

```yaml
# For planner (needs to see available tones)
skills: novelization-style/tones/index

# For writer (needs specific tone + style)
skills: novelization-style/styles/fantasy-novel
# Note: Writer reads tone files dynamically based on outline metadata

# For editor (needs style guidance)
skills: novelization-style/core, novelization-style/styles/fantasy-novel
```

## Tone Selection Principle

Match the campaign's `overview.md` themes:
- Horror campaign → `gritty-noir` or define new gothic tone
- Heroic adventure → `heroic-adventure`
- Character-driven → `literary-drama`

**Load only one tone file per novelization session.** Mixing tones creates tonal whiplash.
