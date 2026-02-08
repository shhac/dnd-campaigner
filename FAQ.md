# Frequently Asked Questions

## Getting Started

### What do I need to run this?

Two things: [Claude Code](https://claude.ai/claude-code) and the `toss` dice roller (`brew tap shhac/tap && brew install toss`). That is it for core gameplay. Python virtual environments are only needed for audiobook generation and can be set up later.

### How long does a session take?

Typically 30-90 minutes, covering 3-5 major scenes. You can end a session at any time by saying "end session" when prompted for action. Progress is saved automatically.

### What happens during play?

The GM describes scenes, prompts you for actions, and your AI party members also respond in character. The cycle repeats: narrative, prompts, responses, narrative. See "What Happens During a Play Session" in [CLAUDE.md](CLAUDE.md) for the full explanation.

---

## Gameplay

### Can I play multiple campaigns?

Yes. Each campaign is independent with its own directory under `campaigns/`. Run `/campaigns` to see all available campaigns.

### Can I edit campaign files manually?

Yes. All files are plain markdown. Edit them in any text editor and `/play` will use the updated content on the next session. This is useful for correcting errors, adjusting character details, or tweaking the world.

### What if I disagree with the GM?

You can veto GM actions or reject NPC offers. When prompted for action, simply say you refuse or push back. The system supports explicit vetoes.

### Can I control what my AI party members do?

Not directly -- that is by design. AI party members act based on their personality, bonds, and flaws as written in their character sheets. If you want to influence their behavior, edit their character sheets to adjust personality traits, bonds, or flaws.

### How do dice rolls work?

The GM calls for rolls when outcomes are uncertain. The `toss` CLI executes the actual rolls. You will see results like `[14] + 5 = 19`. The system uses D&D 5e-inspired mechanics: d20 for ability checks and saves, various dice for damage. You can also request rolls explicitly (e.g., "I want to roll Perception").

### What if I want to play with all AI characters (no human)?

Full-auto mode (all AI, no human player) is supported. The GM self-paces and targets 3-5 beats before looking for a stopping point. Specify this in your campaign preferences.

---

## Between Sessions

### What happens to my progress between sessions?

All state is saved in markdown files: `story-state.md` (GM's world state), `party-knowledge.md` (what the party knows), character journals, and scene files in `scenes/`. Run `/play` again to pick up where you left off.

### Can I chat with characters outside of gameplay?

Yes. Use `/chat {campaign-name} {character-name}` for a fireside conversation. Characters are at rest and willing to be vulnerable. This is read-only and does not affect campaign state.

### Can I go back and replay a scene?

Not automatically, but you can manually edit `story-state.md` to roll back the world state and delete recent scene files from `scenes/`. The next `/play` session will pick up from whatever state the files describe.

---

## Content Pipeline

### Can I turn my campaign into a novel?

Yes. Run `/novelize {campaign-name}` to convert session scenes into edited prose chapters. The pipeline includes planning, writing, editing, continuity checking, and publisher review. Expect 1-3 hours depending on campaign length.

### Can I generate audiobooks?

Yes, but it requires additional setup (Python virtual environments for TTS). Run `/audiobook {campaign-name}` after novelizing. See [CLAUDE.md](CLAUDE.md) for TTS setup instructions.

---

## Technical

### How does information isolation work?

AI party members only see their own character sheet, their journal, and `party-knowledge.md`. They never read `story-state.md`, other characters' sheets, or NPC files. The GM controls what each character learns through direct messages. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full isolation model.

### Can I use this with a real D&D group?

Not currently. The system is designed for solo play with AI party members. It uses Claude Code Teams to orchestrate multiple AI agents, which requires a single human operator.

### What models does this run on?

It runs on whatever model Claude Code uses. The system is model-agnostic within the Claude family -- it uses standard Claude Code capabilities (agents, skills, commands, Teams).

### Where are the AI agent definitions?

Agent definitions are markdown files in `.claude/agents/`. Skills are in `.claude/skills/`. Commands are in `.claude/commands/`. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full list.

---

## More Resources

- [QUICKSTART.md](QUICKSTART.md) -- 30-minute first session walkthrough
- [CLAUDE.md](CLAUDE.md) -- Commands and campaign file reference
- [ARCHITECTURE.md](ARCHITECTURE.md) -- How the system works under the hood
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) -- Common issues and solutions
