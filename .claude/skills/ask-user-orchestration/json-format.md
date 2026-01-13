# Ask-User JSON Format

Agents output questions in this exact JSON structure inside `ask-user` code blocks.

## Question Array Structure

```json
{
  "questions": [
    {
      "question": "What tone do you want for your campaign?",
      "header": "Tone",
      "options": [
        {
          "label": "Dark and gritty",
          "description": "Morally complex, consequences matter, death is real"
        },
        {
          "label": "Heroic fantasy",
          "description": "Classic good vs evil, heroes rise to challenges"
        },
        {
          "label": "Comedy/lighthearted",
          "description": "Fun adventures, humor, low stakes"
        }
      ],
      "multiSelect": false
    }
  ]
}
```

## Field Reference

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `question` | Yes | string | The full question text |
| `header` | Yes | string | Short label (max 12 chars) |
| `options` | Yes | array | 2-4 choices |
| `multiSelect` | Yes | boolean | Allow multiple selections |

### Option Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `label` | Yes | string | Display text (1-5 words) |
| `description` | Yes | string | Explanation of this choice |

## Constraints

- **2-4 options per question**: AskUserQuestion requires this range
- **1-4 questions per block**: Don't overwhelm the user
- **"Other" is automatic**: Users can always provide custom input
- **Header max 12 chars**: Displayed as chip/tag

## Multiple Questions Example

```json
{
  "questions": [
    {
      "question": "What's the campaign setting?",
      "header": "Setting",
      "options": [
        {"label": "Forgotten Realms", "description": "Classic D&D setting"},
        {"label": "Original world", "description": "Create something new"},
        {"label": "Historical fantasy", "description": "Real world + magic"}
      ],
      "multiSelect": false
    },
    {
      "question": "Which themes interest you?",
      "header": "Themes",
      "options": [
        {"label": "Political intrigue", "description": "Factions, power plays"},
        {"label": "Exploration", "description": "Unknown lands, discovery"},
        {"label": "Mystery", "description": "Secrets, investigation"},
        {"label": "War", "description": "Battles, military campaigns"}
      ],
      "multiSelect": true
    }
  ]
}
```

## For Agents: Output Rules

When you need user input:

1. Format questions as JSON in an `ask-user` block
2. Output the block
3. **STOP immediately** - do not continue
4. Wait to be resumed with answers

```markdown
I have some questions to help shape the campaign.

```ask-user
{
  "questions": [...]
}
```
```

After outputting the block, say nothing more. The orchestrator will handle it.
