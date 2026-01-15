---
name: novelization-style
description: Provides tone and style guidelines for converting D&D campaigns into prose fiction. Load only the relevant tone and style files.
---

# Novelization Style Skill

## Overview

This skill provides guidance for converting D&D campaign sessions into light novel format prose. It helps transform play logs, decision records, and character journals into engaging fiction while preserving the collaborative, emergent nature of tabletop roleplaying.

The novelization process adapts actual gameplay into readable prose, maintaining character voices, party dynamics, and the unpredictable energy that makes D&D stories unique. Unlike traditional novel writing, D&D novelization must honor what actually happened at the table while shaping it into compelling narrative.

## Tone Selection

Choose a tone based on the campaign's dominant themes and atmosphere. The tone file sets emotional register, pacing sensibilities, and thematic emphasis.

Reference `tones/index.md` for the complete list of available tones with descriptions.

**Selection principle**: Match the campaign's `overview.md` themes. A horror campaign uses `grimdark` or `gothic`; a heroic adventure uses `heroic` or `pulp-adventure`. Mixed-tone campaigns should pick the dominant mood or switch tones between story arcs.

**Load only one tone file per novelization session.** Mixing tones creates tonal whiplash.

## Style Selection

Style controls prose mechanics: sentence structure, vocabulary level, description density, and technical choices.

Reference `styles/index.md` for available styles.

**Default style**: `fantasy-novel` - balanced, accessible prose suitable for most campaigns.

**For action-heavy chapters**: Load both your chosen style file AND `styles/combat-prose.md`. The combat reference provides specific techniques for fight choreography that layer on top of your base style.

## Chapter Structure Conventions

### Word Count Targets

| Chapter Type | Word Count | Purpose |
|--------------|------------|---------|
| Action | 2000-2500 | Combat, chase scenes, intense conflict |
| Breath | 2500-3500 | Character moments, camp scenes, relationship building |
| Revelation | 1500-2000 | Plot discoveries, puzzle solutions, lore dumps |
| Transition | 1000-1500 | Travel, time skips, scene bridges |

**Chapter Length Flexibility**: These targets are guidelines, not constraints. Epic climactic moments—the final confrontation, the desperate last stand, the long-awaited reunion—can exceed targets significantly, up to 4000 words when the scene demands it. Conversely, multiple consecutive short chapters work well for rapid action sequences where momentum matters more than depth. Trust the story's needs over rigid targets.

### POV Handling

Single POV per chapter is strongly preferred. This maintains intimacy and prevents head-hopping confusion.

If a POV switch is absolutely necessary (such as cutting away to show danger the protagonist cannot see), limit to **one switch per chapter** with a clear scene break marker.

When the session logs show multiple character perspectives, choose the POV that creates the most tension or emotional resonance for that chapter's events.

### Scene Transitions

Use white space (scene breaks) for:
- Time jumps greater than one hour
- Location changes
- POV switches (if unavoidable)
- Tonal shifts within a chapter

Avoid excessive scene breaks. Three per chapter maximum. More fragments the reading experience.

### Dialogue vs Prose Balance

| Chapter Type | Dialogue Target | Notes |
|--------------|-----------------|-------|
| Breath | ~40% | Character interaction drives these chapters |
| Action | ~20% | Brief exchanges, battle cries, tactical shouts |
| Revelation | ~30% | Explanation balanced with reaction |
| Transition | ~25% | Light conversation during travel/downtime |

## Light Novel Conventions

**Short, punchy chapters**: Target 2-3k words. Readers should finish chapters in one sitting. This creates natural stopping points and maintains momentum.

**Chapter titles as hooks**: Titles should intrigue, not spoil. "The Thing in the Well" beats "Bram Dies Fighting the Aboleth." Avoid numerical chapter titles; each deserves a proper name.

**Varied endings**: Not every chapter needs a cliffhanger. Alternate between:
- Cliffhangers (danger arrives, revelation mid-sentence)
- Emotional beats (character realization, relationship shift)
- Quiet closure (camp settled, watch begins)
- Questions raised (mystery deepened, choice looming)

**Quick scene establishment**: Get into scenes fast. One or two sentences of setting, then into action or dialogue. Save elaborate description for moments that earn it.

## What Makes It Feel Like D&D

The prose should feel like a D&D story, not just generic fantasy. Preserve these elements:

**Party decision moments**: Include group debates, tactical planning, the "so what do we do?" discussions. These scenes of collective choice are quintessentially D&D. Show characters arguing, persuading, compromising.

**Implied dice randomness**: Characters sometimes fail at things they should succeed at. They sometimes pull off the impossible. Let outcomes feel genuinely uncertain without ever mentioning dice or mechanics.

**Ensemble feel**: No single protagonist. Even if one character has POV, the party acts together. Victories belong to the group. Keep multiple characters active in every scene.

**Characters surprising each other**: In D&D, players surprise each other constantly. Characters should have moments that catch their companions off guard. Maintain that sense of "I can't believe they just did that."

**Emergent narrative**: Honor what actually happened, even if it is not what a planned novel would do. The thief really did decide to steal from the quest-giver. The paladin really did spare the villain. Let the story be messy, surprising, and real.

## Party Dynamics

The adventuring party is a unique social unit that evolves dramatically over a campaign's arc. Early sessions feature strangers with competing agendas; late-campaign chapters show a forged family who finish each other's sentences.

**Early-campaign awkwardness**: Characters do not trust each other yet. They watch their belongings, keep secrets close, and second-guess motivations. Write this tension explicitly. The rogue sleeps with one eye open. The cleric prays alone. Party members address each other formally or by title.

**Characters disagreeing without breaking the narrative**: Disagreement is healthy and realistic. The paladin wants to turn the prisoner over to authorities; the ranger wants to execute him in the field. Write the argument with respect for both positions. Characters can be frustrated with each other without the party fracturing. The resolution often involves compromise, one character deferring, or external events forcing a choice.

**Secrets between party members**: This is dramatic irony gold. The reader knows the wizard is hiding their noble heritage; the other characters do not. Let the secret create tension in small moments. A near-slip, a suspicious glance, a lie that almost unravels. When secrets finally emerge, the payoff lands because readers have been anticipating it.

*Note on AI character secrets*: If an AI party member holds a secret from the human player, flag this in chapter notes for review before finalization—the novelization might accidentally reveal information the human player has not discovered yet.

**The moment trust is earned**: This usually follows shared trauma. After surviving the ambush together, after one character saves another's life, after confessing something shameful and being accepted anyway. Mark these moments clearly in the prose. Something shifts. A character uses a first name for the first time. Someone shares their rations without being asked.

**Inside jokes and callbacks**: These develop naturally and should not be forced. If a character made an embarrassing mistake in chapter three, another character might reference it affectionately in chapter twelve. These callbacks reward attentive readers and make the party feel real.

**The found family dynamic**: By late campaign, the party has become something none of them expected. They have seen each other at their worst and stayed anyway. Write this intimacy through action rather than declaration. Characters anticipate each other's needs. They defend each other instinctively. The word "home" starts meaning wherever the party is.

## Flashbacks and Backstory Integration

Backstory enriches characters but must be integrated carefully to avoid halting narrative momentum.

**Present tense for casual mentions**: When characters reference their past in conversation, stay in present tense. "My father taught me that knot" works better than a scene of the father teaching. The past informs the present without hijacking it.

**Brief flashbacks for emotional reveals**: When a present moment triggers a powerful memory, a short flashback can land hard. Italicize these clearly and keep them brief—a paragraph or two, rarely more. Enter the flashback through a sensory trigger (a smell, a sound, a phrase) and exit back to the present through the POV character's physical reaction.

**Anchor to the POV character**: Never flashback to events the POV character was not present for. If the rogue's tragic backstory needs revealing and the cleric has POV, the rogue must tell the story in present-time dialogue. This constraint actually improves the scene—we get the story filtered through both characters.

**Let backstory emerge naturally**: Characters do not info-dump their histories. Backstory surfaces through dialogue under pressure, through reactions to present events, through quiet moments of reflection. The reader pieces together the past gradually, which creates investment.

### Humor in D&D Fiction

D&D tables laugh constantly—nervous laughter at close calls, triumphant laughter at clever solutions, helpless laughter at catastrophic failures. Honor this.

**Banter between party members**: Characters tease each other, make running jokes, and engage in friendly mockery. This is how affection is expressed at most tables. Write banter that reveals character—what each person finds funny says something about them.

**Absurd solutions that somehow worked**: The barbarian's "plan" to intimidate the door into opening. The bard seducing the dragon. These moments define D&D and deserve celebration in prose. Play them straight; the humor comes from the situation.

**The legendary fumble**: When something goes memorably wrong, lean into it. These become the stories players tell for years. A fumbled stealth check that alerts the entire dungeon. A critical failure on a persuasion check that starts a war.

**Balance with drama**: Humor should not undercut genuine dramatic moments. The funeral is not the time for quips. But immediately after the tension breaks, laughter is natural and even necessary. Characters joke to cope.

**Preserving awkward-timing humor**: When a character cracked a joke at an awkward moment (mid-combat quip, funeral humor), decide whether it serves characterization (the character who deflects with humor) or should be softened for tonal consistency. Some tables embrace chaos; others prefer polish.

**Character-appropriate wit**: The rogue has cutting one-liners. The paladin's humor is unintentional—they say something earnest that lands as absurd. The wizard makes dry observations. Let each character's comedic voice be distinct.

## Translating Degrees of Success and Failure

When converting gameplay outcomes to prose, the margin of success matters:

| Outcome | Prose Treatment |
|---------|-----------------|
| Critical success (nat 20) | Effortless, elegant, impressive. The character exceeds their own expectations. Witnesses are awed. |
| Success by wide margin | Confident, controlled. The character clearly knows what they are doing. |
| Success by narrow margin | Tense, close call, relief. Almost did not work. Sweat on the brow. |
| Failure by narrow margin | Almost had it, frustrating. The character knows they were close. Could have gone either way. |
| Failure by wide margin | Clear incompetence or overwhelming opposition. Either the character bungled it badly or faced something beyond their ability. |
| Critical failure (nat 1) | Comedic or catastrophic. Something goes memorably wrong. Played for laughs or tragedy depending on stakes. |

Never mention the actual roll. Translate the outcome into embodied, sensory experience.

## Decision-Log vs Journal Usage

Both sources inform novelization but serve different purposes:

| Source | Contains | Best Used For |
|--------|----------|---------------|
| Decision Log | Objective record of character actions and choices | Plot accuracy, sequence of events, what actually happened |
| Character Journal | Subjective reflections, internal thoughts, feelings | POV voice, emotional subtext, character motivation |

**Workflow**: Use the decision log to establish what happens. Use journals to understand how characters experienced it. The decision log is the skeleton; journals are the flesh.

When sources conflict (a character's journal misremembers or reinterprets events), the decision log is authoritative for facts, but the journal's interpretation reveals character.

## File References

### Tone Files
- Index: `tones/index.md`
- Individual tones: `tones/{tone-name}.md`

### Style Files
- Index: `styles/index.md`
- Individual styles: `styles/{style-name}.md`
- Combat supplement: `styles/combat-prose.md`

Load the index files to see available options, then load only the specific tone and style files needed for your current novelization work.
