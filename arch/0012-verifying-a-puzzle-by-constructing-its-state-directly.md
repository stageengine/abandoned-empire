# Verifying a puzzle by constructing its state directly

## Context

`arch/0011`'s checkpoint fixes replay, not the lamp. A checkpoint-driven script can still die in the dark partway through the back half of the game, because the lamp's 185-turn battery is real and a padded fight's own turn cost is real, and neither interpreter can be pointed past that wall by anything `tools/audit.py` does on its own. Something else was needed to actually check the puzzles sitting past it: the dam, the coal mine, the river, the ending.

## Decision

Skip the walk. `createGame`'s own `restore(state)` takes a plain object matching a save's shape, so a state for exactly the room, inventory, and flags a puzzle needs can be built by hand - `JSON.parse(JSON.stringify(game.state))`, edit the copy, `restore` it - and the puzzle tested from there directly, no script and no checkpoint chain required.

This found and closed real bugs a full playthrough could not reach:

- **The dam's reservoir drain** - placed at Dam Base with the pump in hand, confirmed the drain takes exactly the eight turns ZIL's own `<QUEUE I-REMPTY 8>>` says it should.
- **The coal mine's basket** - placed at each end of the shaft in turn, found `put torch in basket` did nothing (`contains: true` was missing on both basket objects), that fixing that alone left the basket's contents behind when it swapped ends (fixed with a `move-tagged`), and that both `lower` and `raise` sent the basket `to: here` - the player's own room - rather than the fixed room at the other end, so a lowered basket was reachable from the wrong end and never the right one.
- **Eight deaths skipping the two-resurrections rule** - found by placing the player in the sand pit and digging past the point that should kill and resurrect, not end, and noticing the game just ended. Traced to the grue, both drownings, the Canyon View jump, and two burns all calling `end-game` directly where ZIL's own `JIGS-UP` treats every death identically - the single most common way to die in the game was unconditionally final on its first occurrence.
- **The river, the coal mine's own exit back to the trophy case, and the winning sequence itself** - each placed directly at its own starting point and played through by hand; all confirmed correct, not bugs.

Two things make this reliable rather than a guess: the object id used in an injected state has to be the thing's own id, not whatever word a player would type for it (the figurine's own id is `jade`, and getting this wrong reads exactly like a real bug until checked); and a state built by hand skips whatever flags a natural playthrough would have set on the way there - `trap-door-open`, `lamp-on`, a light source actually in hand - so a puzzle that looks broken from an incomplete injected state is worth re-checking with the missing flag before it is written down as one.

## Consequences

Every major area of the port now has a direct verification behind it - the front half by a checkpointed script under `tools/audit.py`, the areas past the lamp's own budget by a state built and played by hand. Nothing under `abandoned-empire-1/` still names an unverified stretch, which is why `ROADMAP.md` is retired rather than kept open with nothing left to put in it.

This is not a script, and does not want to become one: each of the sessions above was a short, disposable program written for the one puzzle it checked, not a growing suite. The value was in the technique - build the exact state, play it, read what happens - not in a body of test code to maintain.

## Alternatives

**Extending `tools/audit.py`'s own checkpoint mechanism to jump anywhere, not just to a script's own markers** was considered and set aside: it would still only ever reach a state some earlier script actually played its way to, where the whole point here was reaching states nothing in this port's own walkthrough ever naturally passes through - the wrong end of the shaft, the fourth dig, the second death in a row.
