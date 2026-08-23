# Zork

Infocom's Zork, ported to the [Stage engine](https://engine.sgail.com).

Microsoft relicensed the source of Zork I, II and III under the MIT License on 20
November 2025, so the rooms, the puzzles and the prose can be carried across rather
than imitated. This is a port and not a remake: where a description exists, it is the
one Infocom wrote. [NOTICE.md](NOTICE.md) says where it came from and under what terms.

Zork I is the game being ported. Zork II and III use the same ZIL, the same parser and
much of the same vocabulary, so the tooling here is written for all three and this
repository has room for `zork2/` and `zork3/` beside `zork1/` when their turn comes.

## Playing it

```sh
stage build zork1
stage play zork1.stg
```

The map is complete and walkable, and two stretches of it are written. You can open
the window, take the lamp and the sword, move the rug, open the trap door, go down
into the dark, be eaten by a grue for dawdling in it, kill the troll, find the
painting, come back up the chimney and put it in the trophy case. Then on to Flood
Control Dam #3: press the yellow button to arm the bolt, turn it with the wrench, wait
eight turns while the reservoir drains, and cross the mud for the trunk of jewels.
Press the blue button and the maintenance room floods a notch a turn until you squeeze
the tube and plug the leak with what comes out.

And then Hades. Tie the rope to the railing in the Dome Room, climb down to the temple,
take the bell from the north end and the black book and candles from the altar, and go
down to the gate where the spirits jeer. Ring the bell - it goes red hot and drops, and
the candles fall out of your hands unlit - then strike a match, light the candles with
it, and read the prayer while the flames still dance. Six turns from the bell to the
candles, three from the candles to the prayer, and the wraiths resume their jeering if
you are slow. Everything past that is map without puzzles - see
[what is left](#what-is-left).

`messages.yaml` carries Zork's own standard responses, so the game says "Taken." and
"You can't go that way." rather than Stage's wording, everywhere, without an action
being written for it.

## What is here

```
zork1/            the game: 110 rooms, 100 things, 352 ways between them
  config.yaml
  vocabulary.yaml
  every-turn.yaml
  scenes/(forest and outside of house)/west-of-house.scene.yaml
  objects/(house)/lamp.object.yaml
  report.md       what the seed could not write, which is the work queue
tools/            the ZIL reader and the generator that seeded zork1/
source/           Infocom's repository, cloned by tools/fetch.sh, untracked
```

A room's id is the name ZIL gave it, lowercased: `WEST-OF-HOUSE` is `west-of-house`,
and `LAMP` is `lamp`. Nothing is renamed and there is no table to keep in step, so
anything in the ZIL can be found here and anything here can be found in the ZIL.

The folders under `scenes/` are wrapped in parentheses, which groups them without
naming them, so a room in `(coal mine)` is still `machine-room` and moving a file
between regions renames nothing. The regions are Infocom's own, taken from the
`"SUBTITLE"` lines that break `1dungeon.zil` into fourteen stretches.

## What is left

`zork1/report.md` is generated with the game and lists everything a person still has
to write, grouped by the kind of problem it is. At the time of seeding:

| | at seeding | now |
| --- | --- | --- |
| Rooms whose description changes with the world | 20 | 10 |
| Rooms with a routine to answer for | 36 | 24 |
| Things with a routine to answer for | 65 | 41 |
| Ways out that ZIL worked out in code | 4 | 2 |
| Things that begin inside other things | 20 | 18 |
| Treasures to score | 21 | 18 |

The build is a progress meter of its own. Every puzzle that is not written yet shows
up as a flag nothing sets:

```
scenes/(cyclops and hideaway)/cyclops-room.scene.yaml
  warning navigation[0].requires[0].data.flag: the flag "magic-flag" is asked
          about, but nothing ever sets it
```

There were twenty-one of those when the seed was written and there are fifteen now.
They go quiet as the game gets written.

## Where the port bends

Stage does not do everything ZIL did, and the gaps show in the files rather than in a
design document.

**A room never says what is lying in it.** Stage prints a room's own description and
nothing else, so a thing's line has to be written into the room holding it and taken
out again when it is carried off. That is why the kitchen has four descriptions and
Maze 5 has eight: one per combination of things still where the game put them. One
`here:` field on an object would delete all of them.

**Nothing is inside anything.** A thing in Stage is in a room, in your hands, or
offstage. Twenty things start inside another thing - the garlic in the sack, the
sceptre in the coffin, the canary in the egg - and they all wait offstage, listed by
the room their container stands in so that they belong somewhere.

**Scenery stands in one place.** ZIL keeps one white house and lets twelve rooms point
at it. Here each room gets a copy of its own, written where it stands and named for
the room it is in: `west-of-house.white-house`. Twenty shared things become a hundred
and eighteen copies.

**A verb needs something to act on.** `pray`, `wait`, `jump` and `echo` reach nothing,
because a verb with no object is answered with "What do you want to pray?".

**A filler preposition throws away the second object.** `tie the rope to the railing`
arrives as a bare `tie the rope`, because `to` is filler and what follows a filler is
dropped before the action is chosen. `to` has to be filler - `at` is a synonym of it,
and making it significant would mean declaring `preposition: at` on every `look at` in
the game. So the rope finds the railing with an `object-here` instead, and the same
dodge is waiting for `throw the torch at the glacier` and `throw the knife at the
thief`.

**A word belongs to one part of speech.** ZIL has an `IN` direction and an `in`
preposition and knows which is which from where it sits. Stage takes the direction
every time, so `put the painting in the case` left "the case" unclaimed and nothing
said why. Both directions are dropped here, which costs nothing - every `IN` and
`OUT` exit in Zork I has a compass twin to the same room - and `in` is worth far more
as a preposition. The same shape caught the lamp: `lamp` and `broken-lamp` both
answer to "lamp", and the parser picks by declaration order rather than by which one
is in the room, so the broken one has to give up the bare word.

**A rule cannot ask where the player is standing.** There is no condition for "here",
so anything that happens because of the room you are in has to be written in that
room's own `every-turn.yaml` - which means the room has to be a folder. Seventy-seven
of Zork's hundred and ten rooms are folders for that one reason: they hold the grue,
and it is the same thirty lines in every one of them. `tools/darkness.ts` writes them,
which is the tell - a feature that has to be generated is a feature that is missing.
The maintenance room's nine water-level lines are the same shape again: they can only
be heard in that room, so they can only be written in it.

One more is less visible. The question "is anything lighting the way" is an "or" across
four light sources, and as of Stage 0.8.0 a `requires` can ask one: `every-turn.yaml`
holds a single `any-of` of `all-of`s and writes the answer into a `light` flag that
every dark room reads. The flag stays because seventy-seven rooms ask it and writing
the group out in each would be worse - but it is now two rules rather than five, and
readable.

And that bookkeeping is loud. A flag set by a rule is written to the journal exactly
as a player's own decision is, so every turn of a playthrough now reads `light became
false / light became true / the lamp's life became 174 / was-dark became false` before
it gets to anything the player did. The journal is the first casualty of keeping state
by hand.

## The tools

Written for Deno, and pointed at a cloned copy of Infocom's repository:

```sh
sh tools/fetch.sh                          # clone the source at the pinned commit
cd tools
deno run --allow-read survey.ts            # what the reader made of the ZIL
deno run --allow-read --allow-write generate.ts
```

`generate.ts` seeds a game once, to start it off. After that the YAML is the game and
the generator is history: run it again over a game somebody has been writing in and it
will write over their work, which is why it refuses unless given `--force`.

`read-zil.ts` knows ZIL and nothing about Zork. `dungeon.ts` knows Zork and nothing
about Stage. `generate.ts` is where the two meet, and is the only file that has to
change when the mapping does.
