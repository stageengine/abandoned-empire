import read, { atom, type Node, text, walk } from './read-zil.ts';

export const DIRECTIONS: Record<string, string> = {
  NORTH: 'north',
  SOUTH: 'south',
  EAST: 'east',
  WEST: 'west',
  NE: 'northeast',
  NW: 'northwest',
  SE: 'southeast',
  SW: 'southwest',
  UP: 'up',
  DOWN: 'down',
  LAND: 'land',
};

export interface Exit {
  direction: string;
  to: string | null;
  refusal: string | null;
  flag: string | null;
  open: string | null;
  routine: string | null;
}

export interface Room {
  id: string;
  name: string;
  region: string;
  description: string | null;
  lit: boolean;
  flags: Array<string>;
  value: number;
  exits: Array<Exit>;
  action: string | null;
  scenery: Array<string>;
  pseudo: Array<{ word: string; routine: string }>;
}

export interface Thing {
  id: string;
  name: string;
  region: string;
  synonyms: Array<string>;
  adjectives: Array<string>;
  location: string | null;
  first: string | null;
  resting: string | null;
  reading: string | null;
  flags: Array<string>;
  action: string | null;
  size: number | null;
  capacity: number | null;
  value: number;
  caseValue: number;
}

export interface Dungeon {
  rooms: Array<Room>;
  things: Array<Thing>;
}

type Form = Extract<Node, { kind: 'form' }>;

const listed = (nodes: Array<Node>): Array<string> =>
  nodes.map(atom).filter((one): one is string => one !== null && one !== '');

const properties = (form: Form): Map<string, Array<Array<Node>>> => {
  const out = new Map<string, Array<Array<Node>>>();

  for (const item of form.items.slice(2)) {
    if (item.kind !== 'form' || item.open !== '(') {
      continue;
    }

    const name = atom(item.items[0]);

    if (!name) {
      continue;
    }

    out.set(name, [...(out.get(name) ?? []), item.items.slice(1)]);
  }

  return out;
};

const one = (found: Map<string, Array<Array<Node>>>, name: string): Array<Node> | null =>
  found.get(name)?.[0] ?? null;

const isExit = (values: Array<Node>): boolean => {
  const head = atom(values[0]);

  return head === 'TO' || head === 'PER' || values[0]?.kind === 'string';
};

const readExit = (direction: string, values: Array<Node>): Exit => {
  const exit: Exit = {
    direction: DIRECTIONS[direction],
    to: null,
    refusal: null,
    flag: null,
    open: null,
    routine: null,
  };

  if (values[0]?.kind === 'string') {
    exit.refusal = values[0].value;

    return exit;
  }

  if (atom(values[0]) === 'PER') {
    exit.routine = atom(values[1]);

    return exit;
  }

  exit.to = atom(values[1]);

  const at = values.findIndex((value) => atom(value) === 'IF');

  if (at === -1) {
    return exit;
  }

  const subject = atom(values[at + 1]);

  if (atom(values[at + 2]) === 'IS') {
    exit.open = subject;
  }

  if (atom(values[at + 2]) !== 'IS') {
    exit.flag = subject;
  }

  const otherwise = values.findIndex((value) => atom(value) === 'ELSE');

  if (otherwise !== -1) {
    exit.refusal = text(values[otherwise + 1]);
  }

  return exit;
};

const regions = (source: string): Array<{ at: number; name: string }> =>
  [...source.matchAll(/"SUBTITLE ([^"]+)"/g)].map((found) => ({
    at: found.index ?? 0,
    name: found[1].trim(),
  }));

export const dungeon = (source: string): Dungeon => {
  const tree = read(source);
  const breaks = regions(source);

  const regionOf = (kind: string, name: string): string => {
    const found = new RegExp(`^<${kind}\\s+${name}(?![A-Z0-9?-])`, 'm').exec(source);

    if (!found) {
      return 'ELSEWHERE';
    }

    return breaks.filter((one) => one.at < (found.index ?? 0)).pop()?.name ?? 'ELSEWHERE';
  };

  const forms = [...walk(tree)].filter((node): node is Form =>
    node.kind === 'form' && node.open === '<' && node.items.length > 1
  );

  const rooms: Array<Room> = [];
  const things: Array<Thing> = [];

  for (const form of forms) {
    const kind = atom(form.items[0]);
    const name = atom(form.items[1]);

    if (!name || (kind !== 'ROOM' && kind !== 'OBJECT')) {
      continue;
    }

    const found = properties(form);

    if (kind === 'ROOM') {
      const exits: Array<Exit> = [];

      for (const word of Object.keys(DIRECTIONS)) {
        for (const values of found.get(word) ?? []) {
          if (!isExit(values)) {
            continue;
          }

          exits.push(readExit(word, values));
        }
      }

      const flags = listed(one(found, 'FLAGS') ?? []);
      const value = one(found, 'VALUE')?.[0];

      rooms.push({
        id: name,
        name: text(one(found, 'DESC')?.[0]) ?? name,
        region: regionOf(kind, name),
        description: text(one(found, 'LDESC')?.[0]),
        lit: flags.includes('ONBIT'),
        flags,
        value: value?.kind === 'number' ? value.value : 0,
        exits,
        action: atom(one(found, 'ACTION')?.[0]),
        scenery: (found.get('GLOBAL') ?? []).flatMap(listed),
        pseudo: (found.get('PSEUDO') ?? []).flatMap((values) =>
          values.flatMap((value, at) =>
            value.kind === 'string' ? [{ word: value.value, routine: atom(values[at + 1]) ?? '' }] : []
          )
        ),
      });

      continue;
    }

    const number = (key: string): number | null => {
      const value = one(found, key)?.[0];

      return value?.kind === 'number' ? value.value : null;
    };

    things.push({
      id: name,
      name: text(one(found, 'DESC')?.[0]) ?? name,
      region: regionOf(kind, name),
      synonyms: (found.get('SYNONYM') ?? []).flatMap(listed),
      adjectives: (found.get('ADJECTIVE') ?? []).flatMap(listed),
      location: atom(one(found, 'IN')?.[0]),
      first: text(one(found, 'FDESC')?.[0]),
      resting: text(one(found, 'LDESC')?.[0]),
      reading: text(one(found, 'TEXT')?.[0]),
      flags: listed(one(found, 'FLAGS') ?? []),
      action: atom(one(found, 'ACTION')?.[0]),
      size: number('SIZE'),
      capacity: number('CAPACITY'),
      value: number('VALUE') ?? 0,
      caseValue: number('TVALUE') ?? 0,
    });
  }

  return { rooms, things };
};

export default dungeon;
