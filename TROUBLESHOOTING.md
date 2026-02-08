# Troubleshooting

Common issues and their solutions. For general setup help, see [QUICKSTART.md](QUICKSTART.md).

## Prerequisites Issues

### "toss: command not found"

**Cause:** The `toss` dice roller is not installed.

**Solution:**
```bash
brew tap shhac/tap && brew install toss
toss 1d20  # verify it works
```

If `brew` is not available, install Homebrew first: [brew.sh](https://brew.sh).

### "claude: command not found"

**Cause:** Claude Code is not installed or not in your PATH.

**Solution:** Follow the installation instructions at [claude.ai/claude-code](https://claude.ai/claude-code), then verify:
```bash
claude --version
```

---

## Campaign Issues

### "Campaign not found" or wrong campaign name

**Cause:** Campaign directory does not exist or the name is misspelled.

**Solution:**
1. Run `/campaigns` to see available campaigns and their exact names
2. Campaign names are lowercase with hyphens (e.g., `the-dimming`, not `The Dimming`)
3. If you have not created a campaign yet, run `/new-campaign`

### Campaign state seems wrong or outdated

**Cause:** The GM may not have saved state after the last session, or a session ended abruptly.

**Solution:**
1. Check `campaigns/{name}/story-state.md` -- this is the GM's last known state
2. Check `campaigns/{name}/scenes/` -- the narrator may have captured more recent events
3. Run `/play {campaign}` again -- the GM reads state files on startup and resumes from the last save
4. If state files are corrupted, you can edit them manually (they are plain markdown)

---

## Session Issues

### Session ended abruptly without "[SESSION_END]"

**Cause:** Context limit reached, agent error, or network interruption.

**Solution:**
1. Check if `story-state.md` was recently updated (the GM saves state after each scene)
2. Run `/play {campaign}` to start a new session -- it picks up from saved state
3. If the last scene was not captured, check `scenes/` for the narrator's record and manually update `party-knowledge.md` if needed

### GM is not ending the session when asked

**Cause:** Known issue -- the GM sometimes continues narrating after receiving an "end session" command.

**Solution:**
1. Say "end session" clearly when prompted for action
2. If the GM continues, repeat the request
3. The system will enforce shutdown after persistent commands

### AI party members are too agreeable

**Cause:** AI players default toward cooperation. The Internal Conflict Engine (ICE) system adds variability, but results depend on dice rolls.

**Solution:** This is expected behavior that improves over sessions. Characters with stronger flaws and competing bonds produce more conflict. If a character feels flat, consider editing their character sheet to add sharper internal tensions.

### No dice rolls during the session

**Cause:** Known issue -- the GM sometimes defaults to narrative resolution instead of calling for rolls.

**Solution:**
1. When prompted for action, you can request a roll explicitly (e.g., "I want to roll Perception to check for traps")
2. This is being addressed in the GM agent. Future sessions should include more mechanical rolls.

### Session feels too fast / not enough breathing room

**Cause:** The GM may be rushing through beats without allowing inter-party reactions.

**Solution:**
1. When prompted, take time to interact with party members before advancing the plot
2. Ask to "talk to [character name]" or "discuss this with the party" to create space
3. The GM targets 3-5 beats per session and should pause after major revelations

---

## Novelization Issues

### Novelization produces inconsistent character details

**Cause:** The continuity system runs after writing, not during. Early chapters may have details that conflict with later ones.

**Solution:**
1. The continuity check phase catches most issues
2. Review `continuity-notes.md` after the pipeline completes
3. Use `--review-each` to pause after each chapter for manual checking

### Voice Lock checkpoint -- what should I look for?

The Voice Lock checkpoint (after Chapter 1 is edited) sets the tone for the entire novel. When reviewing:
1. Does the prose voice match your campaign's tone?
2. Are character voices distinct and consistent with their sheets?
3. Is the balance of dialogue to description right?

Approve only when you are satisfied. All subsequent chapters follow this template.

---

## Audiobook Issues

### Python venv errors

**Cause:** The virtual environments for TTS engines are not set up.

**Solution:**
1. These are optional -- only needed for audiobook generation
2. Follow the setup instructions in CLAUDE.md under "Python Virtual Environments"
3. Always activate the correct venv before running scripts:
   ```bash
   source .chatterbox-venv/bin/activate && python scripts/chatterbox-audiobook.py ...
   ```

### Audio quality issues

**Cause:** Chatterbox TTS quality depends on the voice samples used for cloning.

**Solution:**
1. Use `--test-voices` to generate short samples for each character before full generation
2. Try different voice samples from `.chatterbox-voices/`
3. See the **audiobook-orchestration/voice-samples** skill for sample guidelines

---

## Getting More Help

- [QUICKSTART.md](QUICKSTART.md) -- First session walkthrough
- [FAQ.md](FAQ.md) -- Frequently asked questions
- [ARCHITECTURE.md](ARCHITECTURE.md) -- How the system works under the hood
- [CLAUDE.md](CLAUDE.md) -- Full command reference and campaign file documentation
