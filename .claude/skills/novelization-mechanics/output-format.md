# Output Format Enforcement

## Rule

All novelization agent modes return YAML directly. No markdown code fences.

## Valid Output

```
status: complete
chapter: 3
file: chapter-03-draft.md
word_count: 2340
target_words: 2500
scenes_covered:
  - "The Sewer Junction: Finding Tomlin Greer"
  - "The Revelation About the Silver Veins"
```

> Note: The code blocks above are for documentation readability. Actual output must be raw YAML without any fences or wrappers.

## Invalid Output Patterns

Do NOT:
- Add prose explanation before the YAML
- Wrap output in ```yaml ... ``` code fences
- Omit required fields
- Return chapter content instead of status
- Include conversational text ("Here's the result...")

## Why This Matters

The orchestrating command parses agent output as YAML. Code fences, prose preambles, or missing fields cause parsing failures and require manual intervention.

## Required Fields by Mode

### PLAN / Planner Agent
```
status: complete | error
outline_file: outline.md
tone: {selected-tone}
total_chapters: {N}
chapters: [array of chapter summaries]
```

### WRITE / Writer Agent
```
status: complete | error
chapter: {N}
file: chapter-{NN}-draft.md
word_count: {actual}
target_words: {target}
scenes_covered: [array of scene names]
```

### FIX / Fixer Agent
```
status: complete | skipped | error
chapter: {N}
file: chapter-{NN}-draft.md
fixes_applied: [array of fix descriptions]
fixes_skipped: [array if any]
```

### VALIDATE / Planner Agent (Validate Mode)
```
status: complete
valid: true | false
issues: [array of issue objects]
report_file: validation-report.md  # Only if issues found
```
