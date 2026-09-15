# The thief ambushes his own treasure room

## Context

`arch/0013` corrected how the egg opens on the thief's death, and its own writing repeated a piece of folklore worth re-checking: that `give egg to thief` fails because `recipient-first` verbs only take one word order. Tested directly rather than assumed - the same standard `arch/0012` and `arch/0013` hold themselves to - both `give egg to thief` and `give thief the egg` build the identical command; the engine already collapses them. What was actually failing, on a walkthrough played from the very start rather than from a hand-built state, was `You can't do that.` for *any* object given to the thief, in the room he is supposed to be standing in.

ZIL does not leave the thief's presence in his own hideout to chance. `TREASURE-ROOM-FCN`'s `M-ENTER` branch:

```
<COND (<NOT <IN? ,THIEF ,HERE>>
       <TELL
"You hear a scream of anguish as you violate the robber's hideaway.
Using passages unknown to you, he rushes to its defense." CR>
       <MOVE ,THIEF ,HERE>)>
```

He is teleported in the moment the player first sets foot there, whether his own wandering had put him elsewhere or nowhere in particular. This port had no equivalent: the thief's only route into the treasure room was `thief-walk`'s ordinary one-roll-of-thirty-three wander, the same chance any of thirty-two other rooms has. Most of the time, entering the treasure room found it merely empty of him.

Fixing only the teleport surfaced a second, sharper gap. `I-THIEF` only reaches its own wander logic once it already knows `<NOT <EQUAL? .RM ,HERE>>` - it does not roll to leave a room he currently shares with the player. This port's `thief-walk` rules had no such exclusion: a thief freshly placed in the treasure room by the new ambush was, on that identical turn, just as eligible as ever to be rolled onto one of the other thirty-two rooms by the same unconditional mechanism `arch/0010`'s stealing sweep already used elsewhere. The sword would glow on `up` into the ambush and stop glowing by the very next command - he had already wandered off before the player could type anything to him at all.

## Decision

Two changes, one per gap.

The ambush itself sits on `cyclops-room/config.yaml`'s `up` exit - the only way into the treasure room - following the same habit `arch/0011`'s living-room `down` already set for hanging a ZIL `M-ENTER` effect on the one edge that leads there instead of on the room's own entry:

```yaml
- type: all-of
  data:
    conditions:
      - type: object-in
        negate: true
        data: { object: thief, location: bin }
      - type: object-in
        negate: true
        data: { object: thief, location: treasure-room }
  failure:
    triggers:
      - type: change-scene
        data: { scene: treasure-room }
triggers:
  - type: response
    data:
      text: >-
        You hear a scream of anguish as you violate the robber's hideaway. Using passages
        unknown to you, he rushes to its defense.
  - type: move-object
    data: { object: thief, to: treasure-room }
  - type: change-scene
    data: { scene: treasure-room }
```

Checked against both the bin (dead) and the treasure room itself (already there - wandered in on his own, needing no scream to explain it), grouped under one `all-of` so the ordinary, silent `change-scene` is one `failure` rather than a second `up` action a scene may not declare twice.

The wander exclusion is `character-here` (negated) added to all thirty-three `thief-walk` rules in `every-turn.yaml`, uniformly, since the roll and its rooms are otherwise untouched:

```yaml
- requires:
    - type: character-here
      negate: true
      data: { character: thief }
    - type: object-in
      negate: true
      data: { object: thief, location: bin }
    - type: chance
      data: { name: thief-walk, of: 33, index: N }
```

## Consequences

`give` (and `attack`, and `look at`, and everything else a player might do with him) now finds the thief exactly where ZIL always guaranteed he would be: standing in his own treasure room the first time the player breaks in, and standing still once he is there, rather than a coin flip away on either count. The fix generalizes past this one room - any future ambush that places the thief with the player benefits from the same wander exclusion - though the treasure room is the only place this port currently does that.

Untouched: his ordinary wandering everywhere else in the dungeon, `arch/0010`'s stealing sweep, and `arch/0013`'s egg-opening pulse, none of which named or depended on where he was standing when they fired.

## Alternatives

**Only fixing the teleport, and leaving the wander roll as it stood**, was the first shape tried and is what surfaced the second gap: verified directly (`arch/0012`'s own standard) rather than assumed fixed, `up` into the ambush followed by `give egg to thief` on the very next turn still answered `You can't see any thief here.` most of the time. A reader who stopped at the teleport would have shipped a fix that only worked when the thief's own wander roll happened to leave him in place regardless.

**Gating the wander on a flag set by the ambush instead of `character-here`**, narrower and closer to "only exempt the turn he was just placed here," was set aside for reading less like the fact it is standing for: ZIL's own exemption is about where he currently stands relative to the player, full stop, not about how recently he arrived there. `character-here` says that directly and covers every future room an author might ambush him into without a second flag apiece.
