---
name: novelization-mechanics
description: Shared mechanical guidance for novelization agents. Covers chapter types, prose translation of D&D mechanics, YAML output format rules, and quality checklists.
autoLoad: false
---

# Novelization Mechanics Skill

This skill provides structural and mechanical guidance for converting D&D campaigns into novel chapters.

**Important**: This skill uses selective loading. Agents should specify which sub-skills they need rather than loading the entire skill.

## Available Sub-Skills

| Sub-Skill | File | Purpose | Typical Users |
|-----------|------|---------|---------------|
| `novelization-mechanics/chapter-types` | `chapter-types.md` | Chapter type definitions with word counts and pacing | planner |
| `novelization-mechanics/mechanics-to-prose` | `mechanics-to-prose.md` | Translating D&D mechanics into narrative | writer, fixer |
| `novelization-mechanics/output-format` | `output-format.md` | YAML output format rules for agent responses | all agents |
| `novelization-mechanics/quality-checklist` | `quality-checklist.md` | Pre-writing and pre-finalization checklists | writer |

## Usage in Agent Frontmatter

Instead of:
```yaml
skills: novelization-mechanics
```

Use selective loading:
```yaml
skills: novelization-mechanics/chapter-types, novelization-mechanics/output-format
```

## What This Skill Does NOT Cover

See `novelization-style` for:
- Tone selection and emotional register
- Prose style and voice guidance
- Party dynamics and relationship evolution
- Humor, flashbacks, and creative techniques
