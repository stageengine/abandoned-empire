# Roadmap

- [What this page is](#what-this-page-is)
- [Most of the back half is still unverified this way](#most-of-the-back-half-is-still-unverified-this-way)

## What this page is

`report.md` tracked what the seed did not write, room by room and object by object, until there was nothing left on it. What used to live there - decisions made along the way, and the alternatives tried and set aside - has moved to [`arch/`](../arch/), one file per decision, in the shape [`arch/0000`](../arch/0000-record-architecture-decisions.md) describes. This page is what is left: not unwritten content, but a real limit in how this port is currently checked against the original.

## Most of the back half is still unverified this way

A full 350-point playthrough, played turn for turn against the compiled original under `tools/audit.py`, found two real bugs before it ran into the first place the original and the port start rolling independent dice - the troll fight - after which nothing in a single script recovers alignment. `tools/audit.py`'s `@checkpoint` marker (see [`arch/0011`](../arch/0011-a-checkpoint-marker-for-audit-py.md)) fixes the *replay* half of that problem: a later run drops straight into a saved state instead of refighting the troll or the thief to get there again.

It does not fix the deeper one on its own. The lamp's battery, 185 turns and matching ZIL exactly, is tight enough against a padded fight's own turn cost that a checkpoint-driven run can still die in the dark partway through the back half - not a port bug, both interpreters hit it independently, but it stops a single continuous script from reaching everything past it.

What does get past it: dropping straight into a puzzle's own starting state - the right room, the right things in hand, a full lamp - rather than walking there. Done for two puzzles so far, both by hand-constructing that state and running the engine directly rather than through a script:

- **The dam's reservoir drain** - confirmed exactly right. `<QUEUE I-REMPTY 8>>` in ZIL, eight turns counted from the bolt turn; the port's own `every-turn.yaml` comment already claimed eight and the built game holds to it precisely. Not a bug; the walkthrough script's own wait count was just short of it.
- **The coal mine's basket** - was three bugs deep, and is fixed. `raised-basket`/`lowered-basket` had no `contains: true`, so `put torch in basket` silently did nothing; fixing that alone was not enough, because swapping which basket object is "here" does not carry what is inside the old one to the new one, so a `move-tagged` now does that explicitly on both `lower` and `raise`; and both actions sent the basket `to: here` - the room the *player* is standing in - rather than the fixed room at the other end of the shaft, so a lowered basket was reachable from the wrong end and never from the right one. All three confirmed fixed by placing a state directly at each end of the shaft and checking what could and could not be reached from it.

The rest of the back half - the river, and the run from the coal mine to the ending - has not had this treatment yet. Each puzzle wants the same thing the coal mine got: its own hand-built starting state rather than a chain of `@checkpoint`s trying to survive the lamp budget to reach it.
