# Roadmap

- [What this page is](#what-this-page-is)
- [The walkthrough is tighter on lamp turns than it looks](#the-walkthrough-is-tighter-on-lamp-turns-than-it-looks)

## What this page is

`report.md` tracked what the seed did not write, room by room and object by object, until there was nothing left on it. What used to live there - decisions made along the way, and the alternatives tried and set aside - has moved to [`arch/`](../arch/), one file per decision, in the shape [`arch/0000`](../arch/0000-record-architecture-decisions.md) describes. This page is what is left: not unwritten content, but a real limit in how this port is currently checked against the original.

## The walkthrough is tighter on lamp turns than it looks

A full 350-point playthrough, played turn for turn against the compiled original under `tools/audit.py`, is how two real bugs were found and fixed - one in the trophy case's own words, one in the vocabulary. Both surfaced because they sit before the first place the transcript forks: the troll fight, where the original and the port start rolling independent dice and nothing recovers alignment afterward.

`tools/audit.py` no longer has to lose that alignment forever. A script line of the form `@checkpoint name` saves both interpreters' state the first time it is reached, and a later run drops straight into it instead of replaying - and re-diffing - everything before, including whichever way a fight happened to go. See [`arch/0011`](../arch/0011-a-checkpoint-marker-for-audit-py.md) for the mechanics, confirmed directly: deleting one checkpoint recaptures only the segment that produces it, every other checkpoint's file provably untouched.

What running the checkpointed walkthrough surfaced instead: the lamp's own battery, 185 turns and matching ZIL exactly, sits close enough to how many turns a fight can take that an unlucky combat run - on *either* interpreter, independently - can burn through it before the torch is in hand, ending in a grue in the dark rather than at the trophy case. Not a port bug and not a tool bug; both sides hit it the same way. The walkthrough script pads every fight generously to survive not knowing how many rounds it takes, and that same padding is what eats into the turns the lamp has to spend elsewhere. Worth a second pass: fewer wasted turns in the padding, or a checkpoint placed before the coal mine's own light-source juggling so an unlucky fight earlier does not cost a run further down the line - not done, named here so the next person chasing a death this deep in a transcript checks this first.
