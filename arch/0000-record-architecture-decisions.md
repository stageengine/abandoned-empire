# Record architecture decisions

## Context

`report.md` was this repository's own "roadmap" - what the seed did not write, tracked room by room and object by object until nothing was left on it. Along the way it grew to hold three different things under one heading: gaps still open, workarounds already built and explained at length with the alternatives tried and set aside, and a running account of real bugs a full playthrough had found. `README.md`'s own "Where the port bends" carried a second, overlapping copy of the explanations. Once the gaps closed, what was left read like a finished work queue kept open out of habit - decisions that did not need to keep living beside a list, and a README repeating what a page one click away already said better.

## Decision

Adopt the engine's own convention. ADR files are stored in `/arch`, one file per decision, in Markdown, each with a title and four sections: **Context**, **Decision**, **Consequences**, and an optional **Alternatives** - the same shape [`engine/arch/0000`](https://github.com/stageengine/engine/blob/develop/arch/0000-record-architecture-decisions.md) and the app's own `arch/` already use.

- **Context** - the problem the decision answers, which here is almost always "ZIL could do X and Stage cannot, yet."
- **Decision** - what was built instead, and how it reads in the actual YAML.
- **Consequences** - what the choice costs a player or an author, including anywhere it is a smaller compromise than it first looks.
- **Alternatives** - other shapes considered - closer to ZIL, or waiting on an engine feature - and why they were set aside.

Files are named with a four-digit index ascending from `0000`, then a short slug. A later ADR may narrow or supersede an earlier one; the earlier one is not deleted or rewritten, since the record is of what was decided and when.

`report.md` is retired rather than trimmed: its decisions moved here. For a finished, winnable port, what remains open is a real limit on how it can be checked rather than unwritten content - `abandoned-empire-1/ROADMAP.md` tracked that limit for a while, the same distinction the engine's own `ROADMAP.md` draws between what is not yet built and what already has an ADR, and was itself retired once the verification technique in `arch/0012` closed the one thing it named. A real bug a full playthrough finds is neither a decision nor something still open: nothing was chosen and nothing is still open, only corrected, so its account belongs to the commit that fixed it rather than to a persisted page. `README.md` keeps a one-line pointer into `arch/` rather than the explanation itself.

## Consequences

A decision and its rejected alternatives are recorded once, near the content they explain, rather than as a paragraph inside a page about what is left. A reader asking "why is this like this" has one place to look; a reader asking "what is still open" has a much shorter one.
