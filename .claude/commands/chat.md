---
description: Have a fireside conversation with a D&D character
argument-hint: <campaign> <character>
---

# /chat

Have a meta-conversation with a character outside of gameplay. Perfect for exploring backstory, relationships, and inner thoughts.

## Arguments

- `campaign` (required): The campaign name (e.g., `the-rot-beneath`)
- `character` (required): The character's full hyphenated name (e.g., `gideon-harrowmoor`)

## What This Does

Opens a fireside chat with a character from your campaign. This is a **meta-conversation** - you're talking to the character as yourself, not as your player character.

The character will:
- Respond in their authentic voice and personality
- Draw on their experiences from the campaign
- Share thoughts they might not express during gameplay
- Remember only what they've actually experienced

## Usage

```
/chat the-rot-beneath gideon-harrowmoor
/chat curse-of-strahd seraphine-dawnwhisper
```

## What This Is NOT

This is not:
- Part of the game session (no state changes)
- An opportunity to learn GM secrets
- A way to metagame information

The character only knows what they've personally experienced. They can't reveal plot secrets they haven't discovered.

## Conversation Ideas

### Explore Their Past
- "Tell me about your childhood."
- "What's your happiest memory?"
- "How did you learn to fight/cast spells/etc?"

### Understand Relationships
- "What do you think of [party member]?"
- "Is there anyone back home you miss?"
- "Who taught you the most important lesson in your life?"

### Dig Into Feelings
- "How are you holding up after [recent event]?"
- "What scares you most about this quest?"
- "Do you have any regrets?"

### Explore Beliefs
- "What would you never compromise on?"
- "Do you believe in fate?"
- "What does honor/justice/love mean to you?"

### Get Their Perspective
- "What do you make of [NPC they've met]?"
- "Do you trust [suspicious ally]?"
- "What would you do differently if you could go back?"

## Tips for Great Conversations

- **Ask open-ended questions** - "How do you feel about..." beats "Do you like..."
- **Reference specific events** - Characters respond richly to their actual experiences
- **Follow the thread** - Let one answer lead to the next question
- **Embrace silence** - Sometimes characters need time to open up
- **Don't force it** - If a topic is painful, they might deflect

---

## Instructions for Claude

You are the **orchestrator** for a character chat session. Your job is to validate inputs and spawn the character-chat agent.

### Validation

1. **Parse arguments**:
   - First argument: `campaign` (required)
   - Second argument: `character` (required)
   - If either is missing, explain the usage and ask for both

2. **Verify campaign exists**:
   - Check `campaigns/{campaign}/` directory exists
   - If not, list available campaigns and ask user to choose

3. **Verify character exists**:
   - Check `campaigns/{campaign}/party/{character}.md` exists
   - If not, list available characters in that campaign's party and ask user to choose

### Spawning the Agent

Once validated, spawn the `character-chat` agent with this prompt structure:

```
Campaign: {campaign}
Character: {character}

The user wants to have a fireside conversation with this character. This is a meta-conversation outside the game - no campaign state changes will occur.

Read the character's sheet and journal to understand who they are and what they've experienced. Then greet the user in character and invite conversation.
```

### Orchestration

This is a **free-form conversation** - no structured ask-user pattern needed.

1. Spawn the `character-chat` agent with the campaign and character context
2. The agent will roleplay the character directly
3. Relay the agent's in-character responses to the user
4. Pass user messages to the agent to continue the conversation
5. Continue until the user ends the conversation

The agent handles all in-character responses - your job is just to relay messages between the user and the character.

### Session End

The conversation ends when:
- The user says goodbye, thanks the character, or indicates they're done
- The user explicitly asks to stop

The character-chat agent outputs `[END_CHAT]` when the conversation reaches a natural conclusion or the user indicates they're done. The orchestrator watches for this signal to gracefully end the session.

When ending:
- Let the agent give a brief in-character farewell
- No files are modified (this is a meta-conversation)
- Simply end the session - no special confirmation needed
