# Abandoned Empire

Infocom's Zork, ported to the [Stage engine](https://engine.sgail.com) - published
under the name *Abandoned Empire*, since the MIT relicense covers the source but not
the trademark. See [NOTICE.md](NOTICE.md#the-name).

This is a port and not a remake: where a description exists, it is the one Infocom
wrote. [NOTICE.md](NOTICE.md) says where the source came from and under what terms.
Zork I is `abandoned-empire-1/`; Zork II and III use the same ZIL and the same
tooling, and would sit beside it as `abandoned-empire-2/` and `abandoned-empire-3/`
when their turn comes.

## Playing it

```sh
stage build abandoned-empire-1
stage play abandoned-empire-1.stg
```

The game is complete and winnable. [`abandoned-empire-1/ROADMAP.md`](abandoned-empire-1/ROADMAP.md)
is what is honestly still open; [`arch/`](arch/) records the decisions behind every
place Stage does not do exactly what ZIL did, in the shape
[`arch/0000`](arch/0000-record-architecture-decisions.md) describes.

## The tools

`tools/` holds what built this from the ZIL source and what checks it against the
original: a ZIL reader, the generator that seeded the game once, and `audit.py`,
which plays one script through both the original under `dfrotz` and the built game
under `stage play` and prints the first place their replies part company. See the
tools themselves for usage - each carries its own short doc comment.
