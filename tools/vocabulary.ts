/**
 * The words a Zork understands.
 *
 * All three games share a parser, so they share this: one table, written once,
 * emitted into each game's `vocabulary.yaml`. Where a game needs a word of its
 * own it is added to that game's file afterwards, which is why this is a seed
 * rather than something the game reads at build time.
 *
 * Three verb ids are the engine's own and are declared here because a game has
 * to declare them before it can use them: `look`, `get` and `drop`. Everything
 * else is ours, and every one of them has to be answered by an action on some
 * thing or the player is told they cannot.
 */

import type { Value } from './write-yaml.ts';

/** Verbs that reach a way out of a room rather than a thing standing in it. */
const NAVIGATIONAL = ['walk', 'climb', 'board', 'disembark', 'cross', 'follow'];

const CONVERSATIONAL = ['ask', 'tell', 'answer'];

/** Verbs naming who gets the thing before the thing itself: `give the troll the axe`. */
const RECIPIENT_FIRST = ['give', 'show'];

const VERBS: Record<string, Array<string>> = {
  // The three the engine answers itself.
  look: ['examine', 'read', 'inspect', 'study', 'watch', 'describe', 'x', 'l'],
  get: ['take', 'pick up', 'grab', 'carry', 'hold', 'gather'],
  drop: ['put down', 'discard', 'release', 'let go of'],

  // Getting about.
  walk: ['go', 'head', 'run', 'travel', 'proceed', 'return', 'wander'],
  climb: ['scale', 'ascend', 'clamber'],
  board: ['embark', 'get in', 'get into', 'sit in'],
  disembark: ['get out', 'get off'],
  cross: [],
  follow: ['pursue', 'chase'],

  // Handling.
  put: ['place', 'insert', 'stuff', 'set', 'lay'],
  open: [],
  close: ['shut'],
  move: ['push', 'shove', 'shift'],
  pull: ['tug', 'yank', 'drag'],
  raise: ['lift', 'hoist'],
  lower: [],
  turn: ['rotate', 'twist', 'crank', 'wind'],
  touch: ['feel', 'pat', 'rub', 'caress', 'poke', 'prod'],
  wave: ['flourish'],
  shake: [],
  squeeze: ['pinch'],
  tie: ['fasten', 'secure'],
  untie: ['loosen'],
  unlock: [],
  lock: [],
  dig: ['excavate'],
  fill: [],
  pour: ['empty', 'spill', 'dump'],
  plug: ['stop up'],
  inflate: ['pump up', 'blow up'],
  deflate: [],
  launch: ['set sail'],
  oil: ['lubricate', 'grease'],

  // Doing harm.
  attack: ['kill', 'hit', 'strike', 'stab', 'slay', 'murder'],
  break: ['smash', 'destroy', 'damage', 'mung'],
  kick: [],
  throw: ['hurl', 'chuck', 'toss'],
  cut: ['slice', 'chop'],
  melt: ['liquify'],
  burn: ['light', 'ignite', 'kindle', 'set fire to'],
  extinguish: ['douse', 'blow out', 'put out'],

  // The body, and the senses.
  eat: ['consume', 'taste', 'bite', 'devour', 'munch'],
  drink: ['sip', 'imbibe', 'quaff', 'swallow'],
  smell: ['sniff'],
  listen: ['hear'],
  knock: ['rap'],
  wear: ['don', 'put on'],
  wake: ['awaken'],
  jump: ['leap', 'hop'],
  swim: ['bathe', 'wade'],
  count: [],
  search: ['rummage'],

  // Words that are not doing anything to anything in particular.
  pray: [],
  exorcise: ['banish', 'lay to rest'],
  ring: ['toll'],
  wish: [],
  echo: [],

  // Talking.
  ask: ['question', 'enquire', 'inquire', 'quiz'],
  tell: ['inform'],
  answer: ['reply', 'respond', 'say'],
  give: ['hand', 'hand over', 'offer', 'pay', 'donate'],
  show: ['display', 'present'],
};

/**
 * ZIL's directions, less two.
 *
 * `IN` and `OUT` are not here. A word cannot be both a direction and a
 * preposition - the direction wins, and `put the painting in the case` stops
 * parsing - and `in` is worth far more as a preposition than as a way out.
 * Nothing is lost by it: every `IN` and `OUT` exit in Zork I has a compass twin
 * to the same room, so the generator drops them and says which it dropped.
 */
const DIRECTIONS: Record<string, Array<string>> = {
  north: ['n'],
  south: ['s'],
  east: ['e'],
  west: ['w'],
  northeast: ['ne'],
  northwest: ['nw'],
  southeast: ['se'],
  southwest: ['sw'],
  up: ['u', 'upward', 'upwards'],
  down: ['d', 'downward', 'downwards'],
  land: ['ashore'],
};

const listed = (table: Record<string, Array<string>>): Array<Value> =>
  Object.entries(table).map(([id, synonyms]) =>
    synonyms.length ? { id, synonyms } : { id } as Value
  ) as Array<Value>;

export const vocabulary = (): Record<string, Value> => ({
  navigational: NAVIGATIONAL,
  conversational: CONVERSATIONAL,
  'recipient-first': RECIPIENT_FIRST,

  verbs: listed(VERBS),
  directions: listed(DIRECTIONS),

  articles: [{ id: 'the' }, { id: 'a' }, { id: 'an' }, { id: 'some' }],

  prepositions: {
    // Noise a sentence may carry without changing what was asked.
    filler: [
      { id: 'to', synonyms: ['towards', 'toward', 'at'] },
      { id: 'from', synonyms: ['out of'] },
      { id: 'for', synonyms: [] },
    ],
    // Words that change what the verb means, and so are matched exactly.
    significant: [
      { id: 'in', synonyms: ['into', 'inside'] },
      { id: 'on', synonyms: ['onto', 'upon'] },
      // `off` earns its place because `turn off the lamp` has to be a different
      // action from `turn on` - which costs `take the label off the boat`, now
      // a phrasing the port has to answer for itself.
      { id: 'off', synonyms: ['off of'] },
      { id: 'under', synonyms: ['underneath', 'beneath', 'below'] },
      { id: 'behind', synonyms: [] },
      { id: 'with', synonyms: ['using'] },
      { id: 'about', synonyms: [] },
      { id: 'across', synonyms: [] },
      { id: 'through', synonyms: [] },
    ],
  },

  conjunctions: {
    coordinating: ['and', 'then'],
    subordinating: [],
  },
});

export default vocabulary;
