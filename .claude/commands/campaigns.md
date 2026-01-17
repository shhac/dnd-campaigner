---
description: List all available campaigns
---

# /campaigns

List all available campaigns in this repository with basic information.

## Usage

```
/campaigns
```

## What This Does

Scans the `campaigns/` directory and displays:
- Campaign names
- Last session date (if sessions exist)
- Brief status overview

---

## Instructions for Claude

### Step 1: Find Campaigns

List all directories in the campaigns folder:
```bash
ls -1 campaigns/
```

If no campaigns exist, inform the user they can create one with `/new-campaign`.

### Step 2: Gather Campaign Info

For each campaign found, collect:

1. **Campaign name** (directory name)
2. **Last session date**: Check `campaigns/{name}/sessions/` for the most recent session file
   - Session files follow pattern `session-*.md`
   - Extract date from filename or file content if available
3. **Overview snippet**: Read first few lines of `campaigns/{name}/overview.md` if it exists
4. **Novelization status**: Check if `campaigns/{name}/novel/` directory exists
   - If exists, note "Novel available"
   - Check for `outline.md` to see chapter count/progress
5. **Audiobook status**: Check if `campaigns/{name}/novel/chatterbox/` directory exists
   - If exists, note "Audiobook available"

### Step 3: Display Results

Present campaigns in a clean format:

```
## Available Campaigns

### {Campaign Name}
- **Last Session**: {date or "No sessions yet"}
- **Setting**: {Brief description from overview.md}
- **Novel**: {Yes (N chapters) / No}
- **Audiobook**: {Yes / No}

### {Campaign Name 2}
...
```

### Step 4: Suggest Actions

After listing, remind the user of available commands:
- `/play {campaign-name}` - Start or continue a session
- `/new-campaign` - Create a new campaign
- `/eject {campaign-name}` - Export as standalone project
