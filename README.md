# Abandoned Empire

Infocom's Zork, ported to the [Stage engine](https://engine.sgail.com) - published
under the name *Abandoned Empire*, since the MIT relicense covers the source but not
the trademark. See [NOTICE.md](NOTICE.md#the-name).

Microsoft relicensed the source of Zork I, II and III under the MIT License on 20
November 2025, so the rooms, the puzzles and the prose can be carried across rather
than imitated. This is a port and not a remake: where a description exists, it is the
one Infocom wrote. [NOTICE.md](NOTICE.md) says where it came from and under what terms.

Zork I is the game being ported. Zork II and III use the same ZIL, the same parser and
much of the same vocabulary, so the tooling here is written for all three and this
repository has room for `abandoned-empire-2/` and `abandoned-empire-3/` beside
`abandoned-empire-1/` when their turn comes.

## Playing it

```sh
stage build abandoned-empire-1
stage play abandoned-empire-1.stg
```

The map is complete and walkable, and the game plays start to finish. You can open
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
you are slow.

Past the coal mine and the dam is the Frigid River. Inflate the boat with the pump, drop
anything sharp before you get in - a sword or a knife in your hands punctures it on the
way over - and launch from Dam Base. The current takes it from there on its own
schedule, four turns through the first bend, four more, three, two, and one last turn's
grace at the sound of the falls before it takes an unlanded boat over them. The cyclops
in his own room falls for a hot pepper sandwich and a doctored bottle of water and drops
off at the foot of his stairs, or - the other way through it - hears the name of his
father's oldest enemy and knocks the east wall down running, which opens a shortcut
straight back to the Living Room. The thief fights back now, wanders the whole map
stealing what he can carry, and drops everything in his bag when somebody finally kills
him. Die anywhere and Zork gives two returns from the Forest, penalty and all, before
the third one is final.

The game can be finished: every treasure has a score, the trophy case can be filled, and
walking into the Stone Barrow at three hundred and fifty points is the one ending that
is not a death. What is still missing is smaller than it was, and
[report.md](abandoned-empire-1/report.md) is the exact, current list.

`messages.yaml` carries Zork's own standard responses, so the game says "Taken." and
"You can't go that way." rather than Stage's wording, everywhere, without an action
being written for it.

## What is here

```
abandoned-empire-1/  the game: 110 rooms, 122 things, 343 ways between them
  config.yaml
  vocabulary.yaml
  every-turn.yaml
  assets/         icon and cover art, for the store rather than the game
  scenes/(forest and outside of house)/west-of-house.scene.yaml
  objects/(house)/lamp.object.yaml
  report.md       what the seed could not write, which is the work queue
tools/            the ZIL reader and the generator that seeded abandoned-empire-1/,
                  and audit.py, which plays a script through both the original and
                  the port and prints where their replies part company
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

`abandoned-empire-1/report.md` is generated with the game and kept up to date by hand, and is the
exact, current list - counted from the port, not estimated. In short: every room is
written, every treasure is scored, the game can be finished, and the engine itself has
nothing left it cannot say for this port. What remains is one deliberate scope choice
rather than a gap: a container has no display shape of its own yet, so a room does not
recite what is inside one standing in it, and a treasure taken back out of the trophy
case is sent offstage rather than back into it, to keep it from sitting there unseen and
still takeable. `report.md` names exactly where it shows.

The build is a progress meter of its own. A puzzle that is not wired up yet shows up as
a flag nothing sets:

```
scenes/(cyclops and hideaway)/cyclops-room/config.yaml
  warning navigation[2].requires[0].data.flag: the flag "cyclops-flag" is asked
          about, but nothing ever sets it
```

There were twenty-one of those when the seed was written. Chasing the ones that turned
out to be real bugs rather than unwritten content - a sleeping cyclops whose stairs
never opened, a `deflate` with no action behind it - is how several of the fixes in this
file's history were found in the first place.

## Where the port bends

Stage does not do everything ZIL did, and the gaps show in the files rather than in a
design document. Three that used to live here do not any more - the engine grew a
`scene` condition, real containment, and answers for a verb with no object after this
was first written, and the port was rewritten to use all three rather than the
workarounds below. What is left is smaller and mostly about prose that would have to
recite a set of things that changes as the game is played, which the engine still has
no way to do.

**A room never says what is lying in it.** Stage prints a room's own description and
nothing else, so a thing's line has to be written into the room holding it and taken
out again when it is carried off. That is why the kitchen has four descriptions and
Maze 5 has eight: one per combination of things still where the game put them. One
`here:` field on an object would delete all of them - and the same gap is why a
treasure taken out of the trophy case is sent offstage rather than back into it: a
thing sitting `in:trophy-case` would be invisible in the room's own text but still
there to be taken again, which is worse than not being able to take it out at all.

**Scenery stands in one place.** ZIL keeps one white house and lets twelve rooms point
at it. Here each room gets a copy of its own, written where it stands and named for
the room it is in: `west-of-house.white-house`. Twenty shared things become a hundred
and eighteen copies.

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

The question "is anything lighting the way" is an "or" across four light sources, and a
`requires` can only ask one: `every-turn.yaml` holds a single `any-of` of `all-of`s and
writes the answer into a `light` flag that every dark room reads, once, rather than
five conditions apiece. The grue is the same shape at a larger scale - one rule, keyed
on the `dark` tag rather than named per room, answers for all hundred and ten rooms
instead of writing the same lines into seventy-seven of them.

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

`audit.py` checks the two once both exist, rather than seeding either: it plays one
script through the original under `dfrotz` and through the built `.stg` under
`stage play`, turn for turn, and prints the first place each turn's reply parts
company - wording included, not only outcome. It is how the wording differences fixed
in this port's history were actually found, and needs `dfrotz` on the path and a
built `../source/zork1/COMPILED/zork1.z3` to compare against.

```sh
python3 tools/audit.py script.txt abandoned-empire-1.stg
```
