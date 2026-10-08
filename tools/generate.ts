import dungeon, { type Exit, type Room, type Thing } from './dungeon.ts';
import vocabulary from './vocabulary.ts';
import lookingProse, { lookingParts } from './routines.ts';
import writeYaml, { type Value } from './write-yaml.ts';

/** The game's id, which every one of its own files is named for. */
const GAME = 'abandoned-empire-1';

const [sourceDir = '../source/zork1', outputDir = '../abandoned-empire-1'] = Deno.args.filter((one) =>
  !one.startsWith('--')
);
const force = Deno.args.includes('--force');

const source = await Deno.readTextFile(`${sourceDir}/1dungeon.zil`);
const routines = await Deno.readTextFile(`${sourceDir}/1actions.zil`);

const { rooms, things } = dungeon(source);

const roomsById = new Map(rooms.map((room) => [room.id, room]));
const thingsById = new Map(things.map((thing) => [thing.id, thing]));

const ZIL_SIZE = 5;

const id = (name: string): string => name.toLowerCase();

const prose = (text: string): string =>
  text
    .split('|')
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const folder = (region: string): string =>
  region.toLowerCase().replaceAll('#', '').trim().replace(/[\s,]+/g, '-');

const notes = new Map<string, Set<string>>();
const note = (section: string, line: string) => {
  notes.set(section, (notes.get(section) ?? new Set()).add(line));
};

const SECTIONS = [
  'Rooms that describe themselves differently as the world changes',
  'Rooms with something to answer for',
  'Things with something to answer for',
  'Ways out that ZIL worked out in code',
  'Things inside other things',
  'Things that are not there until something reveals them',
  'Things made during play',
  'Scenery standing in more than one room',
  'Treasure',
  'Light',
  'Words a room knows that name nothing in it',
];

const BAGS = ['LOCAL-GLOBALS', 'GLOBAL-OBJECTS'];

const HOMES: Record<string, string> = {
  'HOT-BELL': 'ENTRANCE-TO-HADES',
  'BROKEN-LAMP': 'LIVING-ROOM',
  'DIAMOND': 'MACHINE-ROOM',
  'INFLATED-BOAT': 'DAM-BASE',
  'PUNCTURED-BOAT': 'DAM-BASE',
  'GUNK': 'MACHINE-ROOM',
  'BROKEN-EGG': 'UP-A-TREE',
  'BAUBLE': 'FOREST-2',
};

const homeOf = (thing: Thing): string | null => {
  const seen = new Set<string>();
  let at: Thing | undefined = thing;

  while (at && !seen.has(at.id)) {
    seen.add(at.id);

    if (at.location && roomsById.has(at.location)) {
      return at.location;
    }

    if (!at.location || BAGS.includes(at.location)) {
      return HOMES[at.id] ?? HOMES[thing.id] ?? null;
    }

    at = thingsById.get(at.location);
  }

  return HOMES[thing.id] ?? null;
};

const namesFor = (thing: Thing): Array<string> => {
  const words = thing.synonyms.map((one) => one.toLowerCase());
  const adjectives = thing.adjectives.map((one) => one.toLowerCase());

  const phrases = adjectives.flatMap((adjective) => words.map((word) => `${adjective} ${word}`));

  const all = [...words, ...phrases].filter((one) => one !== thing.name.toLowerCase());

  return [...new Set(all)];
};

const plainly = (name: string): string =>
  `There is ${'aeiou'.includes(name[0]?.toLowerCase()) ? 'an' : 'a'} ${name} here.`;

const thingYaml = (thing: Thing): Record<string, Value> => {
  const out: Record<string, Value> = { id: id(thing.id) };

  if (thing.name.toLowerCase() !== id(thing.id)) {
    out.name = thing.name;
  }

  const synonyms = namesFor(thing);

  if (synonyms.length) {
    out.synonyms = synonyms;
  }

  if (thing.flags.includes('TAKEBIT')) {
    out.portable = true;

    out.size = thing.size ?? ZIL_SIZE;
  }

  const never = thing.flags.includes('NDESCBIT');
  const listed = !never || thing.flags.includes('TAKEBIT');

  if (listed && !never && thing.first) {
    out.first = prose(thing.first);
  }

  if (listed) {
    out.here = thing.resting ? prose(thing.resting) : plainly(thing.name);
  }

  if (thing.location && roomsById.has(thing.location)) {
    out.start = id(thing.location);
  }

  if (!thing.location || !roomsById.has(thing.location)) {
    out.start = 'offstage';
  }

  if (thing.reading) {
    out.actions = [{
      id: 'look',
      triggers: [{ type: 'response', data: { text: prose(thing.reading) } }],
    }];
  }

  if (thing.flags.includes('INVISIBLE')) {
    note(
      'Things that are not there until something reveals them',
      `- \`${id(thing.id)}\` starts unseen, and needs \`conditions\` saying when it is not.`,
    );
  }

  if (thing.action) {
    note(
      'Things with something to answer for',
      `- \`${id(thing.id)}\` answers to \`${thing.action}\`.`,
    );
  }

  if (thing.caseValue > 0) {
    note(
      'Treasure',
      `- \`${id(thing.id)}\` scores ${thing.value} for the finding and ${thing.caseValue} in the case.`,
    );
  }

  return out;
};

const DARK = 'It is pitch black. You are likely to be eaten by a grue.';

const RANKS = [
  { from: 350, rank: 'Master Adventurer' },
  { from: 331, rank: 'Wizard' },
  { from: 301, rank: 'Master' },
  { from: 201, rank: 'Adventurer' },
  { from: 101, rank: 'Junior Adventurer' },
  { from: 51, rank: 'Novice Adventurer' },
  { from: 26, rank: 'Amateur Adventurer' },
  { from: 0, rank: 'Beginner' },
].reverse();

const describing = (room: Room): Array<Value> => {
  const written = room.description ?? lookingProse(routines, room.action);

  const parts = lookingParts(routines, room.action);

  if (!written) {
    note(
      'Rooms that describe themselves differently as the world changes',
      `- **${room.name}** says nothing the seed could find, in \`${room.action}\`.`,
    );
  }

  if (written && parts > 1 && !room.description) {
    note(
      'Rooms that describe themselves differently as the world changes',
      `- **${room.name}** has ${parts} things it may say, in \`${room.action}\`; the seed took the first.`,
    );
  }

  const base = prose(written ?? `TODO: ${room.name}`);

  const action: Record<string, Value> = { id: 'look' };

  if (!room.lit) {
    action.conditions = [{ type: 'flag', data: { flag: 'light' } }];
  }

  action.triggers = [{ type: 'response', data: { text: base } }];

  const actions: Array<Value> = [action as Value];

  if (!room.lit) {
    actions.push({ id: 'look', triggers: [{ type: 'response', data: { text: DARK } }] });
  }

  return actions;
};

const wayOut = (room: Room, exit: Exit): Value => {
  const out: Record<string, Value> = { id: exit.direction };

  if (!exit.to) {
    if (exit.routine) {
      note(
        'Ways out that ZIL worked out in code',
        `- **${room.name}**, ${exit.direction}, in \`${exit.routine}\`.`,
      );
    }

    out.triggers = [{
      type: 'response',
      data: { text: prose(exit.refusal ?? `TODO: ${exit.routine}`) },
    }];

    return out;
  }

  const flag = exit.flag ? id(exit.flag) : exit.open ? `${id(exit.open)}-open` : null;

  if (flag) {
    const condition: Record<string, Value> = { type: 'flag', data: { flag } };

    if (exit.refusal) {
      condition.failure = {
        triggers: [{ type: 'response', data: { text: prose(exit.refusal) } }],
      };
    }

    out.conditions = [condition];
  }

  out.triggers = [{ type: 'change-scene', data: { scene: id(exit.to) } }];

  return out;
};

const sceneryFor = (room: Room): Array<Value> =>
  room.scenery.flatMap((name) => {
    const thing = thingsById.get(name);

    if (!thing) {
      return [];
    }

    if (thing.action) {
      note(
        'Things with something to answer for',
        `- \`${id(thing.id)}\` answers to \`${thing.action}\`, in every room that names it.`,
      );
    }

    const out: Record<string, Value> = {
      id: `${id(room.id)}.${id(thing.id)}`,
      name: thing.name,
    };

    const synonyms = namesFor(thing);

    if (synonyms.length) {
      out.synonyms = synonyms;
    }

    return [out as Value];
  });

const written: Array<string> = [];

const put = async (path: string, body: string) => {
  const full = `${outputDir}/${path}`;

  await Deno.mkdir(full.slice(0, full.lastIndexOf('/')), { recursive: true });
  await Deno.writeTextFile(full, body);

  written.push(path);
};

if (!force) {
  const already = await Deno.stat(`${outputDir}/scenes`).catch(() => null);

  if (already) {
    console.error(
      `${outputDir}/scenes already exists. This seeds a game once and would write over\n` +
        'whatever has been written since. Pass --force if that is what you want.',
    );
    Deno.exit(1);
  }
}

const named = new Set(rooms.flatMap((room) => room.scenery));
const filed = things.filter((thing) => !BAGS.includes(thing.location ?? ''));

for (const thing of filed) {
  const home = homeOf(thing);

  if (!home) {
    note(
      'Things made during play',
      `- \`${id(thing.id)}\` belongs to no room, and nothing will place it.`,
    );
  }

  if (thing.location && !roomsById.has(thing.location) && !BAGS.includes(thing.location)) {
    note(
      'Things inside other things',
      `- \`${id(thing.id)}\` starts inside \`${
        id(thing.location)
      }\`, and waits offstage until there are containers.`,
    );
  }

  if (!thing.location) {
    note(
      'Things made during play',
      `- \`${id(thing.id)}\` is filed under **${roomsById.get(home ?? '')?.name ?? 'nowhere'}**.`,
    );
  }

  await put(
    `objects/${folder(roomsById.get(home ?? '')?.region ?? thing.region)}/${id(thing.id)}.object.config.yaml`,
    writeYaml(thingYaml(thing), ['synonyms', 'actions', 'measures']),
  );
}

for (const thing of things.filter((one) => BAGS.includes(one.location ?? '') && !named.has(one.id))) {
  note(
    'Scenery standing in more than one room',
    `- \`${id(thing.id)}\` is scenery no room names, and is not written at all.`,
  );
}

for (const room of rooms) {
  const here = filed.filter((thing) => homeOf(thing) === room.id).map((thing) => id(thing.id));

  const scene: Record<string, Value> = {
    id: id(room.id),
    meta: { title: room.name },
    actions: describing(room),
  };

  const objects = [...here, ...sceneryFor(room)];

  if (objects.length) {
    scene.objects = objects as Array<Value>;
  }

  if (room.exits.length) {
    scene.navigation = room.exits.map((exit) => wayOut(room, exit));
  }

  if (room.action) {
    note('Rooms with something to answer for', `- **${room.name}** answers to \`${room.action}\`.`);
  }

  for (const pseudo of room.pseudo) {
    note(
      'Words a room knows that name nothing in it',
      `- **${room.name}** knows "${pseudo.word.toLowerCase()}", via \`${pseudo.routine}\`.`,
    );
  }

  await put(
    `scenes/${folder(room.region)}/${id(room.id)}.scene.config.yaml`,
    writeYaml(scene, ['meta', 'actions', 'objects', 'navigation']),
  );
}

const lights = things.filter((thing) => thing.flags.includes('LIGHTBIT'));

await put(
  `${GAME}.game.turns.yaml`,
  writeYaml({
    every: [
      { triggers: [{ type: 'set-flag', data: { flag: 'light', value: false } }] },
      ...lights.map((thing) => ({
        conditions: [
          { type: 'has-item', data: { object: id(thing.id) } },
          ...(thing.flags.includes('ONBIT') ? [] : [{ type: 'flag', data: { flag: `${id(thing.id)}-on` } }]),
        ],
        triggers: [{ type: 'set-flag', data: { flag: 'light', value: true } }],
      })),
    ] as Array<Value>,
  }),
);

for (const thing of lights) {
  note(
    'Light',
    `- \`${id(thing.id)}\` gives light${thing.flags.includes('ONBIT') ? ', and is already burning' : ''}.`,
  );
}

await put(
  `${GAME}.game.vocabulary.yaml`,
  writeYaml(vocabulary(), ['verbs', 'directions', 'articles', 'prepositions', 'conjunctions']),
);

await put(
  `${GAME}.game.config.yaml`,
  writeYaml(
    {
      id: GAME,
      start: id(rooms[0].id),

      metadata: {
        title: 'Abandoned Empire',
        version: '0.1.0',
        description: 'The Great Underground Empire, ported to Stage from Infocom\u2019s own ZIL source. ' +
          'A white house, a trap door, and three hundred and fifty points of treasure ' +
          'between you and the rank of Master Adventurer.',
        genres: ['Adventure', 'Fantasy', 'Puzzle'],
      },
    } as Record<string, Value>,
    ['metadata'],
  ),
);

await put(
  `${GAME}.game.player.yaml`,
  writeYaml({
    measures: [{
      id: 'score',
      max: 350,
      start: 0,
      thresholds: RANKS.map(({ from, rank }) =>
        from === 0 ? { from } : {
          from,
          triggers: [{
            type: 'response',
            data: { text: `You have earned the rank of ${rank}.` },
          }],
        }
      ),
    }],
  } as Record<string, Value>),
);

await put(
  'report.md',
  [
    '# What the seed did not write',
    '',
    `Generated from \`${sourceDir}\`: ${rooms.length} rooms, ${filed.length} things,`,
    `${rooms.flatMap((room) => room.exits).length} ways out.`,
    '',
    "Everything below is a person's job. Delete a line when it is done.",
    '',
    ...SECTIONS.flatMap((section) => {
      const held = notes.get(section);

      if (!held) {
        return [];
      }

      return [`## ${section} (${held.size})`, '', ...[...held].sort(), ''];
    }),
  ].join('\n'),
);

console.log(`wrote ${written.length} files to ${outputDir}`);
console.log(
  `${[...notes.values()].reduce((total, held) => total + held.size, 0)} things left for a person, ` +
    `listed in ${outputDir}/report.md`,
);
