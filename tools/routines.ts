/**
 * Prose that ZIL kept in code rather than in the dungeon.
 *
 * Twenty-three of Zork I's rooms have no `LDESC`. They describe themselves in
 * their action routine instead, under `M-LOOK`, because what they say changes
 * with the world: the living room reads differently once the rug has been
 * moved, and again once the trap door is open.
 *
 * This pulls out the first thing such a routine says, which is the description
 * every version of the room begins with. The parts that vary are what the port
 * has to write by hand, as a `look` apiece, and the generator's report says
 * which rooms they are.
 */

import read, { atom, type Node, text, walk } from './read-zil.ts';

type Form = Extract<Node, { kind: 'form' }>;

const routines = new Map<string, Form>();

/** Index a file of routines the first time anything asks it for one. */
const index = (source: string) => {
  if (routines.size) {
    return;
  }

  for (const node of walk(read(source))) {
    if (node.kind !== 'form' || node.open !== '<') {
      continue;
    }

    if (atom(node.items[0]) !== 'ROUTINE') {
      continue;
    }

    const name = atom(node.items[1]);

    if (name) {
      routines.set(name, node);
    }
  }
};

/** The branch of a `COND` guarded by `<EQUAL? .RARG ,M-LOOK>`. */
const lookingBranch = (form: Form): Form | null => {
  for (const node of walk([form])) {
    if (node.kind !== 'form' || node.open !== '(') {
      continue;
    }

    const guard = node.items[0];

    if (guard?.kind !== 'form') {
      continue;
    }

    const mentions = [...walk([guard])].some((one) => atom(one) === 'M-LOOK');

    if (mentions) {
      return node;
    }
  }

  return null;
};

/**
 * What a room says before anything about it has changed.
 *
 * @param {String} source A file of ZIL routines.
 * @param {String} name The routine a room names as its `ACTION`.
 *
 * @returns {String} The first thing it says when looked at, or null.
 */
export const lookingProse = (source: string, name: string | null): string | null => {
  if (!name) {
    return null;
  }

  index(source);

  const routine = routines.get(name);

  if (!routine) {
    return null;
  }

  const branch = lookingBranch(routine);

  if (!branch) {
    return null;
  }

  return spoken(branch)[0] ?? null;
};

/** Every string a branch says, in order. */
const spoken = (branch: Form): Array<string> =>
  [...walk(branch.items.slice(1))]
    .map(text)
    .filter((one): one is string => one !== null && one.trim() !== '');

/**
 * Whether a room says more than one thing about itself.
 *
 * A routine holding two strings or more is describing a room that changes, and
 * `lookingProse` has given back only the part that never does. Those rooms need
 * writing by hand, so the seed's report has to know which they are.
 *
 * @param {String} source A file of ZIL routines.
 * @param {String} name The routine a room names as its `ACTION`.
 *
 * @returns {Number} How many separate things it may say when looked at.
 */
export const lookingParts = (source: string, name: string | null): number => {
  if (!name) {
    return 0;
  }

  index(source);

  const routine = routines.get(name);

  if (!routine) {
    return 0;
  }

  const branch = lookingBranch(routine);

  return branch ? spoken(branch).length : 0;
};

export default lookingProse;
