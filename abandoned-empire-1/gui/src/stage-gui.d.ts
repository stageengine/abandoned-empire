/**
 * Everything a game's own GUI can call and be told: `window.Engine.gui`.
 *
 * Copy this file into your GUI's project and point your editor at it. It has no
 * imports, so it needs nothing else. The same file is published at
 * https://engine.sgail.com/stage-gui.d.ts.
 *
 * ```ts
 * import type { StageGui } from './stage-gui';
 *
 * const stage: StageGui = window.Engine.gui;
 *
 * await stage.ready;                            // Stage has said how things stand
 * draw(stage.turn);                             // so read it,
 * stage.on('turnChanged', draw);                // and hear about what changes
 * stage.begin();                                // then start the game
 * ```
 *
 * A note for whoever maintains this file: it is a copy of shapes that live in
 * the app (`interfaces/protocol.ts`, `interfaces/bridge.ts`), and
 * `gui-host/gui-api.test.ts` checks it against them and against the real bridge,
 * so it cannot drift without a test failing.
 */

/** Who is speaking: the player, the game, or Stage itself (`Saved.`, `Did you mean quit?`). */
export type Voice = 'player' | 'game' | 'stage';

/** One thing in the transcript. */
export interface Line {
  voice: Voice;
  text: string;
}

/** Where the player is standing. `title` is null for a scene nobody titled; `id` is always there. */
export interface Scene {
  id: string;
  title: string | null;
}

/** One measure, with the bounds it moves between. */
export interface Measure {
  id: string;
  value: number;
  min: number;
  max: number;
}

/** Something the player is carrying, and whatever it measures. */
export interface Holding {
  id: string;
  name: string;
  measures: Array<Measure>;
}

/**
 * Something that can be named where the player is standing: `name` is the game's
 * own word for it and what gets typed, `words` is everything it answers to
 * (lower case), `id` is what to key your own state on.
 */
export interface Affordance {
  id: string;
  name: string;
  words: Array<string>;
}

/** What can be said where the player is standing. */
export interface Affordances {
  /** Everybody standing here that can be seen. */
  characters: Array<Affordance>;

  /** Everything else standing here that can be seen, and what is being carried. */
  objects: Array<Affordance>;

  /** The ways out the room declares, under the room's own words for them. */
  navigation: Array<Affordance>;

  /** What somebody standing here would answer about. */
  topics: Array<Affordance>;
}

/** A save the player can come back to. */
export interface Saved {
  id: string;
  savedAt: string | null;
}

/** A credit the game declares, as either side of earning it describes it. */
export interface Achievement {
  id: string;
  secret?: boolean;
  title?: string;
  description?: string;
  icon?: boolean;
}

/** One thing the player did, as the journal records it. */
export interface JournalEntry {
  turn: number;
  type: string;
  detail: string;
}

/** One of the playthrough's saves, as the `saves` command lists them. */
export interface Kept {
  name: string;
  savedAt: string | null;
  turns: number | null;
}

/** One condition the resolver checked while resolving a turn, whether or not it held. */
export interface ConditionTrace {
  kind: 'condition';
  type: string;
  data: unknown;
  held: boolean;
}

/** One trigger the resolver fired while resolving a turn. */
export interface TriggerTrace {
  kind: 'trigger';
  type: string;
  data: unknown;
}

/**
 * How a turn was resolved, for a game that opted in with `trace:` in its
 * `config.yml`. Each list is missing, not empty, where the game did not ask for it.
 */
export interface Trace {
  conditions?: Array<ConditionTrace>;
  triggers?: Array<TriggerTrace>;
}

/** What a piece of input turned out to be. */
export type Kind =
  | 'turn'
  | 'saved'
  | 'loaded'
  | 'saves'
  | 'suggestion'
  | 'help'
  | 'inventory'
  | 'journal'
  | 'quit'
  | 'empty'
  | 'no-save'
  | 'bad-save-name'
  | 'unavailable';

/**
 * What just happened, when something did. Every field past `text` is present
 * only for the `kind` it names.
 */
export interface Outcome {
  kind: Kind;
  text: Array<string>;
  understood?: boolean;
  moved?: boolean;
  passing?: Array<string>;

  /** `turn` only. Achievements this turn unlocked. */
  unlocked?: Array<Achievement>;

  /** `turn` only, and only where the game asked for it. */
  trace?: Trace;

  /** `journal` only. */
  journal?: { entries: Array<JournalEntry>; turns: number };

  /** `saves` only. */
  saves?: Array<Kept>;

  /** `suggestion` only. */
  suggestion?: string;

  /** `quit` only. */
  ended?: boolean;

  /** `no-save` only. */
  name?: string | null;

  /** `bad-save-name` only. */
  said?: string;
}

/**
 * Where things stand after a turn: everything here holds regardless of what
 * just happened. What happened, when something did, is under `outcome`.
 */
export interface Reply {
  session: { id: string; expiresAt: string };
  scene: Scene;
  turns: number;

  /** What the player is carrying. */
  inventory: Array<Holding>;

  /** The player's own measures. Empty for a game that declares none. */
  measures: Array<Measure>;

  /** Whether the game has ended. */
  finished: boolean;

  save: Saved | null;

  /** What the playthrough currently holds. Missing for a game that declares none. */
  achievements?: Array<Achievement>;

  /** What can be said here. Missing where the game would rather not say. */
  affordances?: Affordances;

  /** How much of a resumed save no longer fits the game, by kind. Almost never present. */
  adrift?: Record<string, number>;

  description?: string | null;

  /** Missing when the playthrough was only asked about rather than played. */
  outcome?: Outcome;
}

/**
 * Everything said so far, and where things stand.
 *
 * `lines` is oldest first and only grows within a playthrough. A restart or a
 * load begins a new one, and its first turn arrives with `lines` shorter than
 * before: if you remember how much you have drawn, draw again from the start
 * when that happens (`reply.session.id` changes too).
 */
export interface Turn {
  lines: ReadonlyArray<Line>;

  /** `null` before a playthrough has begun. */
  reply: Reply | null;
}

/** The player's own preferences. The app's to keep, so you can read them and not change them. */
export interface Preferences {
  /** How large the prose is, as CSS, like `18px`. */
  size: string;

  /** How far apart its lines are, as a CSS number. */
  lineHeight: string;

  /** How wide a line may run, as CSS, like `70ch`. */
  measure: string;

  /**
   * Whether the player wants the strip saying what can be said where they stand.
   * If you draw your own, honour it.
   */
  affordances: boolean;
}

/** Where this GUI is running. */
export type Platform = 'macos' | 'windows' | 'linux';

/** One of the game's saves. `id` is opaque: only ever hand it back to `load`. */
export interface SaveEntry {
  id: string;
  name: string;
  savedAt: string | null;
  turns: number | null;
}

/** The things you can listen for with `on`. */
export type StageEvent =
  | 'turnChanged'
  | 'preferencesChanged'
  | 'resumableChanged'
  | 'traced';

export interface StageGui {
  /**
   * Settles once Stage has said how things stand. Everything under "How things
   * stand" is set from then on, so await this before you read any of it.
   */
  readonly ready: Promise<void>;

  // How things stand. Each is announced by an event when it changes.

  /** The latest turn and everything said before it. `null` only before `ready`. */
  readonly turn: Turn | null;

  /** The player's preferences. `null` only before `ready`. */
  readonly preferences: Preferences | null;

  /** Whether the window was opened to come back to a save. */
  readonly isResumable: boolean;

  /** Which platform this is. It never changes, so there is no event. `null` only before `ready`. */
  readonly platform: Platform | null;

  // Listening

  /**
   * Hear about a change. Returns a function that stops listening. Any number of
   * listeners per event, and nothing is announced for how things stood on
   * arrival: read those from the properties above after `ready`.
   */
  on(event: 'turnChanged', fn: (turn: Turn) => void): () => void;
  on(event: 'preferencesChanged', fn: (preferences: Preferences) => void): () => void;
  on(event: 'resumableChanged', fn: (isResumable: boolean) => void): () => void;

  /** How the turn just played was resolved. A one-off, not something you can read later. */
  on(event: 'traced', fn: (trace: Trace) => void): () => void;

  /** Stop listening. An event that does not exist throws, naming the ones that do. */
  off(event: StageEvent, fn: (value: never) => void): void;

  // Playing. Each settles once the first turn is in, or rejects with why not.

  /** Start the game for the first time. Comes back from a save if `isResumable`. */
  begin(): Promise<void>;

  /** Start again from the beginning, at any time. Whatever was saved is left alone. */
  restart(): Promise<void>;

  /**
   * Start from one of the game's saves, at any time. `id` is one `saves()` handed
   * back and nothing else. A save that cannot be opened rejects and leaves the
   * playthrough exactly as it was.
   */
  load(id: string): Promise<void>;

  /** The game's saves, most recently written first, including any made on the player's other devices. */
  saves(): Promise<Array<SaveEntry>>;

  /** Give up the playthrough and close the window, the same as its own close button. */
  quit(): void;

  // Input

  /** Play one line, exactly as if it had been typed and entered. */
  submit(text: string): void;

  /** Focus Stage's own (invisible) prompt field, when your own prompt is tapped. */
  focus(): void;

  /** Give up that field and put the keyboard down, when the player taps away. */
  blur(): void;

  /**
   * Your GUI's own saved data, kept per game and per signed-in person: twenty
   * names a game, 64 KB a value. Every call rejects with a reason rather than
   * failing silently. Not for secrets, since it is a file on the player's machine.
   */
  readonly storage: {
    /** What is stored under `name`, or `fallback` (else `null`) where nothing is. */
    get<T>(name: string, fallback: T): Promise<T>;
    get(name: string): Promise<unknown>;

    /** Keep `value`, in place of whatever was there. Not `null` or `undefined`: use `delete`. */
    set(name: string, value: unknown): Promise<void>;

    /** Take it away. Not a failure where nothing was stored. */
    delete(name: string): Promise<void>;
  };
}

declare global {
  interface Window {
    Engine: { gui: StageGui };
  }
}
