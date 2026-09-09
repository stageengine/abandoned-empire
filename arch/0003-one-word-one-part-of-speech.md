# One word, one part of speech

## Context

ZIL's parser reads a preposition's role from the sentence it sits in - `to` is filler in one construction and significant in another - and knows an `IN` compass direction from an `in` preposition by where each sits in the grammar. Stage declares a word's role once, in the vocabulary, and reads every sentence the same way: what follows a filler preposition is dropped before an action is even chosen, and a direction and a preposition cannot share one word.

Two places in the port ran into this directly.

## Decision

**`to` stays filler.** `tie the rope to the railing` arrives as a bare `tie the rope`, because `to` is filler and the object after it is already gone by the time an action is chosen. Making `to` significant was ruled out rather than half-tried: `at` is a synonym of it, and giving it up would mean declaring `preposition: at` on every `look at` in the game. Instead, the rope finds the railing with an `object-here` check naming the specific thing the action already expects - a dodge rather than a parse, and the same dodge is waiting for `throw the torch at the glacier` and `throw the knife at the thief`.

**`in` is a preposition, not also a direction.** ZIL has both an `IN` exit and an `in` preposition and tells them apart from context; Stage takes the direction every time a word could be either, so `put the painting in the case` left "the case" unclaimed with no explanation. Both directions are dropped rather than kept as a compass word, which costs nothing measurable: every `IN` and `OUT` exit in Zork I has a compass twin leading to the same room, so nothing reachable by `IN` becomes unreachable.

**A word answers to one declaration, chosen by order, not by fit.** `lamp` and `broken-lamp` both answer to "lamp"; the parser picks whichever was declared first rather than asking which one is actually in the room, so the broken one gives up the bare word and answers only to a qualified name.

## Consequences

Three small, unrelated-looking compromises that are the same shape: a word Stage can only mean one thing, resolved once per case by whichever fix costs the game the least. None is visible to a player typing the sentences Zork itself expects; each is only visible to whoever goes looking for the sentence the workaround stands in for.

## Alternatives

**Declaring `to`/`at` significant everywhere it appears** was the alternative for the filler case, rejected for the blast radius: every `look at` in the game would need its own `preposition: at` line to keep working. **Keeping `IN`/`OUT` as directions and losing the preposition** was the alternative on the other side, rejected because `in` earns its keep far more often as a preposition (every `put X in Y` in the game) than the compass pair does as a direction (every instance of which has a working twin already).
