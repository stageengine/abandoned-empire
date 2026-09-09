# Two returns, then the third is final

## Context

ZIL's `JIGS-UP` answers death against a `DEATHS` table: the first two deaths return the player to the Forest with a score penalty, and the third is final. A `requires`-gated threshold can hold one line - "you have died," a penalty, a flag - but cannot itself ask a second measure's value to decide which of two answers a given death gets.

## Decision

The health measure's own threshold stays one line. Two ordinary rules in `every-turn.yaml`, not the threshold itself, read the death flag against a `deaths` measure and decide which of Zork's two answers this death gets - an ordinary rule can ask a second measure where a threshold's own triggers cannot.

Two further simplifications, made once rather than modelled in full: every resurrection uses the ordinary Forest return, not ZIL's alternate return through a ghost in Hades for a death after the Temple has been visited; and only the lamp is returned to the Living Room on death, ZIL's own special case, rather than everything else the player was currently holding.

## Consequences

A death after the Temple reads slightly differently than ZIL's own text would for that specific case - a small, acknowledged loss of fidelity in exchange for not building a second return path for one late-game branch. Losing everything but the lamp on death is the real behaviour and matches ZIL for the common case; scattering the rest back to the player would want one rule per thing, the same cost the trophy case already pays, spent here on a corner case few playthroughs reach.

## Alternatives

**A rule per held thing, returning everything on death** was considered and set aside for cost against reach: the trophy case already carries this exact cost for the treasures that matter every playthrough, and paying it again for a rare double death was judged the wrong place to spend it.
