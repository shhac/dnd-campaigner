# Exploration Scene Formatting

Format guide for investigation, searching, and dungeon crawling.

## Markdown Conventions

- **Bold** character names: `**Kira**`, `**Theron**`, `**Lyra**`
- **Bold** important items and discoveries: `**folded parchment**`, `**iron key**`
- *Italic* for descriptions and narration: `*The chamber stretches into darkness.*`
- `Inline code` for all dice roll results
- Keep Unicode symbols (★, ✦, ☠, ⚄) as visual markers

## Area Description

Open with GM narration establishing the space:

```
★ *The chamber stretches thirty feet across, its vaulted ceiling
lost in shadow. Broken crates line the walls, and a thick layer
of dust covers everything—except for a trail of footprints leading
toward the far door.*
```

## Detailed Examination

When players look closer at something:

```
→ ***Kira*** *examines the footprints more closely.*

★ *The prints are fresh—within the last few hours. Bare feet,
small. A child's size. They lead straight to the iron door and
don't return.*
```

## Perception Checks

For passive awareness:

```
⚄ Perception (**Theron**): `1d20+4 = [14]+4 = 18`

✦ **Theron** notices something the others miss—*scratch marks on the
wall near the ceiling, as if something climbed up there.*
```

## Investigation Checks

For active searching:

```
→ ***Lyra*** *searches the desk for anything useful.*

⚄ Investigation: `1d20+5 = [11]+5 = 16 vs DC 12 → SUCCESS`

★ *Beneath a false bottom in the drawer, **Lyra** finds a folded
parchment and a small iron key.*

✦ FOUND: **Coded letter** + **Small iron key**
```

## Failed Searches

```
→ ***Theron*** *searches the crates for supplies.*

⚄ Investigation: `1d20+1 = [4]+1 = 5 vs DC 10 → FAIL`

★ *The crates contain nothing but rotted cloth and rust. If there
was anything valuable here once, it's long gone.*
```

## Discovery Formatting

Major discoveries get the revelation marker:

```
✦ Hidden behind the bookshelf: *a narrow passage, its walls
slick with moisture. A faint breeze carries the smell of decay.*
```

## Trap Detection

```
⚄ Perception (Passive): **Kira** has 15

✦ **Kira** spots a thin wire stretched across the corridor at
ankle height.

★ *Following it with her eyes, she sees it connects to a
mechanism in the wall—probably a crossbow trap.*
```

## Trap Triggered

```
→ ***Theron*** *steps forward.*

★ *CLICK.*

⚄ Dexterity Save: `1d20+1 = [8]+1 = 9 vs DC 13 → FAIL`

★ *A blade swings from the wall. **Theron** throws himself aside,
but not fast enough.*

⚄ Damage: `1d10 = [6] slashing`

☠ **Theron** takes 6 slashing damage from the scything blade.
```

## Environmental Hazards

```
★ *The floor ahead glistens with something wet. The air here
burns your nostrils—acid.*

→ ***Lyra*** *tests it with a copper piece.*

★ *The coin dissolves in seconds, eaten away to nothing.*

⚄ Intelligence (Arcana): `1d20+3 = [16]+3 = 19`

✦ *This is no natural formation. Someone—or something—has been
cultivating this acid pool deliberately.*
```

## Locked Doors

```
→ ***Kira*** *examines the lock.*

⚄ Investigation: `1d20+2 = [14]+2 = 16`

★ *A complex mechanism, but not impossible. She pulls out her
thieves' tools.*

⚄ Thieves' Tools: `1d20+5 = [12]+5 = 17 vs DC 15 → SUCCESS`

★ *The lock clicks open. The door swings inward on silent hinges.*
```

## Secret Doors

```
⚄ Investigation: `1d20+5 = [19]+5 = 24 vs DC 18 → SUCCESS`

✦ **Lyra**'s fingers find an irregularity in the stonework. *A
slight pressure, and a section of wall slides back, revealing
a hidden alcove.*
```

## Room-by-Room Dungeon Progress

```
═══════════════════
**AREA 3: The Offering Chamber**
═══════════════════

★ *The tunnel opens into a circular room. In the center stands
a stone altar, its surface stained dark. Candles—recently
extinguished—ring the altar, wax still warm.*

**Exits:**
• North: Wooden door *(closed)*
• East: Archway *(darkness beyond)*
• Down: Iron grate in the floor *(locked)*
```

## Full Example: Exploration Scene

```
═══════════════════
**The Abandoned Study**
═══════════════════

★ *Dust motes drift through the single shaft of light falling
from a crack in the ceiling. The room was once a study—bookshelves
line the walls, though most have collapsed. A heavy oak desk
dominates the center, its chair overturned.*

→ ***Kira*** *moves to check the room's corners while **Theron** approaches
the desk.*

⚄ Perception (**Kira**): `1d20+4 = [11]+4 = 15`

★ *Nothing lurks in the shadows. The room is empty—but recently
disturbed. Someone has been here within the last day.*

───

→ ***Theron*** *examines the desk.*

⚄ Investigation: `1d20+1 = [16]+1 = 17 vs DC 12 → SUCCESS`

★ *The desk drawers have been ransacked, papers scattered. But
wedged behind the back panel, **Theron** finds something the previous
searcher missed.*

✦ FOUND: A **leather-bound journal**, its pages filled with cramped
handwriting and strange diagrams.

───

→ ***Lyra*** *scans the remaining books on the shelves.*

⚄ Investigation: `1d20+5 = [8]+5 = 13 vs DC 15 → FAIL`

★ *Most of the books are ruined—water damage and rot have claimed
them. If there was anything useful here, it's illegible now.*

───

→ ***Kira*** *checks the door at the far end of the room.*

★ *A sturdy wooden door, iron-banded. Locked. No light visible
beneath it.*

⚄ Perception (Listen): `1d20+4 = [18]+4 = 22`

✦ *Faint sounds from beyond—scratching, like claws on stone.
Something is moving in the next room.*

★ ***Kira*** *holds up a fist. The party freezes.*
```
