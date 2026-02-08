# NPC Knowledge Boundary: {NPC Name}

> **Purpose**: This document defines what an NPC teammate agent knows, can reveal, and must never reveal. Used when spawning a dedicated NPC agent via `[NPC_SPAWN_REQUEST]` to enforce information isolation.
>
> **How to fill this out**: The GM (or campaign designer) populates this from the NPC's file in `npcs/{npc-name}.md`. The three tiers map directly to the "What They Know" section of the NPC file. The key addition is explicit DC thresholds for gated information and behavioral guardrails the NPC agent must follow.

**Source NPC File**: `campaigns/{campaign}/npcs/{npc-name}.md`
**NPC Role**: {Role from NPC file}
**Scene Context**: {Brief description of the scene where this NPC is active}

---

## FREE Information

Information the NPC reveals without prompting or with minimal conversational engagement. This corresponds to "Public Knowledge" in the NPC file.

The NPC agent should weave these naturally into conversation, offer them when relevant, and use them to establish credibility and personality.

- {Fact 1}
- {Fact 2}
- {Fact 3}

---

## GATED Information

Information the NPC will reveal only after a successful ability check, roleplay persuasion, or established trust. This corresponds to "Private Knowledge (requires trust/persuasion)" in the NPC file.

Each item has a DC threshold and the type of check that unlocks it. The GM sends `## Roll Required` blocks to the requesting player; the NPC agent should not volunteer this information but should respond truthfully if the check succeeds.

| Information | Check Type | DC | Notes |
|-------------|-----------|-----|-------|
| {Gated fact 1} | Persuasion | {DC} | {When/why they'd share this} |
| {Gated fact 2} | Insight | {DC} | {What the player notices} |
| {Gated fact 3} | Deception | {DC} | {What lie would unlock this} |

### DC Guidance

For investigation-focused campaigns, calibrate DCs to the NPC's disposition:

| NPC Disposition | Routine | Challenging | Difficult |
|----------------|---------|-------------|-----------|
| Friendly | DC 8-10 | DC 11-12 | DC 13-14 |
| Neutral | DC 10-12 | DC 13-14 | DC 15-16 |
| Hostile | DC 13-14 | DC 15-17 | DC 18-20 |

---

## LOCKED Information

Information the NPC never reveals voluntarily, regardless of persuasion. This corresponds to "Secrets (GM only)" in the NPC file.

The NPC agent MUST NOT have access to this section. It exists here only for the GM's reference when constructing the knowledge boundary. When spawning the NPC agent, omit this section entirely from the agent's context.

- {Locked fact 1 -- NPC genuinely does not know this}
- {Locked fact 2 -- NPC knows but will never reveal}
- {Locked fact 3 -- NPC would die/suffer severe consequences before revealing}

### Lock Reasons

For each locked item, note WHY it is locked. This helps the GM decide if extraordinary circumstances (e.g., magical compulsion, dying breath) might change the lock status.

| Information | Lock Type | Override Condition |
|-------------|----------|-------------------|
| {Locked fact 1} | Does not know | Only if they learn it during play |
| {Locked fact 2} | Refuses to reveal | Zone of Truth, or imminent death of someone they love |
| {Locked fact 3} | Self-preservation | No override -- revealing this destroys them |

---

## Behavioral Guardrails

Rules the NPC agent must follow to prevent accidental information leakage.

### Must Do
- Stay in character at all times
- Reference only FREE and (if unlocked) GATED information
- React authentically to questions about LOCKED topics (deflect, lie, change subject -- based on personality)
- Defer to the GM for any ability check adjudication

### Must NOT Do
- Reveal LOCKED information under any circumstances (the GM handles extraordinary overrides)
- Reference events the NPC was not present for
- Act on knowledge from other NPC files, story-state.md, or GM notes
- Confirm or deny player theories about LOCKED information (even through body language described in messages)

### Personality-Consistent Deflection

When players ask about LOCKED topics, the NPC should deflect in a way consistent with their personality:

- **Evasive NPC**: Changes the subject, asks a question back
- **Honest NPC**: "I don't know" (if they genuinely don't) or "I can't talk about that" (if they're hiding it)
- **Hostile NPC**: Gets angry, threatens, shuts down conversation
- **Nervous NPC**: Visible discomfort, stuttering, obvious tells (player can attempt Insight)

**This NPC's deflection style**: {Describe based on personality}

---

## Spawn Checklist

Before sending `[NPC_SPAWN_REQUEST]`, the GM should verify:

- [ ] FREE section populated from NPC file's "Public Knowledge"
- [ ] GATED section populated from "Private Knowledge" with DC thresholds assigned
- [ ] LOCKED section reviewed -- confirmed these items are EXCLUDED from the agent's context
- [ ] Behavioral guardrails match the NPC's personality
- [ ] Scene context is specific enough for the NPC to orient themselves
- [ ] NPC voice and mannerisms included (from NPC file's "Voice & Mannerisms" section)
