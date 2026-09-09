# Every treasure the thief steals travels with him

## Context

ZIL's thief takes everything qualifying from the room he robs in a single pass, and drops everything he is holding in the one room he dies in. Before the engine's `tagged` condition and `move-tagged` trigger existed (`arch/0026` in the engine repository), the only way to write "take whatever they are carrying" was one `every-turn.yaml` rule per stealable object, gated on `has-item` for that one object and firing `remove-from-inventory` for it - sixteen rules saying the same thing about sixteen different nouns.

## Decision

Sixteen objects - `bag-of-coins`, `bar`, `bauble`, `bracelet`, `canary`, `chalice`, `coffin`, `diamond`, `egg`, `emerald`, `jade`, `pot-of-gold`, `scarab`, `sceptre`, `torch`, `trident` - carry `tags: [treasure]`. This is ZIL's own list of what the thief's `ROB` routine actually steals, not the wider set of twenty-one the trophy case will score: the trunk of jewels, the painting, the skull, and the broken egg and canary are trophy-worthy but not on the thief's own target list, and the tag follows the thief's list rather than the case's.

One rule in `every-turn.yaml` replaces the sixteen: gated on `character-here: thief` and `tagged: { tag: treasure, location: inventory }`, firing `move-tagged` from `inventory` to `held:thief` in place of the sixteen `remove-from-inventory` calls. The thief's own death threshold gained a matching `move-tagged` from `held:thief` to `here`, alongside the `move-object` calls that already sent his bag and stiletto to the room he falls in.

## Consequences

Sixteen near-identical rules become one, closing the engine's own roadmap entries for a tag on a thing and a trigger that could not act on a thing chosen during play in the same stroke - they turned out to be one gap read from two directions. The death-side half of this decision also fixed a real, separately-discovered bug: before it, a stolen treasure was sent to whatever room the theft happened in rather than to the thief, so it never actually travelled with him and could not be recovered by killing him - a correction rather than a decision, so its own account is the commit that made it rather than a page here.

## Alternatives

**Keeping the sixteen rules and only fixing where `remove-from-inventory` sent its target** was the smaller, more local fix available, and was rejected in favour of the wildcard mechanism precisely because the roadmap already named the sixteen-rule shape itself as the gap worth closing - patching the destination would have fixed the bug and left the duplication in place.
