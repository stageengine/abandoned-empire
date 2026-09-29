import createGame, { type Turn } from '../../../engine/engine/game.ts';
import createState from '../../../engine/engine/state/create-state.ts';
import openGame from '../../../engine/engine/build/open-game.ts';
import denoGameFile from '../../../engine/engine/build/deno-game-file.ts';

import type Game from '../../../engine/engine/interfaces/game.ts';
import type State from '../../../engine/engine/interfaces/state.ts';

const GAME_PATH = new URL('../../abandoned-empire-1.stg', import.meta.url).pathname;

let cached: Promise<Game> | null = null;

export const loadGame = (): Promise<Game> => (cached ??= openGame(GAME_PATH, denoGameFile));

export const pinned = (game: string, at = '2020-01-01T00:00:00.000Z'): State => {
  const state = createState();

  state.game = game;
  state.startedAt = at;

  return state;
};

export interface Played {
  state: State;
  turns: Array<Turn>;
}

export const play = (source: Game, state: State, commands: ReadonlyArray<string>): Played => {
  const game = createGame(source, structuredClone(state));
  const turns = commands.map((command) => game.perform(command));

  return { state: structuredClone(game.state), turns };
};

export const transcript = (played: Played): Array<string> => played.turns.flatMap((turn) => turn.messages);

export const seek = (
  source: Game,
  commands: ReadonlyArray<string>,
  check: (played: Played) => boolean,
  options: { tries?: number; from?: number } = {},
): { seed: string; played: Played } => {
  const { tries = 500, from = 0 } = options;
  const base = Date.parse('2020-01-01T00:00:00.000Z');

  for (let i = from; i < from + tries; i++) {
    const seed = new Date(base + i * 1000).toISOString();
    const played = play(source, pinned(source.id, seed), commands);

    if (check(played)) {
      return { seed, played };
    }
  }

  throw new Error(`no seed in [${from}, ${from + tries}) satisfied the check for ${JSON.stringify(commands)}`);
};

export const died = (played: Played): boolean =>
  transcript(played).some((line) => /I'm afraid you are dead|devoured you/i.test(line));
