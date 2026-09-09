# Roadmap

- [What this page is](#what-this-page-is)
- [The run from the coal mine to the ending is still unverified this way](#the-run-from-the-coal-mine-to-the-ending-is-still-unverified-this-way)

## What this page is

`report.md` tracked what the seed did not write, room by room and object by object, until there was nothing left on it. What used to live there - decisions made along the way, and the alternatives tried and set aside - has moved to [`arch/`](../arch/), one file per decision, in the shape [`arch/0000`](../arch/0000-record-architecture-decisions.md) describes. This page is what is left: not unwritten content, but a real limit in how this port is currently checked against the original.

## The run from the coal mine to the ending is still unverified this way

A full 350-point playthrough, played turn for turn against the compiled original under `tools/audit.py`, found two real bugs before it ran into the first place the original and the port start rolling independent dice - the troll fight - after which nothing in a single script recovers alignment. `tools/audit.py`'s `@checkpoint` marker (see [`arch/0011`](../arch/0011-a-checkpoint-marker-for-audit-py.md)) fixes the *replay* half of that problem: a later run drops straight into a saved state instead of refighting the troll or the thief to get there again.

It does not fix the deeper one on its own. The lamp's battery, 185 turns and matching ZIL exactly, is tight enough against a padded fight's own turn cost that a checkpoint-driven run can still die in the dark partway through the back half - not a port bug, both interpreters hit it independently, but it stops a single continuous script from reaching everything past it.

What does get past it: dropping straight into a puzzle's own starting state - the right room, the right things in hand, a full lamp - rather than walking there. Done for three areas so far, each by hand-constructing that state and running the engine directly rather than through a script:

- **The dam's reservoir drain** - confirmed exactly right. `<QUEUE I-REMPTY 8>>` in ZIL, eight turns counted from the bolt turn; the port's own `every-turn.yaml` comment already claimed eight and the built game holds to it precisely. Not a bug; the walkthrough script's own wait count was just short of it.
- **The coal mine's basket** - was three bugs deep, and is fixed. `raised-basket`/`lowered-basket` had no `contains: true`, so `put torch in basket` silently did nothing; fixing that alone was not enough, because swapping which basket object is "here" does not carry what is inside the old one to the new one, so a `move-tagged` now does that explicitly on both `lower` and `raise`; and both actions sent the basket `to: here` - the room the *player* is standing in - rather than the fixed room at the other end of the shaft, so a lowered basket was reachable from the wrong end and never from the right one. All three confirmed fixed by placing a state directly at each end of the shaft and checking what could and could not be reached from it.
- **The Frigid River** - confirmed working: launch, the per-room countdown, the landing at Sandy Beach, the buoy's emerald, and the timed scarab dig all checked directly. Testing this one found something bigger than the river itself.

**Every instant death but one used to skip the two-resurrections rule.** ZIL's `JIGS-UP` is one routine, called for every death in the game - the grue, drowning, burning, a bad jump - and it gives every single one of them the same two chances before the third is final. The port's health-measure death already went through that shared mechanism; eight others (the grue, drowning in the reservoir, drowning in the flooded maintenance room, drowning mid-river, the Canyon View jump, burning the black book, burning the leaves, and the sand collapsing on the fourth dig) called `end-game` directly instead, making each of them unconditionally final on the very first occurrence - including the grue, the single most common way to die in the whole game. Found by testing the digging puzzle directly and noticing the death never let the player keep going; fixed by routing all eight through the same `player-died` flag the health measure already used, confirmed by playing all three deaths of the cycle in a row and checking the third was the only one that actually ended the game.

The run from the coal mine to the ending - largely the diamond deposit, and the run back to the trophy case and the barrow - has not had this treatment yet.
