/**
 * The shape of `window.Stage.gui`, as `app/src/gui-host/runtime.ts` injects it
 * into every GUI's document before that GUI's own script runs - see
 * `app/src/interfaces/bridge.ts` for the messages behind each call.
 *
 * Typed here rather than imported: this project builds standalone (Stage's
 * own `engine`/`app` repos are out of scope to touch, and gui-src's build
 * never crosses into them), so this is a local mirror of just the surface
 * this GUI actually calls, the same way `app/src/interfaces/gui.ts` mirrors
 * the engine's own build output rather than importing across that seam.
 */

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

export interface Reply {
  scene: Scene;
  measures: ReadonlyArray<Measure>;
  finished: boolean;
}

export interface Turn {
  lines: ReadonlyArray<Line>;
  reply: Reply | null;
}

export interface ConditionTrace {
  [key: string]: unknown;
}

export interface TriggerTrace {
  [key: string]: unknown;
}

export interface Trace {
  conditions?: ReadonlyArray<ConditionTrace>;
  triggers?: ReadonlyArray<TriggerTrace>;
}

export interface StageGui {
  onTurn(fn: (turn: Turn) => void): void;
  onTrace(fn: (trace: Trace) => void): void;
  onTyping(fn: (text: string) => void): void;
  ownsPrompt(): void;
  focus(): void;
  blur(): void;
  begin(): void;
}

declare global {
  interface Window {
    Stage: { gui: StageGui };
  }
}

/** `window.Stage.gui` - guaranteed to exist by the time this GUI's script
 *  runs at all, since `assemble.ts` places the bridge's own `<script>`
 *  ahead of this GUI's in the document (see the note in `runtime.ts`). */
export const stage: StageGui = window.Stage.gui;
