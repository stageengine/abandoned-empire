/**
 * A thin, in-process way to play `abandoned-empire-1` for a test.
 *
 * `deno run -A stage.ts play` is how a person plays the game, and how
 * `tools/audit.py` compares it against the real Zork - both spawn a process
 * and read back text, which is right for a player and for a line-by-line
 * fidelity check, but slow and text-shaped for a test that just wants to know
 * whether a flag got set. `createGame` already returns structured turns and
 * touches no filesystem beyond reading the built `.stg` once, so this is
 * nothing but that, aimed at one game.
 *
 * The other half of what made this session's testing slow was combat: the
 * troll and the thief roll real dice, so a script played from a fresh start
 * dies to bad luck as often as it survives. `roll` (`engine/state/chance.ts`)
 * is a pure function of the game's id, `state.startedAt`, the turn number and
 * the roll's own name - nothing here reads real time or `Math.random` - so
 * pinning `startedAt` pins every roll for the rest of the playthrough. `seek`
 * below is what finds a `startedAt` worth pinning: it replays a script against
 * successive candidates, in process, until one satisfies whatever the caller
 * asks of the result, and hands back the seed rather than the state, since a
 * seed is what a test can commit to source control and a `State` object is
 * not.
 */
import createGame, { type Turn } from '../../../engine/engine/game.ts';
import createState from '../../../engine/engine/state/create-state.ts';
import openGame from '../../../engine/engine/build/open-game.ts';
import denoGameFile from '../../../engine/engine/build/deno-game-file.ts';

import type Game from '../../../engine/engine/interfaces/game.ts';
import type State from '../../../engine/engine/interfaces/state.ts';

const GAME_PATH = new URL('../../abandoned-empire-1.stg', import.meta.url).pathname;

let cached: Promise<Game> | null = null;

/** The built game, read once and reused by every test in the process. */
export const loadGame = (): Promise<Game> => (cached ??= openGame(GAME_PATH, denoGameFile));

/**
 * A fresh state whose luck is fixed.
 *
 * Same shape as the engine's own `test/pinned.ts` - deliberately, since a
 * pinned state is `{ game, startedAt }` and nothing more, and reimplementing
 * it here risked exactly the drift that file's own docblock says is why it is
 * shared rather than copied within the engine itself. This is one directory
 * further out than that sharing reaches, so it is repeated once, at the
 * narrowest point: only the two fields `roll` actually reads.
 *
 * @param {String} game The game's id.
 * @param {String} at An ISO timestamp naming when the playthrough began.
 */
export const pinned = (game: string, at = '2020-01-01T00:00:00.000Z'): State => {
  const state = createState();

  state.game = game;
  state.startedAt = at;

  return state;
};

export interface Played {
  /** The game's state after every command has run. */
  state: State;

  /** One `Turn` per command, in the order given. */
  turns: Array<Turn>;
}

/**
 * Run a script of commands against one state and report what happened.
 *
 * @param {Object} source The built game, from `loadGame`.
 * @param {Object} state Where to start - `pinned(...)` for a fresh seeded
 *   start, or a `State` read back from `game.state` to carry on from where an
 *   earlier `play` left off.
 * @param {Array} commands Plain player input, one command per element - no
 *   `quit`, no `@checkpoint` markers, nothing the CLI's own script format
 *   adds that is not itself a sentence the game answers.
 *
 * @returns {Object} The resulting state and the turn for each command.
 */
export const play = (source: Game, state: State, commands: ReadonlyArray<string>): Played => {
  // Cloned going in as well as coming out: `createGame` mutates the very
  // object it is handed rather than a copy of it, so a caller's own `state` -
  // kept from an earlier `play` to branch from twice, say - would otherwise
  // read as whatever the *last* `play` to touch it left behind, silently,
  // the moment it was passed to a second one.
  const game = createGame(source, structuredClone(state));
  const turns = commands.map((command) => game.perform(command));

  return { state: structuredClone(game.state), turns };
};

/** Every message from every turn, flattened and in order - what a script said, start to end. */
export const transcript = (played: Played): Array<string> => played.turns.flatMap((turn) => turn.messages);

/**
 * Search for a `startedAt` that makes a script come out the way a test wants.
 *
 * Candidates are one second apart from a fixed base, which is arbitrary but
 * stable: the same game and the same script always search the same sequence
 * of seeds in the same order, so once `check` accepts one, that seed keeps
 * accepting it - there is nothing left to be lucky about, which is the whole
 * point of writing it into `scenarios.ts` afterward instead of calling `seek`
 * again on every test run.
 *
 * @param {Object} source The built game, from `loadGame`.
 * @param {Array} commands The script to replay for each candidate.
 * @param {Function} check What a good outcome looks like, given the played
 *   result for one candidate seed.
 * @param {Object} options `tries` bounds the search (default 500); `from`
 *   moves the search window, for a caller re-seeking after a change shifted
 *   where the good seeds fall.
 *
 * @returns {Object} The first seed that satisfied `check`, and its result.
 * @throws {Error} Every candidate in the window failed `check`.
 */
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

/** True once anything in the transcript matches Zork's own death wording - a script's most common failure. */
export const died = (played: Played): boolean =>
  transcript(played).some((line) => /I'm afraid you are dead|devoured you/i.test(line));
