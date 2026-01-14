---
name: narrative-formatting
description: This skill should be used when running as the GM agent for D&D sessions, when formatting D&D narrative output, GM scene descriptions, combat encounters, dialogue scenes, exploration sequences, or any game master narration. Invoked when presenting story content to players, formatting dice roll results, structuring combat rounds, or creating immersive scene descriptions. Auto-load when subagent_type is 'gm'.
---

# Narrative Formatting

## Overview

> **Terminal Compatibility**: Some Unicode characters (═, ─, etc.) may not render in all terminals. Use ASCII alternatives (=, -) if needed.

This skill defines a consistent formatting system for D&D narrative output. The goal is clear, scannable, immersive game text that distinguishes between narration, dialogue, actions, and mechanical results.

## Core Principle: Show Everything, Summarize Nothing

Never compress or summarize what happens in a scene. Players should experience each moment:
- Every exchange in a conversation
- Every swing in combat
- Every detail discovered during exploration

If something happens in the fiction, it gets formatted and shown.

## Style Selection

Users can choose their preferred narrative style. The GM/orchestrator should ask at session start or this can be set in campaign configuration.

**Available Styles:**
| Style | Description | Best For |
|-------|-------------|----------|
| **Script** | Clear speaker labels, Unicode markers, structured | Players who want easy scanning |
| **Novel** | Prose-based, literary, dialogue woven into narration | Players who prefer immersive reading |
| **Hybrid** | Balanced between script and novel approaches | Best of both worlds |
| **Minimal** | Clean, less markup, streamlined | Players who prefer simplicity |

See `conversation/index.md` for complete examples of each style.

## Terminal Formatting Support

**Works:**
- **Bold** (`**text**`) - Use for character names, important terms
- *Italic* (`*text*`) - Use for actions, descriptions, internal thoughts
- ***Bold-Italic*** (`***text***`) - Use for emphasis
- `Inline code` (backticks) - Use for dice rolls and mechanical results
- > Blockquotes - Can be used for speech in some styles

**Does NOT Work:**
- ~~Strikethrough~~ - Not rendered in terminal
- ANSI escape codes - Not supported

## Master Symbol Legend

| Symbol | Usage | Example |
|--------|-------|---------|
| `★` | GM narration / scene description | `★ *The tavern falls silent as you enter.* ` |
| `━━━ NAME ━━━` | Character speaking (Script style) | `━━━ **THERON** ━━━` |
| `→` | Character action | `→ *Lyra draws her blade and steps forward.* ` |
| `` `⚄` `` | Dice roll / mechanical result | `` ⚄ Perception: `1d20+3 = [14]+3 = 17` `` |
| `═══════════════════` | Major scene break | Scene changes, time skips |
| `───` | Minor transition | Brief pause, shift in focus |
| `⚔` | Combat header | `⚔ COMBAT: Ambush in the Sewers` |
| `☠` | Death / critical danger | `☠ **Grimjaw** falls, his last breath a curse.` |
| `❤` | Healing / rest / recovery | `❤ Short rest completed. Hit dice recovered.` |
| `✦` | Important discovery / revelation | `✦ You notice the Duke's signet ring on the corpse.` |

## Markdown Usage Guidelines

### Character Names
Always **bold** character names when they appear in narration:
- `**Kira** notches an arrow`
- `The blade finds **Theron**'s guard`

### Actions and Descriptions
Use *italics* for action descriptions and atmospheric text:
- `→ *Kira examines the lock carefully.*`
- `★ *The chamber stretches into darkness.*`

### Dice Rolls
Use `inline code` for dice roll results:
- `` ⚄ Perception: `1d20+4 = [14]+4 = 18 vs DC 15 → SUCCESS` ``

### Important Terms
**Bold** important game terms, locations, and items:
- `✦ FOUND: **Coded letter** + **Small iron key**`
- `You arrive at the **Thornwood Manor**`

## Scene Type Guides

Reference the appropriate guide based on what you're formatting:

| Scene Type | Guide File | When to Use |
|------------|------------|-------------|
| Combat | `combat.md` | Fights, ambushes, any initiative-based action |
| Conversation | `conversation/index.md` | Dialogue, social encounters, NPC interactions |
| Exploration | `exploration.md` | Investigating areas, searching, dungeon crawling |
| Scene Intro | `scene-intro.md` | Opening a new scene, transitions, establishing shots |
| Dice Rolls | `dice-rolls.md` | Formatting any mechanical roll result |

### Conversation Style Files

The conversation guide is split into multiple files for context efficiency:
- `conversation/index.md` - Overview and common elements
- `conversation/script.md` - Script style (structured, scannable)
- `conversation/novel.md` - Novel style (literary prose)
- `conversation/hybrid.md` - Hybrid style (balanced approach)
- `conversation/minimal.md` - Minimal style (streamlined)

Load only `index.md` + the chosen style file during sessions.

## Quick Reference Examples

### Narration
```
★ *The corridor stretches into darkness. Water drips somewhere ahead,
each drop echoing off unseen stone walls.*
```

### Dialogue (Script Style)
```
━━━ **GRIMJAW** ━━━
"You shouldn't have come here, soft ones. The Rot takes all."
```

### Action
```
→ ***Kira*** *notches an arrow and takes aim at the nearest cultist.*
```

### Discovery
```
✦ Hidden beneath the floorboards: a **leather journal** bearing the
**Thornwood family crest**.
```

### Scene Break
```
═══════════════════

*Three days later...*

═══════════════════
```

## Formatting Principles

1. **Consistency** - Use the same symbol for the same purpose every time
2. **Readability** - Add blank lines between different types of content
3. **Immersion** - Let symbols fade into the background; they organize, not distract
4. **Completeness** - Show the full experience, don't skip ahead
5. **Style Respect** - Honor the player's chosen narrative style throughout the session
