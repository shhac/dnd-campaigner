# Full-Auto Mode (All AI Players)

When running a session with no human player (all characters are AI-controlled).

## Startup Differences

- Skip player character selection (no human character)
- All characters use `player-teammate` agent type with `Control: AI`
- Team lead is a pure observer/orchestrator — no human I/O

## Session Start Message

```
[SESSION_COMMAND]
command: start
campaign: {campaign}
mode: full_auto
narrative_style: {style}
ai_characters:
  - {char1}
  - {char2}
  - {char3}
  - {char4}
```

## During Session

- No human input prompts to handle
- Display `[NARRATIVE]` broadcasts to the human observer
- The human observer can send `[SESSION_COMMAND] save` or `end` at any time
- The human observer does NOT control any character

## GM Pacing Guidance

Without a human creating natural pauses, the GM must self-pace:
- Allow 2-3 exchanges of inter-party dialogue between plot beats
- Use `INTERACTION` request type to create deliberate breathing room
- Don't advance to the next scene until player reactions have settled
- Target 2-4 major beats per scene, not more
