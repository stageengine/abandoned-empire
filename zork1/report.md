# What the seed did not write

Generated from `../source/zork1`: 110 rooms, 101 things,
352 ways out.

Everything below is a person's job. Delete a line when it is done.

## Things Stage cannot yet say (3)

- A room says nothing about what is inside a container standing in it, so the
  kitchen does not mention the brown sack or the bottle on the table, and the
  altar does not list the black book. Zork recites an open container's contents
  underneath it, indented. The engine's roadmap calls this *nested description*
  and defers it; South Temple works around it with an `object-in` on `in:altar`,
  which is the one room where the sentence was worth writing by hand.

- Nothing asks how *many* things the player is holding, or how big the biggest of
  them is. `carrying` reads a total. Two of Zork's ways out want the other
  question: the chimney out of the Studio takes the lamp and one thing more,
  counted rather than weighed, and the crawl into the Drafty Room passes when
  every single thing carried weighs four or less. The crawl is approximated with
  a total of four, which is stricter than Zork; the chimney asks only that the
  lamp is in hand. Zork's own fumble above seven held items is the same shape and
  is not ported either.

- `PICK-ONE` draws without replacement: over any run of a table's length every
  line comes back exactly once before any repeats. Thirteen call sites, two of
  which pick a room rather than a sentence. A weighted `outcomes` list is the
  nearest thing and is drawn *with* replacement, so a player hears one line twice
  before they have heard the third. The troll's misses are written that way and
  read acceptably at four lines; a two-line table would grate. The engine's
  roadmap calls this *a line that does not repeat*.

## Rooms that describe themselves differently as the world changes (10)

- **Aragain Falls** has 3 things it may say, in `FALLS-ROOM`; the seed took the first.
- **Clearing** has 3 things it may say, in `CLEARING-FCN`; the seed took the first.
- **Cyclops Room** has 6 things it may say, in `CYCLOPS-ROOM-FCN`; the seed took the first.
- **Deep Canyon** has 3 things it may say, in `DEEP-CANYON-F`; the seed took the first.
- **Grating Room** has 4 things it may say, in `MAZE-11-FCN`; the seed took the first.
- **Loud Room** has 3 things it may say, in `LOUD-ROOM-FCN`; the seed took the first.
- **Machine Room** has 3 things it may say, in `MACHINE-ROOM-FCN`; the seed took the first.
- **Mirror Room** has 2 things it may say, in `MIRROR-ROOM`; the seed took the first.
- **Torch Room** has 2 things it may say, in `TORCH-ROOM-FCN`; the seed took the first.
- **Up a Tree** has 3 things it may say, in `TREE-ROOM`; the seed took the first.

## Rooms with something to answer for (24)

- **Aragain Falls** answers to `FALLS-ROOM`.
- **Bat Room** answers to `BATS-ROOM`.
- **Canyon View** answers to `CANYON-VIEW-F`.
- **Cave** answers to `CAVE2-ROOM`.
- **Clearing** answers to `CLEARING-FCN`.
- **Clearing** answers to `FOREST-ROOM`.
- **Cyclops Room** answers to `CYCLOPS-ROOM-FCN`.
- **Deep Canyon** answers to `DEEP-CANYON-F`.
- **Drafty Room** answers to `NO-OBJS`.
- **Forest Path** answers to `FOREST-ROOM`.
- **Forest** answers to `FOREST-ROOM`.
- **Frigid River** answers to `RIVR4-ROOM`.
- **Gas Room** answers to `BOOM-ROOM`.
- **Grating Room** answers to `MAZE-11-FCN`.
- **Loud Room** answers to `LOUD-ROOM-FCN`.
- **Machine Room** answers to `MACHINE-ROOM-FCN`.
- **Mirror Room** answers to `MIRROR-ROOM`.
- **Stone Barrow** answers to `STONE-BARROW-FCN`.
- **The Troll Room** answers to `TROLL-ROOM-F`.
- **Timber Room** answers to `NO-OBJS`.
- **Torch Room** answers to `TORCH-ROOM-FCN`.
- **Treasure Room** answers to `TREASURE-ROOM-FCN`.
- **Up a Tree** answers to `TREE-ROOM`.
- **White Cliffs Beach** answers to `WHITE-CLIFFS-FUNCTION`.

## Things with something to answer for (41)

- `axe` answers to `AXE-F`.
- `bag-of-coins` answers to `BAG-OF-COINS-F`.
- `barrow-door` answers to `BARROW-DOOR-FCN`.
- `barrow` answers to `BARROW-FCN`.
- `bat` answers to `BAT-F`.
- `bones` answers to `SKELETON`.
- `bottle` answers to `BOTTLE-FUNCTION`.
- `broken-canary` answers to `CANARY-OBJECT`.
- `buoy` answers to `TREASURE-INSIDE`.
- `canary` answers to `CANARY-OBJECT`.
- `chalice` answers to `CHALICE-FCN`.
- `cyclops` answers to `CYCLOPS-FCN`.
- `egg` answers to `EGG-OBJECT`.
- `front-door` answers to `FRONT-DOOR-FCN`.
- `garlic` answers to `GARLIC-F`.
- `gunk` answers to `GUNK-FUNCTION`.
- `inflatable-boat` answers to `IBOAT-FUNCTION`.
- `inflated-boat` answers to `RBOAT-FUNCTION`.
- `knife` answers to `KNIFE-F`.
- `large-bag` answers to `LARGE-BAG-F`.
- `leaves` answers to `LEAF-PILE`.
- `lowered-basket` answers to `BASKET-F`.
- `machine-switch` answers to `MSWITCH-FUNCTION`.
- `machine` answers to `MACHINE-F`.
- `mailbox` answers to `MAILBOX-F`.
- `mirror-1` answers to `MIRROR-MIRROR`.
- `mirror-2` answers to `MIRROR-MIRROR`.
- `mountain-range` answers to `MOUNTAIN-RANGE-F`.
- `pedestal` answers to `DUMB-CONTAINER`.
- `punctured-boat` answers to `DBOAT-FUNCTION`.
- `raised-basket` answers to `BASKET-F`.
- `rusty-knife` answers to `RUSTY-KNIFE-FCN`.
- `sand` answers to `SAND-FUNCTION`.
- `sandwich-bag` answers to `SANDWICH-BAG-FCN`.
- `sceptre` answers to `SCEPTRE-FUNCTION`.
- `stiletto` answers to `STILETTO-FUNCTION`.
- `sword` answers to `SWORD-FCN`.
- `thief` answers to `ROBBER-FUNCTION`.
- `torch` answers to `TORCH-OBJECT`.
- `water` answers to `WATER-F`.
- `wooden-door` answers to `FRONT-DOOR-FCN`.

## Ways out that ZIL worked out in code (2)

- **Clearing**, down, in `GRATING-EXIT`.
- **Maze**, down, in `MAZE-DIODES`.


## Things that are not there until something reveals them (4)

- `map` starts unseen, and needs a `requires` saying when it is not.
- `pot-of-gold` starts unseen, and needs a `requires` saying when it is not.
- `scarab` starts unseen, and needs a `requires` saying when it is not.
- `thief` starts unseen, and needs a `requires` saying when it is not.

## Things made during play (8)

- `bauble` is filed under **Forest**.
- `broken-egg` is filed under **Up a Tree**.
- `broken-lamp` is filed under **Living Room**.
- `diamond` is filed under **Machine Room**.
- `gunk` is filed under **Machine Room**.
- `hot-bell` is filed under **Entrance to Hades**.
- `inflated-boat` is filed under **Dam Base**.
- `punctured-boat` is filed under **Dam Base**.

## Scenery standing in more than one room (3)

- `granite-wall` is scenery no room names, and is not written at all.
- `teeth` is scenery no room names, and is not written at all.
- `wall` is scenery no room names, and is not written at all.

## Treasure (18)

- `bag-of-coins` scores 10 for the finding and 5 in the case.
- `bar` scores 10 for the finding and 5 in the case.
- `bauble` scores 1 for the finding and 1 in the case.
- `bracelet` scores 5 for the finding and 5 in the case.
- `broken-canary` scores 0 for the finding and 1 in the case.
- `broken-egg` scores 0 for the finding and 2 in the case.
- `canary` scores 6 for the finding and 4 in the case.
- `chalice` scores 10 for the finding and 5 in the case.
- `coffin` scores 10 for the finding and 15 in the case.
- `diamond` scores 10 for the finding and 10 in the case.
- `egg` scores 5 for the finding and 5 in the case.
- `emerald` scores 5 for the finding and 10 in the case.
- `jade` scores 5 for the finding and 5 in the case.
- `pot-of-gold` scores 10 for the finding and 10 in the case.
- `scarab` scores 5 for the finding and 5 in the case.
- `sceptre` scores 4 for the finding and 6 in the case.
- `torch` scores 14 for the finding and 6 in the case.
- `trident` scores 4 for the finding and 11 in the case.

## Light (3)

- `candles` gives light, and is already burning.
- `lamp` gives light.
- `torch` gives light, and is already burning.

## Words a room knows that name nothing in it (22)

- **Chasm** knows "chasm", via `CHASM-PSEUDO`.
- **Dome Room** knows "dome", via `DOME-PSEUDO`.
- **Drafty Room** knows "chain", via `CHAIN-PSEUDO`.
- **East of Chasm** knows "chasm", via `CHASM-PSEUDO`.
- **Entrance to Hades** knows "gate", via `GATE-PSEUDO`.
- **Entrance to Hades** knows "gates", via `GATE-PSEUDO`.
- **Gas Room** knows "gas", via `GAS-PSEUDO`.
- **Gas Room** knows "odor", via `GAS-PSEUDO`.
- **Living Room** knows "nail", via `NAILS-PSEUDO`.
- **Living Room** knows "nails", via `NAILS-PSEUDO`.
- **Reservoir North** knows "lake", via `LAKE-PSEUDO`.
- **Reservoir South** knows "chasm", via `CHASM-PSEUDO`.
- **Reservoir South** knows "lake", via `LAKE-PSEUDO`.
- **Reservoir** knows "stream", via `STREAM-PSEUDO`.
- **Shaft Room** knows "chain", via `CHAIN-PSEUDO`.
- **Smelly Room** knows "gas", via `GAS-PSEUDO`.
- **Smelly Room** knows "odor", via `GAS-PSEUDO`.
- **Stream View** knows "stream", via `STREAM-PSEUDO`.
- **Stream** knows "stream", via `STREAM-PSEUDO`.
- **Studio** knows "door", via `DOOR-PSEUDO`.
- **Studio** knows "paint", via `PAINT-PSEUDO`.
- **Torch Room** knows "dome", via `DOME-PSEUDO`.
