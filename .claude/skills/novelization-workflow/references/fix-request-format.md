# Fix Request Format

Template for `fix-requests.md`. Written by the continuity agent when blocking issues are found.

## Template

```markdown
# Fix Requests

## Blocking Issue 1
- **Chapter**: N
- **Location**: Lines X-Y
- **Issue**: Description of the contradiction/error
- **Suggested Fix**: How to correct it while preserving voice
- **Context**: Surrounding narrative context

## Blocking Issue 2
...
```

## Notes

- Each fix should be specific enough for the writer (FIX mode) to apply surgically
- Include enough context that the fixer can match the surrounding voice
- Suggested fixes should be minimal — change as little as possible
- The user reviews and approves fixes before the fixer agent runs (creates `fix-requests-approved.md`)
