# The sword's glow warns only for the room you are in

## Context

ZIL's elvish sword glows faintly for a monster one room away and brightly for one sharing the player's own room. The port had the bright, same-room case answering `look` only - a player had to think to check, rather than being told, which is most of what a warning is for.

## Decision

`every-turn.yaml` now says the glow unprompted, the turn a monster shares the room, rather than waiting to be asked. The faint one-room-over warning stays unwritten: it wants to know which room is next to which, and while the troll and the cyclops hold still for that to be knowable in advance, the thief wanders across thirty-three rooms, which is the engine's own unbuilt "closeness" - nothing today can answer "which room is adjacent to this one" cheaply enough to check every turn.

## Consequences

The proactive, same-room glow covers the case a player is most likely to actually be in danger from - sharing a room with something hostile - unprompted, matching the spirit of ZIL's own warning even without the weaker half. The one-room-over hint is a real, acknowledged gap rather than a silent one.

## Alternatives

**Hardcoding adjacency for the handful of rooms near the troll and the cyclops** was possible without waiting on a general "closeness" feature, and was set aside anyway: it would answer only two of the three monsters (the thief wanders too widely for a fixed adjacency list to help), and a hand-maintained adjacency table for two rooms is exactly the kind of local patch this project has otherwise avoided in favour of waiting for the engine to answer the general question once.
