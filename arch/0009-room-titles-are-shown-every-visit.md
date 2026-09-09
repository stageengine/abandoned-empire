# Room titles are shown every visit

## Context

`meta.title` sat on every one of the port's hundred and ten scenes from the start, read by nothing a player could ever see. ZIL's own *verbose* mode prints a room's title above its description on every single visit and never shortens the body text on a revisit; its *default*, *brief*, also prints the title every visit but drops the body text the second time a room is seen.

## Decision

The engine now prints a scene's title once, above its own description, on every visit - full fidelity with *verbose*, the mode ZIL supports but does not default to. *Brief*'s other half, dropping the body text on a revisit, is a separate and larger piece of work: a `visited`-gated second `presence` block on all hundred and ten rooms, and is not part of this decision.

## Consequences

A player of this port experiences something closer to *verbose* throughout - a title on every visit, and full body text every time - rather than ZIL's own default *brief* behaviour. This showed up directly this session: comparing a full playthrough against the compiled original turn for turn needed *verbose* forced on the original first, because its own default of *brief* would otherwise abbreviate every revisited room and permanently disagree with the port's own always-full text, for a reason that has nothing to do with either side being wrong.

## Alternatives

**Implementing brief's revisit-shortening too**, so the port could offer both classic modes, was named rather than done - a `visited`-gated second `presence` block per room, on all hundred and ten of them, is real content work rather than an afternoon, and nothing in the port needed it to be playable.
