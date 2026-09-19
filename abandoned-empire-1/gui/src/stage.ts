/**
 * `window.Stage.gui`, typed by `stage-gui.d.ts`.
 *
 * That file is the one Stage publishes for exactly this - copy it in, point the
 * editor at it, and everything a GUI can call and be told is there, along with the
 * real shape of a reply. It is not written by hand here: `deno task gui-types` in
 * the app repo puts the same file in every project that uses it, and a test there
 * holds it against the bridge itself, so what it says is what `Stage.gui` does.
 */
import type { StageGui } from './stage-gui';

export type { Measure, Preferences, SaveEntry, Turn } from './stage-gui';

/** `window.Stage.gui` - there by the time this script runs, since Stage's bridge is placed ahead of it. */
export const stage: StageGui = window.Stage.gui;

/** Why something failed, for a line on the screen: what a rejected call says, else what it was. */
export const reason = (error: unknown): string => error instanceof Error ? error.message : String(error);
