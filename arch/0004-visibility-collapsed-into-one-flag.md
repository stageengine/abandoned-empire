# Visibility collapsed into one flag

## Context

"Is anything lighting the way" is an *or* across four light sources - the lamp, the torch, the candles, a lit match - and asking it correctly on every dark room's own `requires` would mean the same `any-of` of `all-of`s written out seventy-seven times, once per dark room. The grue's own danger is the same question asked a second way, at the same scale.

## Decision

`every-turn.yaml` asks the question once, into a `light` flag every dark room reads instead of repeating the check itself. The grue is answered the same way: one rule, keyed on the `dark` tag rather than named per room, covers all hundred and ten rooms instead of writing the same lines into the seventy-seven that are actually dark.

## Consequences

Seventy-seven repetitions become one rule and one flag, read rather than recomputed everywhere it matters. The cost is paid in the journal: a flag set by a rule is written to the journal exactly as a player's own decision is, so a playthrough now reads `light became false / light became true / the lamp's life became 174 / was-dark became false` before it gets to anything the player actually did. Bookkeeping kept by hand is loud in exactly the place a player-facing record should be quiet, and this is the first place that cost showed up.

## Alternatives

**Writing the same `any-of` block into every dark room's own `requires`** was the alternative, and is what the journal cost was traded to avoid: seventy-seven copies of the same five-condition check, kept in step by hand, is a worse maintenance shape than one flag - even accepting that the flag's own bookkeeping now narrates itself where a player is reading.
