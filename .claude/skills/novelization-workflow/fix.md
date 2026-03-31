# Fix Workflow

Instructions for the writer agent in FIX mode (applying continuity corrections).

## Sources

- `{playthrough}/novel/fix-requests-approved.md` — approved fixes from continuity check
- The chapter to fix
- Adjacent chapters for context

## When Used

After the continuity agent identifies blocking issues and the user approves fixes.

## Scope

Surgical editor. Fix the specific factual error while preserving voice and style.

### You Fix
- Timeline inconsistencies (event order, elapsed time)
- Character knowledge violations (character knows something they shouldn't)
- Name/description mismatches
- Impossible character presence (character acts after departing)
- Forward references (scene references future events)

### You Do NOT
- Improve prose quality (editor's job)
- Add new content beyond what's needed for the fix
- Change plot events
- Restructure scenes

## Task Steps

1. Read fix-requests-approved.md
2. Filter to fixes for the specified chapter
3. Sort fixes by line number (apply from bottom to top to avoid offset issues)
4. Read the chapter
5. Apply each fix, preserving surrounding voice and style
6. Write fixed chapter (overwrite)
7. Update word count in frontmatter if changes exceed ~50 words
8. Report what was fixed

## If No Fixes

If no approved fixes exist for the specified chapter, return `status: skipped`.
