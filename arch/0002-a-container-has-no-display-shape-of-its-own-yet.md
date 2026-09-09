# A container has no display shape of its own yet

## Context

Stage prints a room's own description and nothing else. ZIL does more: an open container recites its contents underneath itself, indented, both in the room and in the inventory, so a sack standing in a room says what is in it without a second command. Stage has real containment - a thing may be `in:sack` and every reader that matters treats it as reachable through the sack - but no room or inventory listing reads that fact back to the player. This is the engine's own *nested description* gap, still open.

Two places in the port ran into it before either could be written the ordinary way.

## Decision

**A room's own text is written by hand for each combination things standing in it can be in**, rather than left to a container recitation that does not exist. The kitchen has four descriptions and Maze 5 has eight - one per combination of things still where the game put them, kept in step by the author rather than derived.

**A treasure taken back out of the trophy case is sent `offstage` rather than back `in:trophy-case`.** Depositing a treasure already sends it offstage on purpose - `put` scoring, `arch/0026`'s `move-tagged` work in the engine, none of it changes this - but the choice matters more on the way out. A thing sitting `in:trophy-case` would be invisible in the room's own text, since nothing recites a container's contents, while still being reachable by `get`, silently, letting a player retake a treasure whose score was never taken back. Offstage cannot be named by the parser at all, so there is nothing for a second `get` to answer for - worse for a player who wants their map back, and honest about what the case can currently say.

## Consequences

The kitchen and Maze 5's four and eight descriptions are real content, correct as written, and do not need revisiting once nested description exists - they would simply become one description each rather than several, an author's cleanup rather than a bug fix. A treasure taken out of the case is gone for good rather than merely deposited-and-withdrawn; the score it earned is not returned either, which is the honest half of the same choice rather than a separate one.

## Alternatives

**Real containment for the trophy case specifically** - putting a treasure `in:trophy-case` and leaving it there - was tried and rejected directly: it reopens the exact gap `put`'s own offstage choice exists to avoid. A treasure sitting unseen in a container the room cannot describe is worse than one that cannot be retrieved at all, so the safer failure was kept.
