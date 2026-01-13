# Ask-User Orchestration Examples

Complete examples of the orchestration pattern in action.

## Example 1: Campaign Creation

### Step 1: Spawn Agent

```
Task: campaign-creator
Prompt: Help the user create a new D&D campaign. Begin by asking about tone and setting.
```

### Step 2: Agent Outputs Ask-User Block

Agent responds with:

~~~markdown
Let's design your campaign! I have a few questions to get started.

```ask-user
{
  "questions": [
    {
      "question": "What tone do you want for your campaign?",
      "header": "Tone",
      "options": [
        {"label": "Dark and gritty", "description": "Morally complex, death is real"},
        {"label": "Heroic fantasy", "description": "Classic good vs evil"},
        {"label": "Comedy", "description": "Lighthearted fun"}
      ],
      "multiSelect": false
    }
  ]
}
```
~~~

### Step 3: Orchestrator Parses and Asks

Extract the JSON, call AskUserQuestion:

```yaml
AskUserQuestion:
  questions:
    - question: "What tone do you want for your campaign?"
      header: "Tone"
      options:
        - label: "Dark and gritty"
          description: "Morally complex, death is real"
        - label: "Heroic fantasy"
          description: "Classic good vs evil"
        - label: "Comedy"
          description: "Lighthearted fun"
      multiSelect: false
```

### Step 4: User Answers

User selects: "Dark and gritty"

### Step 5: Resume Agent

```
Task: campaign-creator (resume)
Prompt: |
  User answered:
  - Tone: Dark and gritty
```

### Step 6: Agent Continues

Agent may ask more questions (repeat loop) or proceed to generate files.

---

## Example 2: Character Creation

### Initial Spawn

```
Task: character-creator
Prompt: |
  Help the user create a character for the "curse-of-shadows" campaign.
  Read the campaign overview first to understand the setting.
  Character type: PC
```

### Agent Asks About Concept

~~~markdown
I've read the campaign overview. Let's create your character!

```ask-user
{
  "questions": [
    {
      "question": "What class appeals to you?",
      "header": "Class",
      "options": [
        {"label": "Fighter", "description": "Martial prowess, weapon master"},
        {"label": "Rogue", "description": "Stealth, skills, sneak attacks"},
        {"label": "Wizard", "description": "Arcane magic, spellbook"},
        {"label": "Cleric", "description": "Divine magic, faith"}
      ],
      "multiSelect": false
    },
    {
      "question": "What race interests you?",
      "header": "Race",
      "options": [
        {"label": "Human", "description": "Versatile, ambitious"},
        {"label": "Elf", "description": "Long-lived, graceful"},
        {"label": "Dwarf", "description": "Sturdy, traditional"},
        {"label": "Half-orc", "description": "Strong, intimidating"}
      ],
      "multiSelect": false
    }
  ]
}
```
~~~

### Resume with Answers

```
User answered:
- Class: Rogue
- Race: Half-orc
```

### Agent Follows Up

Agent may ask about background, personality, or proceed to stat generation.

---

## Parsing Logic

### Extracting JSON from Agent Output

```python
# Pseudocode for parsing
output = agent_response

# Find ask-user block
if "```ask-user" in output:
    # Extract content between markers
    start = output.find("```ask-user") + len("```ask-user")
    end = output.find("```", start)
    json_str = output[start:end].strip()

    # Parse JSON
    data = json.loads(json_str)
    questions = data["questions"]

    # Call AskUserQuestion with questions array
```

### Formatting Answers for Resumption

Convert user selections to natural language:

```
User answered:
- {header1}: {selected_label1}
- {header2}: {selected_label2}
```

For multi-select questions:

```
User answered:
- Themes: Political intrigue, Mystery, War
```

For "Other" selections with custom text:

```
User answered:
- Setting: Other - "A world where magic is dying"
```
