# Scenery duplicated per room

## Context

ZIL keeps one white house and lets twelve rooms point at it - a global object, reachable from anywhere, with no copy of its own per room. A thing in Stage is in one place: `objects.locations` is one string per thing, and every reader of a thing's whereabouts - `within`, `nearby`, `move-object`, a save file itself - rests on that being true.

Three of ZIL's globals are reached this way across the port: the granite wall, the surrounding wall, and a set of teeth.

## Decision

Each room that can reach a global gets a copy of its own, written where it stands and named for the room it is in - `west-of-house.white-house`, not a shared `white-house` reached from twelve places. The granite wall is written only into the three rooms Zork gives it words in, because everywhere else Zork says it is not here and so does the port.

## Consequences

Three globals become **220 copies**, which took the game from 217 things to 437 and the built file from 36 KB to 38 KB. Looking at the white house from the north tells the parser nothing about having looked at it from the west - each copy has its own `performed` history, so a joke that depends on having seen a thing before (the teeth, brushed once) works per room rather than once for the whole map, which is a small behavioural difference from ZIL alongside the size cost.

The stairs, the water, and the river carry the same shape at a larger scale in ZIL and are the reason a hundred and eighteen is the number named on the engine's own roadmap for this gap - this port's own three globals are the concrete instance of it, paid in full rather than left half-written.

## Alternatives

**Waiting for the engine to let a thing be reachable from several rooms without duplicating it** was the alternative on the table, and is still open on the engine's own `ROADMAP.md` under *Scenery standing in more than one room* - a list on a thing, or a tag rooms share, read only where the parser asks what a word can mean here, leaving the location field alone. Not built yet, and content should not stay unwritten waiting on it: twenty thousand words of scenery are worth having now, and the duplication is undone by whichever shape that feature eventually takes rather than fought while waiting for it.
