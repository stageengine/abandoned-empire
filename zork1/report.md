# What the seed did not write

Generated from `../source/zork1`: 110 rooms, 101 things, 352 ways out.

## How much of it is ported

**Ninety-eight per cent of the backlog**, and the game can be finished. Two jobs are
left and both are the same one thing the engine cannot do. A single number is a
judgement rather than a measurement, so here is what it is made of, all of it
counted from the port rather than estimated.

| | done | of | |
| --- | --- | --- | --- |
| Rooms written, each describing itself | 110 | 110 | the seed wrote these |
| Ways out | 344 | 352 | |
| Every point Zork awards | 350 | 350 | |
| Treasures scored for the case / for finding | 21 / 19 | 21 / 19 | |
| Rooms scored for being reached | 4 | 4 | |
| Characters, each described and answering | 5 | 5 | troll, thief, cyclops, bat, ghosts |
| Things that answer a verb | 41 | 41 | |
| Words a room knows that name nothing in it | 22 | 22 | |
| Scenery standing in more than one room | 3 | 3 | written out per room |
| Ways out ZIL worked out in code | 2 | 2 | |
| Things revealed / made in play / light | 15 | 15 | |
| Rooms that read differently as the world changes | 9 | 10 | |
| Rooms that answer a verb | 3 | 4 | |

**116 of 118**, where the counts through this went 53, then 70, then 91, then 113.
Both of the two left are **Up a Tree**: it should list what is lying on the path
below, and a `presence` answers with the first block that holds rather than every
one that does. A room can already name one thing in another room, which is the
useful half; naming the second is the half that is not there.

Eight ways out the seed did not carry across are also outstanding, and are work
rather than a wall.

**What the duplication cost.** The three globals - the granite wall, the surrounding
wall, a set of teeth - are things ZIL reaches from anywhere, and a thing here is in
one place. So they are written per room: **220 copies**, which took the game from 199
things to 437 and the built file from 36 KB to 38 KB. The granite wall is only in the
three rooms Zork gives it words in, because everywhere else Zork says it is not here
and so does Stage. That is the price of *scenery standing in more than one room*
paid in full, and it is worth knowing what it comes to.

Two other ways of asking. **437 things and people** stand in the game. And **105
rules** run each turn, against three before the thief and seventy-six before the
river, the thief's own fight, resurrection and the sword's glow.

**The game can be won.** Put every treasure in the case, score three hundred and
fifty, and a whisper sends you to the Stone Barrow, where walking west is the one
ending Zork has that is not a death. It has been played through to the closing sign -
and re-verified since, because this claim was quietly false for a while. The Cyclops
Room's `up` read a flag named `cyclops-flag`, exactly as ZIL's own single flag does,
but the sleeping-cyclops trigger set a *different* one, `cyclops-asleep`, so the stairs
to the Treasure Room never opened and the chalice was unreachable by any means. The
build's own warnings said so the whole time - "the flag 'cyclops-flag' is asked about,
but nothing ever sets it" - and went unread. Fixed by keeping the two flags in step,
found by an audit rather than by play, and worth writing down so the next one gets
read.

Everything below is a person's job. Delete a line when it is done.

Last checked against the port by hand, not by the generator, so the counts in the
headings are what is *left* rather than what the seed found. Three sections have
gone entirely since it was written: the four things that are not there until
something reveals them all carry a `requires` now, the eight things made during
play are all written, and the eighteen treasures are all scored. Every gap claimed
below was tried against the engine before being written down. Two rooms and one
half of a third are all that remain of the ten that describe themselves several
ways.

## Written beyond what the seed found

None of this is in the counts above, because none of it comes from a ZIL room or
object routine - it is the map the seed drew, made playable rather than merely
walkable. Six pieces, each following a pattern already proven somewhere else in the
port rather than inventing a new one.

- **The thief fights back.** `characters/thief.character.yaml` gains a `strength`
  measure - five against the troll's two, which is ZIL's own numbers - and the same
  miss/wound/death shape `troll.character.yaml` already used. His bag and stiletto
  drop where he falls, which is the only way to recover what he has stolen over the
  game. Wandering and stealing were already written before this; only the fight was
  missing.
- **The Frigid River.** `board`, `disembark` and `launch` on the inflated boat, a
  puncture the moment anything sharp comes aboard, and the current itself: a
  `river-timer` measure counted down in `every-turn.yaml`, reset to the next room's
  own speed on the way through - four turns, four, three, two, one - which is
  `RIVER-SPEEDS` read the same way `config.yaml`'s burn-timers already read a
  candle's. Only the Dam Base launch point is authored; relaunching partway down
  from White Cliffs or Sandy Beach is not.
- **Two resurrections, then the third is final**, matching `DEATHS` in ZIL's
  `JIGS-UP`. The health measure's own threshold stays one line - "you have died,"
  a ten-point penalty, a flag - and two rules in `every-turn.yaml` read that flag
  against a `deaths` measure to decide which of Zork's two answers this death gets,
  because a threshold's own triggers cannot ask a second measure's value and an
  ordinary rule can. Simplified once: every resurrection uses the ordinary Forest
  return rather than ZIL's alternate ghost-in-Hades one for a death after the
  Temple has been visited, and only the lamp is returned to the Living Room, ZIL's
  own special case - scattering everything else currently held would want one rule
  per thing, the same cost the trophy case already pays, for a corner case few
  playthroughs will reach.
- **`xyzzy`, `plugh` and bare `hello`.** Zork's own joke at *Adventure*'s expense
  rather than a teleport - "A hollow voice says 'Fool.'" - and one of four lines
  picked at random for a greeting, the same weighted-`chance` shape the troll's
  miss lines already use.
- **The sword's glow is proactive.** It answered `look` before; now
  `every-turn.yaml` says so unprompted the turn a monster shares the room, which is
  most of what the warning is for. The faint glow for a monster one room over stays
  unwritten - it wants to know which room is next to which, and the troll and
  cyclops hold still for it but the thief wanders across thirty-three rooms, which
  is the roadmap's own unbuilt "closeness."
- **Room titles are shown.** `meta.title` sat on every scene, read by nothing a
  player could see. The engine now prints it once above a room's own description on
  every visit - full fidelity with Zork's *verbose* mode, which never shortens a
  revisit. Its *default*, `brief`, also drops the body text on a second visit,
  which is a `visited`-gated second `presence` block on all hundred and ten rooms
  and is not this.

**Taking a treasure back out of the case turned out not to be simple content work.**
It looked like it, until reading why `put` sends a treasure offstage rather than
into the case explained it: a thing sitting `in:trophy-case` would be invisible in
the room's own text - the same "cannot list a set that varies" below - but still
there to `get`, silently. An offstage thing cannot be named by the parser at all, so
there is nothing for a `get` to answer for. Fixing this for real means real
containment, which reopens the exact gap `put` was written to avoid. Left undone,
and correctly so.

## Things Stage cannot yet say (4)

Each of these was tried against the engine before being written down, because two
things this section claimed last time turned out to be authorable after all.

- **A description cannot list a set that varies.** A `presence` is read
  first-match-wins, so one block answers and the rest say nothing. A room *can*
  name a thing that is somewhere else - `object-in` takes any scene, and Up a Tree
  saying "On the ground below you can see a brass lamp" is one block that correctly
  stops saying it when somebody picks the lamp up. What it cannot do is mention the
  rope as well. This is the same gap as a room reciting an open container's
  contents, which is why the kitchen does not mention the sack on the table and the
  altar does not list the black book. The roadmap has it under *a description
  cannot list a set that varies*.

- **Nothing asks how *many* things the player is holding**, or how big the biggest
  of them is. `carrying` reads a total, and there is no condition that counts. Two
  of Zork's ways out want the other question: the chimney out of the Studio takes
  the lamp and one thing more, counted rather than weighed, and the crawl into the
  Drafty Room passes when every single thing carried weighs four or less. The crawl
  is approximated with a total of four, which is stricter than Zork; the chimney
  asks only that the lamp is in hand. Zork's own fumble above seven held items is
  the same shape and is not ported either.

- **`PICK-ONE` draws without replacement**: over any run of a table's length every
  line comes back exactly once before any repeats. Thirteen call sites, two of which
  pick a room rather than a sentence. A weighted `outcomes` list is the nearest
  thing and is drawn *with* replacement, so a player hears one line twice before
  they have heard the third. The troll's misses are written that way and read
  acceptably at four lines; a two-line table would grate. The roadmap calls this *a
  line that does not repeat*.

- **Nothing can act on a thing the player chose.** `remove-from-inventory` names one
  id and no condition or trigger carries a wildcard, so "take whatever they are
  carrying" is one rule per stealable thing, every rule saying the same about a
  different noun. Sixteen of them make the thief a thief. The same shape is what
  makes the trophy case eighteen blocks. The roadmap has it as *a trigger cannot act
  on a thing chosen during play*.

  His *walking* is not part of this and was written up as impossible here once. A
  `chance` with several answers picks one, so somebody who wanders is one rule with
  an answer per room - thirty-three of them, in one rule, in `every-turn.yaml`.
  Neither is his *fighting back* - a strength measure and a miss/wound/death shape
  copied from the troll's, which this gap never blocked. What is still short of ZIL
  is scattering everything he has stolen to different rooms on his death rather than
  dropping it all in one bag where he falls.

Three things this section used to claim, which are done or were never true.

The score is a sentence the player can read now: prose may name a measure, so
`score` and `diagnose` are one vocabulary line and one action block each. `take all`
works, from a `quantifiers` list. And the move count is **not** an engine gap, which
this file said before anybody tried it: prose cannot name Stage's own turn counter,
but a game that wants one keeps a `moves` measure and moves it by one in
`every-turn.yaml`, which is what this port now does.

The trophy case is not a gap either, though it looks like one. Eighteen blocks, but
each carries a different score, so what repeats is the shape around the number
rather than the number itself.

## Rooms that describe themselves differently as the world changes (1)

Nine of the ten are written, each as several `presence` blocks read top to bottom.
Aragain Falls reads differently once the sceptre has made the rainbow solid; the
Mirror Room's second half went in with the mirrors.

- **Up a Tree** has 3 things it may say, in `TREE-ROOM`, and one of them lists what is
  lying on the path below. A room can name one thing in another room, so the useful
  half of that is writable today; what it cannot do is name the second, because a
  `presence` answers with the first block that holds and not with all of them.


## Rooms with something to answer for (1 left of 4)

The heading was twenty-four, and twenty of those were never jobs: each line names a
ZIL room routine, and twenty handle only `M-LOOK` and `M-ENTER` - what the room says
and what happens on arriving, both of which are a `presence` here and were written
long ago. Four have a verb clause in them, and three are done: the **Loud Room**
takes `echo`, which is the whole of its puzzle; **Canyon View** takes `jump`, which
is a lousy place to; and **Stone Barrow** takes the walk west that finishes the game.

- **Up a Tree** answers to `TREE-ROOM`, and wants to list what is lying on the path
  below, which is the one thing here the engine cannot do.


## Things with something to answer for

Done. All forty-one answer, each written from the ZIL routine the seed named. The
last nineteen went in one pass: the skeleton's curse, the mirrors, the machine, the
baskets, the boats, the sand, the thief's bag, the sceptre and the rest.

Two of them are words only, where Zork also moved something and the port cannot say
which something: see *Things Stage cannot yet say*. The skeleton is not one of them
- its curse really does banish what you are carrying, at the cost of a rule per
treasure.

## Ways out that ZIL worked out in code

Done. The Clearing's way down is gated on the grating being revealed and open, and
the four one-way tunnels in the maze each say where their own drop goes - which is
what ZIL used one routine and a table of rooms for.


## Scenery standing in more than one room

Done, by writing them out. `granite-wall`, `wall` and `teeth` are `GLOBAL-OBJECTS`
in ZIL, reachable from any room at all, and a thing in Stage is in one place - so
each room that needs one has its own copy, 220 of them.

The granite wall is the cheap one: Zork gives it words in North Temple, the Treasure
Room and the Slide Room, and says it is not here everywhere else, which is what
Stage says of a word nothing answers to. Three copies rather than a hundred and ten.

The other two are the expensive ones, and they are the argument for the roadmap
entry: a set of teeth exists so that `brush teeth` has an answer, and paying for
that joke means a hundred and ten copies of it.


## Treasure

Done, and the numbers here are Zork's own `VALUE` and `TVALUE` rather than the table
this file used to carry, which had three treasures missing and was thirty points
light. **Twenty-one** are scored for going in the case, worth 132; **nineteen** are
scored for being found, worth 143; **four rooms** are scored for being reached, worth
65; and walking into the barrow is the last 10. Three hundred and fifty exactly.

The finding scores live in `every-turn.yaml` rather than on each treasure's `get`,
because a treasure can be come by without being taken - the canary comes out of the
egg - and a rule asking what is in the player's hands catches every route. Three of
them scored themselves as well for a while, which is how this file came to claim a
maximum nobody could reach.

What is not done is taking a treasure back *out* of the case. Zork subtracts the
points; the port sends the treasure offstage instead, where nobody can reach it,
which keeps the score honest at the cost of an empty-looking case. See *Written
beyond what the seed found* for why this is not simply a `get` action away.

## Light (3)

- `candles` gives light, and is already burning.
- `lamp` gives light.
- `torch` gives light, and is already burning.

## Words a room knows that name nothing in it

Done. All twenty-two answer, each as a piece of scenery in the room that knows the
word, with the responses ZIL's `PSEUDO` routines gave them - the nails in the door,
the chasm, the gate at Hades, the gas, the chain in the shaft.

Six of the words are known by more than one room, and each of those is written out
per room. That is the same shape as *scenery standing in more than one room* below,
paid rather than avoided, because two copies of a chasm is a smaller price than
twelve of a white house.
