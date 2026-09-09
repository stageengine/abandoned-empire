# Roadmap

- [What this page is](#what-this-page-is)
- [A full transcript cannot verify combat](#a-full-transcript-cannot-verify-combat)

## What this page is

`report.md` tracked what the seed did not write, room by room and object by object, until there was nothing left on it. What used to live there - decisions made along the way, and the alternatives tried and set aside - has moved to [`arch/`](../arch/), one file per decision, in the shape [`arch/0000`](../arch/0000-record-architecture-decisions.md) describes. This page is what is left: not unwritten content, but a real limit in how this port can currently be checked against the original.

## A full transcript cannot verify combat

A full 350-point playthrough, played turn for turn against the compiled original under `tools/audit.py`, is how two real bugs were found and fixed - one in the trophy case's own words, one in the vocabulary. Both surfaced because they sit before the first place the transcript forks.

Past that point, the original and the port each roll their own dice, and neither can be pointed at the other's. Once the troll or the thief takes a different number of rounds to fall on one side than the other, or the thief's own wander puts him in a different room at a different turn, every line after that reads as "different" whether or not either side is actually wrong - the two playthroughs are no longer describing the same history. A single script run start to finish cannot see past that fork.

What would: a comparison anchored to a save rather than to a script position - drop both interpreters into the same room with the same inventory right before a fight or before the thief's own wander, and compare only from there, one puzzle at a time, so one side's lucky roll cannot desync the whole rest of the account. Not built. `tools/audit.py` is the right tool for everything before the first fork; this is what it would take to extend past it.
