# Quickstart: Your First Campaign in 30 Minutes

This guide walks you through creating and playing your first D&D campaign with AI companions. By the end, you will have a world, characters, and your first scene.

## Prerequisites (5 minutes)

### 1. Claude Code (Required)

Claude Code is Anthropic's CLI for Claude. It runs this entire system.

**Install:** Follow the instructions at [claude.ai/claude-code](https://claude.ai/claude-code).

**Verify:**
```bash
claude --version
# Expected: a version number like 1.x.x
```

### 2. Dice Roller (Required)

The `toss` CLI handles all dice rolls during play.

**Install:**
```bash
brew tap shhac/tap && brew install toss
```

**Verify:**
```bash
toss 1d20
# Expected output:
# Rolling 1d20...
# [14] = 14
```

If `brew` is not installed, see [brew.sh](https://brew.sh) first.

---

## Step 1: Create a Campaign (10 minutes)

Open a terminal in the project directory and start Claude Code:

```bash
cd dnd-campaigner
claude
```

Then run the campaign creation command:

```
/new-campaign
```

Claude will ask you a series of questions about your world:

```
What genre or tone are you going for?
> Dark fantasy with mystery elements

What's the setting?
> A coastal city where ancient ruins are surfacing after an earthquake

What themes interest you?
> Lost civilizations, moral ambiguity, the cost of power

What's the opening situation?
> Strange artifacts appearing in the market, people going missing near the ruins
```

Answer each question in your own words. There are no wrong answers -- the system builds around your preferences. After 5-10 questions, it generates:

- `campaigns/your-campaign/overview.md` -- World setting, themes, factions
- `campaigns/your-campaign/story-state.md` -- Starting situation and GM secrets
- `campaigns/your-campaign/world-primer.md` -- Common knowledge for AI players
- `campaigns/your-campaign/party-knowledge.md` -- Shared party knowledge
- `campaigns/your-campaign/preferences.md` -- Narrative style settings

You can review these files, but you do not need to edit them.

---

## Step 2: Create Characters (10 minutes)

Create your player character and 2-3 AI party members:

```
/new-character
```

For each character, Claude asks about:
- Name, species/race, class
- Background and personality
- Bonds, flaws, and goals
- Voice and mannerisms

**Your character** is the one you will control during play. Give them a distinct personality -- the system uses your character sheet to voice your actions in the narrative.

**AI party members** act autonomously during play. They make their own decisions based on personality, bonds, and flaws. Give each one a clear voice and at least one source of internal conflict (a flaw that clashes with their goals, a bond that creates tension).

**Recommended party size:** 3-4 total characters (1 human-controlled + 2-3 AI).

Character sheets are saved to `campaigns/your-campaign/party/`.

**Tip:** Fill out the "Voice & Mannerisms" section thoroughly. The AI plays your party members better when it knows how they talk and react.

---

## Step 3: Play Your First Session (10+ minutes)

Start a session:

```
/play your-campaign-name
```

The system spawns a team of AI agents:
- A **Game Master** who runs the world
- A **Narrator** who records scenes
- **AI players** for each party member
- A **Human Relay** for your character

### What You Will See

**1. The GM sets the scene:**

A narrative block appears in your terminal describing the opening situation -- the environment, NPCs present, the atmosphere. Read it. No action needed yet.

**2. You are prompted for action:**

Your character's relay asks what you want to do:

```
The GM has set the scene at the market square. Merchants are
hawking strange metallic artifacts. A nervous-looking scholar
is examining one near a fountain.

What would you like to do?
- Approach the scholar
- Examine the artifacts yourself
- Watch from a distance
- (Or describe your own action)
```

Type your choice or describe something entirely different. You are not limited to the suggestions.

**3. AI party members react:**

Your AI companions also receive prompts and respond in character. You will see their actions woven into the narrative. They may agree with your plan, suggest alternatives, or act on their own goals.

**4. The GM advances the story:**

All actions feed into the next narrative beat. The GM describes consequences, introduces complications, and moves the story forward.

**5. This cycle repeats:**

Narrative -> prompts -> responses -> narrative, until a natural stopping point. Sessions typically run 30-90 minutes and cover 3-5 major scenes.

### Controlling Your Session

- **End a session:** Type "end session" when prompted. The GM saves state and you can resume later with `/play` again.
- **Switch to autonomous:** If you need to step away, tell the relay to go autonomous. Your character will act on their own personality until you return.
- **Veto an action:** If the GM or an NPC does something you disagree with, say so. You can veto actions or reject NPC offers.

---

## What Happens to Your Progress?

Everything is saved as markdown files in your campaign directory:

- `story-state.md` is updated by the GM after each scene
- `party-knowledge.md` tracks what the party has learned
- `scenes/` contains the narrative record of each session
- `party/{character}-journal.md` holds character reflections

Run `/play your-campaign-name` again to pick up where you left off.

---

## What Next?

### Chat with a character outside of gameplay
```
/chat your-campaign-name character-name
```
Have a fireside conversation with any character. This is read-only and does not affect campaign state. Good for exploring character voice and backstory.

### Turn your campaign into a novel
```
/novelize your-campaign-name
```
Converts your session scenes into edited prose chapters with continuity checking and editorial review.

### See all your campaigns
```
/campaigns
```

### Explore an existing example

The [campaigns/the-dimming/](campaigns/the-dimming/) directory contains a complete campaign with world-building, four characters, and session scenes. Browse it to see what a fully developed campaign looks like, or play it yourself:

```
/play the-dimming
```

---

## Reference

- [CLAUDE.md](CLAUDE.md) -- Project overview, commands, and campaign file reference
- [ARCHITECTURE.md](ARCHITECTURE.md) -- How the agent team system works under the hood
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) -- Common issues and solutions
- [FAQ.md](FAQ.md) -- Frequently asked questions
