# Fixed fights settle on one flat roll

## Context

ZIL settles each blow of a fixed fight - the troll, the thief - against a table keyed on both fighters' relative strength, with as many as nine outcomes per blow: a miss, a wound of varying severity, being knocked unconscious, a killing blow. Stage has no equivalent combat-table primitive, and building one for two fights in the whole game was judged disproportionate to what it would buy.

## Decision

A `strength` measure that only goes down, and a miss/wound/death pair of actions rather than nine outcomes - the number moves, the shape does not. The troll carries this shape first, at ZIL's own strength of two; the thief reuses the identical shape rather than a shape of his own, at ZIL's own strength of five, the toughest fixed fight in the game.

## Consequences

Real strategic texture survives - a higher strength genuinely takes more hits to overcome, matching what a player would feel from the real table's own bias - while the finer-grained states do not: nobody is knocked unconscious and left to wake later, only killed outright once their strength reaches zero. The thief's own `F-UNCONSCIOUS`/`F-CONSCIOUS` toggle in ZIL, where he can be found down and later revive and flee, has no equivalent here.

## Alternatives

**A combat table with the full range of ZIL's outcomes** was not seriously pursued: two fights in the entire game do not justify a general-purpose mechanic built to model nine-way branching, and the flat-roll shape had already been proven readable and fair by the troll before the thief needed the same treatment - reusing it rather than inventing a second combat shape for one more fight.
