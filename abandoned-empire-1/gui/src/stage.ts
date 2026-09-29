import type { StageGui } from './stage-gui';

export type { Measure, Preferences, SaveEntry, Turn } from './stage-gui';

export const stage: StageGui = window.Engine.gui;

export const reason = (error: unknown): string => error instanceof Error ? error.message : String(error);
