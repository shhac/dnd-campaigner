# Novelization Styles

This directory contains style definitions that control how D&D session content is transformed into prose. Each style handles the fundamental question: how visible should the game mechanics be in the final text?

## Available Styles

| Style | Format | D&D Mechanics | Best For |
|-------|--------|---------------|----------|
| `fantasy-novel` | Standard prose chapters | Invisible | Publication-quality fiction, immersive reading |
| `mechanics-visible` | Prose with mechanical asides | Shown/implied | LitRPG fans, tutorial content, preserving game memory |

## Default Style

**`fantasy-novel`** is the default style. Use this unless the user specifically requests mechanical visibility or you are creating LitRPG-style content.

## Style Selection Guidelines

Choose **fantasy-novel** when:
- The goal is immersive, publishable prose
- Readers unfamiliar with D&D should understand everything
- The focus is on character and story over game mechanics
- Converting sessions for a general fantasy audience

Choose **mechanics-visible** when:
- The reader wants to remember how the session played out mechanically
- Creating LitRPG or GameLit style content
- The novelization serves an educational purpose
- Players want to revisit their characters' mechanical achievements

## Combat Chapters

For any chapter featuring significant combat, load **both**:
1. Your chosen base style (`fantasy-novel` or `mechanics-visible`)
2. `combat-prose.md` as supplementary guidance

The combat-prose file provides specialized techniques for converting turn-based combat into flowing narrative, regardless of whether mechanics are visible or hidden.

## Style Files Structure

Each style file contains:
- Formatting rules (chapters, scenes, breaks)
- Dialogue handling guidelines
- Combat conversion approach
- Ability check/save translation
- Example passages demonstrating the style

Load the appropriate style file before beginning novelization work to ensure consistent prose throughout a chapter or book.
