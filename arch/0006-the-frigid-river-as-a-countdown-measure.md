# The Frigid River as a countdown measure

## Context

ZIL's river current moves an inflated boat on its own schedule, without the player typing a direction: `RIVER-NEXT` and `RIVER-SPEEDS` count down per room - four turns, four, three, two, one at the falls - and `RIVER-LAUNCH` gives several points along the river a name to relaunch from if the boat beaches partway down.

## Decision

`board`, `disembark` and `launch` are ordinary actions on the inflated boat, with a puncture the moment anything sharp comes aboard. The current itself is a `river-timer` measure, counted down in `every-turn.yaml` and reset to the next room's own speed on the way through - read the same way `config.yaml`'s candle burn-timers already read a countdown, rather than a new mechanic built for this one case.

All four of ZIL's `RIVER-LAUNCH` landings on this stretch of the river are authored: White Cliffs North and South and Sandy Beach relaunch at River Three and River Four, the same as Dam Base does at River One.

## Consequences

A boat beached partway down the river can be taken back out, matching ZIL rather than stranding a player who lands short of the falls. The other four `RIVER-LAUNCH` entries in ZIL's own table - Reservoir and Stream View - belong to the separate reservoir crossing rather than this boat, and are deliberately out of scope here rather than folded in for completeness.

## Alternatives

Nothing about the shape itself was seriously contested - `config.yaml`'s own burn-timer countdown was already a proven pattern for "a measure that counts down and does something on reaching zero," and reusing it here rather than inventing a second countdown mechanic was the whole of the design work.
