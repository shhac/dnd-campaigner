# D&D Campaigner

A solo D&D experience powered by Claude Code, where AI agents play your party members and run the world while you play your character.

## What Is This?

This is a framework for running D&D 5e-inspired campaigns with:

- **You** playing one character
- **AI agents** playing other party members (with isolated knowledge - no metagaming!)
- **An AI Game Master** running the world, NPCs, and story

It uses [Claude Code](https://claude.ai/claude-code) to orchestrate everything through markdown files and slash commands.

## Prerequisites

### Claude Code

You need Claude Code installed. See [claude.ai/claude-code](https://claude.ai/claude-code) for installation.

### Dice Roller

Install the `toss` CLI for dice rolling:

```bash
brew tap shhac/tap && brew install toss
```

Verify it works:

```bash
toss 1d20+5
```

## Quick Start

1. **Clone and enter the repo:**
   ```bash
   git clone <repo-url>
   cd dnd-campaigner
   claude
   ```

2. **Create a campaign:**
   ```
   /new-campaign
   ```
   Answer questions about tone, setting, themes. The system generates your world.

3. **Create characters:**
   ```
   /new-character
   ```
   Create your PC and AI party members. Each gets a full character sheet.

4. **Play:**
   ```
   /play <campaign-name>
   ```
   The GM sets the scene, you declare actions, AI party members contribute.

## How It Works

### Information Isolation

The key innovation: **AI party members don't know things their characters wouldn't know.**

When the GM needs an AI party member to act, it spawns them as a separate process with only:
- Their character sheet
- The current scene description
- Events they personally witnessed

They never see the GM's secret notes, other characters' sheets, or unopened plot threads. This prevents metagaming and creates genuine dramatic tension.

### The Quick-or-Veto System

AI party members aren't passive NPCs. They use a "quick-or-veto" pattern:

1. GM spawns all AI players **in parallel** asking for quick reactions
2. Each can respond briefly (1-2 sentences) OR
3. **Veto** to request full engagement if the situation touches their character deeply

This keeps pacing snappy while giving AI characters real agency.

### Combat Pacing

Combat uses a tiered system:

| Tier | When | Approach |
|------|------|----------|
| **Trivial** | Clearly outmatched foes | Offer quick resolution, narrate cinematically |
| **Standard** | Meaningful encounters | Parallel quick actions, batch AI turns |
| **Critical** | Boss fights, death risk | Full spotlight for dramatic moments |

## Project Structure

```
dnd-campaigner/
├── .claude/
│   ├── agents/           # AI agent definitions
│   │   ├── gm.md         # Game Master
│   │   ├── ai-player.md  # Party member template
│   │   ├── campaign-creator.md
│   │   ├── character-creator.md
│   │   └── dnd-enthusiast.md
│   ├── commands/         # Slash commands
│   │   ├── new-campaign.md
│   │   ├── new-character.md
│   │   ├── play.md
│   │   ├── campaigns.md
│   │   └── eject.md
│   └── skills/           # Reusable capabilities
│       ├── dice-roll/
│       ├── ability-check/
│       ├── name-generator/
│       └── random-events/
├── templates/            # Markdown templates
│   ├── player-character.md
│   ├── npc.md
│   ├── campaign-overview.md
│   ├── story-state.md
│   ├── session-log.md
│   ├── relationships.md
│   └── ...
├── campaigns/            # Your campaigns live here
│   └── <campaign-name>/
│       ├── overview.md
│       ├── story-state.md
│       ├── party/
│       ├── npcs/
│       ├── locations/
│       ├── factions/
│       ├── items/
│       └── sessions/
├── CLAUDE.md             # Instructions for Claude
└── README.md             # You are here
```

## Commands

| Command | Description |
|---------|-------------|
| `/new-campaign` | Create a new campaign through interactive worldbuilding |
| `/new-character` | Create a PC or NPC for a campaign |
| `/play <campaign>` | Start or continue a session |
| `/campaigns` | List all available campaigns |
| `/eject <campaign>` | Export a campaign as a standalone project |

## Ejecting Campaigns

Want to share a campaign or play it separately? Use `/eject`:

```
/eject curse-of-strahd ~/my-campaign
```

This creates a fully standalone project with all necessary agents, skills, and commands. The ejected campaign works independently of this repo.

## Rules System

D&D 5e-inspired, theater of the mind:

- Core d20 mechanics (ability checks, saves, attacks)
- Advantage/disadvantage
- Narrative combat (no grid)
- GM interprets intent generously

The `ability-check` skill includes DC tables, conditions reference, and saving throw guidance. The `random-events` skill adds weather, encounters, and rumors to make the world feel alive.

## Tips for Good Sessions

1. **Fill out character voice sections** - The AI plays your party members better when it knows how they talk and react

2. **Use the relationships template** - Tracking who trusts whom creates better roleplay

3. **Let AI characters veto** - When they request full engagement, something interesting is happening

4. **Embrace the chaos** - Use `/random-events` to surprise yourself

5. **Update story-state after sessions** - The GM reads this to maintain continuity

## Contributing

This is a personal project, but feel free to fork and adapt it. The templates and agents can be customized for different rule systems or play styles.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Built with [Claude Code](https://claude.ai/claude-code)*
