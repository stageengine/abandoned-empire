
export type Voice = 'player' | 'game' | 'stage';

export interface Line {
  voice: Voice;
  text: string;
}

export interface Scene {
  id: string;
  title: string | null;
}

export interface Measure {
  id: string;
  value: number;
  min: number;
  max: number;
}

export interface Holding {
  id: string;
  name: string;
  measures: Array<Measure>;
}

export interface Affordance {
  id: string;
  name: string;
  words: Array<string>;
}

export interface Affordances {
  characters: Array<Affordance>;

  objects: Array<Affordance>;

  navigation: Array<Affordance>;

  topics: Array<Affordance>;
}

export interface Saved {
  id: string;
  savedAt: string | null;
}

export interface Achievement {
  id: string;
  secret?: boolean;
  title?: string;
  description?: string;
  icon?: boolean;
}

export interface JournalEntry {
  turn: number;
  type: string;
  detail: string;
}

export interface Kept {
  name: string;
  savedAt: string | null;
  turns: number | null;
}

export interface ConditionTrace {
  kind: 'condition';
  type: string;
  data: unknown;
  held: boolean;
}

export interface TriggerTrace {
  kind: 'trigger';
  type: string;
  data: unknown;
}

export interface Trace {
  conditions?: Array<ConditionTrace>;
  triggers?: Array<TriggerTrace>;
}

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

export interface Outcome {
  kind: Kind;
  text: Array<string>;
  understood?: boolean;
  moved?: boolean;
  passing?: Array<string>;

  unlocked?: Array<Achievement>;

  trace?: Trace;

  journal?: { entries: Array<JournalEntry>; turns: number };

  saves?: Array<Kept>;

  suggestion?: string;

  ended?: boolean;

  name?: string | null;

  said?: string;
}

export interface Reply {
  session: { id: string; expiresAt: string };
  scene: Scene;
  turns: number;

  inventory: Array<Holding>;

  measures: Array<Measure>;

  finished: boolean;

  save: Saved | null;

  achievements?: Array<Achievement>;

  affordances?: Affordances;

  adrift?: Record<string, number>;

  description?: string | null;

  outcome?: Outcome;
}

export interface Turn {
  lines: ReadonlyArray<Line>;

  reply: Reply | null;
}

export interface Preferences {
  size: string;

  lineHeight: string;

  measure: string;

  affordances: boolean;
}

export type Platform = 'macos' | 'windows' | 'linux';

export interface SaveEntry {
  id: string;
  name: string;
  savedAt: string | null;
  turns: number | null;
}

export type StageEvent =
  | 'turnChanged'
  | 'preferencesChanged'
  | 'typedChanged'
  | 'resumableChanged'
  | 'traced';

export interface StageGui {
  readonly ready: Promise<void>;

  readonly turn: Turn | null;

  readonly preferences: Preferences | null;

  readonly typed: string;

  readonly isResumable: boolean;

  readonly platform: Platform | null;

  on(event: 'turnChanged', fn: (turn: Turn) => void): () => void;
  on(event: 'preferencesChanged', fn: (preferences: Preferences) => void): () => void;
  on(event: 'typedChanged', fn: (typed: string) => void): () => void;
  on(event: 'resumableChanged', fn: (isResumable: boolean) => void): () => void;

  on(event: 'traced', fn: (trace: Trace) => void): () => void;

  off(event: StageEvent, fn: (value: never) => void): void;

  begin(): Promise<void>;

  restart(): Promise<void>;

  load(id: string): Promise<void>;

  saves(): Promise<Array<SaveEntry>>;

  quit(): void;

  submit(text: string): void;

  ownsPrompt(): void;

  focus(): void;

  blur(): void;

  readonly storage: {
    get<T>(name: string, fallback: T): Promise<T>;
    get(name: string): Promise<unknown>;

    set(name: string, value: unknown): Promise<void>;

    delete(name: string): Promise<void>;
  };
}

declare global {
  interface Window {
    Engine: { gui: StageGui };
  }
}
