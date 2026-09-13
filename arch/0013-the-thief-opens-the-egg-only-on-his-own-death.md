# The thief opens the egg only on his own death

## Context

`report.md` (retired into `arch/`, see `arch/0000`) verified the thief's stealing by collapsing sixteen near-identical "he takes treasure X" rules into one generic mechanism: anything tagged `treasure` is swept from the player's hands into his, and everything he is holding is dropped in the room he dies in (`arch/0010`). That is correct, and it is also where a real gap in this port was hiding: ZIL's own version of the drop, `DEPOSIT-BOOTY`, does one thing to the egg that it does to nothing else it drops.

```
<ROUTINE DEPOSIT-BOOTY (RM "AUX" X N (FLG <>))
	 ...
	 <COND (<EQUAL? .X ,EGG>
		<SETG EGG-SOLVE T>
		<FSET ,EGG ,OPENBIT>)>)>>
```

Opening the egg is not something `give` does - giving him any treasure at all, egg included, runs the same unconditional line (`<TELL "The thief places the " D ,PRSO " in his bag and thanks you politely." CR>`, or the taken-aback variant for anything with a `TVALUE`), and this port's own `give` action on `thief.character.yaml` already matches that: unconditional, no `indirect` named, catching whatever is handed over. Confirmed directly rather than assumed, the technique `arch/0012` names: a state built by hand with the egg already `held:thief` and the player carrying the knife, played from there, gives "The thief places the gift in his bag and thanks you politely." exactly as authored the moment `give thief the egg` is typed for real (`give` is `recipient-first`, so `give egg to thief` - the phrasing a walkthrough copied from the original transcript carries - is not a sentence this port's grammar accepts at all, which is a separate, cosmetic gap from the one this ADR closes).

Killing him is where ZIL's egg-opening single line lives, and this port's `move-tagged` sweep had no way to single the egg out from the pile it was moving.

## Decision

A one-turn pulse flag, the same shape `every-turn.yaml` already uses for `was-dark`: a flag one rule raises and a later rule always lowers again, so it can only ever be read on the one turn it means something.

`thief.character.yaml`'s death threshold raises it alongside everything else that already happens there:

```yaml
- type: set-flag
  data:
    flag: thief-just-died
    value: true
```

`every-turn.yaml` reads it once, right after the section documenting his stealing:

```yaml
- requires:
    - type: flag
      data: { flag: thief-just-died }
    - type: object-here
      data: { object: egg }
  triggers:
    - type: set-flag
      data: { flag: egg-open, value: true }

- requires:
    - type: flag
      data: { flag: thief-just-died }
  triggers:
    - type: set-flag
      data: { flag: thief-just-died, value: false }
```

`egg-open` is the same flag `canary.object.yaml` and `egg.object.yaml` already gate on for the player's own, destructive ways of opening it (`break`, `throw`, dropping it from the tree) - this is a fourth way in, the only one that leaves the egg and the canary inside it undamaged, matching ZIL exactly.

Verified the way `arch/0012` verifies: a state with the egg `held:thief`, killed from there by hand. Before this change, the fatal blow moved the egg to the room and left `egg-open` unset - the canary stayed hidden, exactly the bug the player who asked for this fix noticed. After it, `egg-open` reads `true` the turn he dies, `look at canary` and `take canary` both answer normally, and winding it still produces the songbird and the bauble.

## Consequences

The intact canary - the one worth winding for the bauble - is now reachable only by the thief's death, whatever put the egg in his hands first: giving it to him, or simply carrying it until he steals it, since `DEPOSIT-BOOTY` and this pulse both act on whatever he is holding without asking how it got there. Every other way of opening the egg is still what it always was: destructive, producing `broken-egg` and `broken-canary`, which cannot sing.

The pulse costs one flag and two rules for one object. That is the shape this engine's triggers force on a single-object exception inside an otherwise generic sweep - see *Alternatives* - and it is small next to what it fixes: a treasure worth six points found and a further point for the bauble it can no longer yield were quietly out of reach before this.

## Alternatives

**Putting the check directly in the death threshold**, immediately after `move-tagged`, was the first shape tried and is not possible: a threshold's `triggers` are one flat list with no way for one entry to run only if an earlier fact holds, since individual triggers carry no `requires` of their own (only whole actions and whole thresholds do). Branching on *which* object `move-tagged` just moved needs a place that can ask a question first, which is what `every-turn.yaml` is for everywhere else in this file.

**Keying the every-turn rule on `object-here: egg` and `flag: egg-open` (negated) alone, with no pulse**, was considered and set aside even though only one egg exists in this game: it would open the egg the moment it was ever dropped on any floor after the thief's death, whether he had touched it or not, which is a real distinction ZIL's own `DEPOSIT-BOOTY` draws and this port should not quietly erase. The pulse costs one more flag and reads exactly as `was-dark` already does two dozen lines above it in the same file, which is why it was preferred over inventing a narrower-but-novel shape for one object.
