import type { Value } from './write-yaml.ts';

const NAVIGATIONAL = ['walk', 'climb', 'board', 'disembark', 'cross', 'follow'];

const CONVERSATIONAL = ['ask', 'tell', 'answer'];

const RECIPIENT_FIRST = ['give', 'show'];

const VERBS: Record<string, Array<string>> = {
  look: ['examine', 'read', 'inspect', 'study', 'watch', 'describe', 'x', 'l'],
  get: ['take', 'pick up', 'grab', 'carry', 'hold', 'gather'],
  drop: ['put down', 'discard', 'release', 'let go of'],

  walk: ['go', 'head', 'run', 'travel', 'proceed', 'return', 'wander'],
  climb: ['scale', 'ascend', 'clamber'],
  board: ['embark', 'get in', 'get into', 'sit in'],
  disembark: ['get out', 'get off'],
  cross: [],
  follow: ['pursue', 'chase'],

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

  attack: ['kill', 'hit', 'strike', 'stab', 'slay', 'murder'],
  break: ['smash', 'destroy', 'damage', 'mung'],
  kick: [],
  throw: ['hurl', 'chuck', 'toss'],
  cut: ['slice', 'chop'],
  melt: ['liquify'],
  burn: ['light', 'ignite', 'kindle', 'set fire to'],
  extinguish: ['douse', 'blow out', 'put out'],

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

  pray: [],
  exorcise: ['banish', 'lay to rest'],
  ring: ['toll'],
  wish: [],
  echo: [],

  ask: ['question', 'enquire', 'inquire', 'quiz'],
  tell: ['inform'],
  answer: ['reply', 'respond', 'say'],
  give: ['hand', 'hand over', 'offer', 'pay', 'donate'],
  show: ['display', 'present'],
};

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

const verbs = (): Array<Value> =>
  listed(VERBS).map((entry) => ({
    ...entry as Record<string, Value>,
    ...(NAVIGATIONAL.includes((entry as { id: string }).id) ? { navigational: true } : {}),
    ...(CONVERSATIONAL.includes((entry as { id: string }).id) ? { conversational: true } : {}),
    ...(RECIPIENT_FIRST.includes((entry as { id: string }).id) ? { 'recipient-first': true } : {}),
  }));

export const vocabulary = (): Record<string, Value> => ({
  verbs: verbs(),
  directions: listed(DIRECTIONS),

  articles: [{ id: 'the' }, { id: 'a' }, { id: 'an' }, { id: 'some' }],

  prepositions: {
    filler: [
      { id: 'to', synonyms: ['towards', 'toward', 'at'] },
      { id: 'from', synonyms: ['out of'] },
      { id: 'for', synonyms: [] },
    ],
    significant: [
      { id: 'in', synonyms: ['into', 'inside'] },
      { id: 'on', synonyms: ['onto', 'upon'] },
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
