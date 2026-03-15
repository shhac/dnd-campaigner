# Activity Visualization

How the team lead displays character activity to the human between narrative beats.

## Data Sources

1. `[ACTIVITY]` pings from player teammates (real-time, between beats)
2. `## Party Activity` footer in `[NARRATIVE]` broadcasts (at beat boundaries)

## Rendering

Maintain a map: {character_name -> last_activity_description}
- Initialize all characters to "waiting" at session start
- Update on each `[ACTIVITY]` ping
- Reset all to "waiting" after displaying a `[NARRATIVE]`

## Display Rules (respects verbosity setting)

- **quiet**: No activity display
- **normal**: Show `## Party Activity` footer from narratives. Show `[ACTIVITY]` pings as compact block between narratives.
- **verbose**: Same as normal plus timestamps on `[ACTIVITY]` pings.

When an `[ACTIVITY]` ping arrives:
1. If first ping since last narrative, display the activity block header
2. Update the character's entry
3. Display compact block:

```
━━━ Party ━━━
  Eamon       rolling Arcana
  Silani      speaking with Korimeth
  Korimeth    waiting
  Thaneshi    journaling
━━━━━━━━━━━━━
```

When a `[NARRATIVE]` arrives:
1. Display the narrative (including `## Party Activity` footer)
2. Clear the activity map (reset all to "waiting")
