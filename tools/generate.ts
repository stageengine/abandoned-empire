/**
 * Seed a Stage game from a Zork dungeon file.
 *
 * This writes the mechanical half of the port and only the mechanical half: the
 * map, the ways between rooms, the things and what they are called, and the
 * prose exactly as Infocom wrote it. Everything a routine decided - a puzzle, a
 * fight, a description that changes as the world does - is left for a person,
 * and listed in the report so that nothing is left quietly.
 *
 * It is meant to be run once per game, to start the repository off. After that
 * the YAML is the game and this is history: run it again over a game somebody
 * has been writing in and it will write over their work. `--force` says you
 * meant it.
 */

import dungeon, { type Exit, type Room, type Thing } from './dungeon.ts';
import vocabulary from './vocabulary.ts';
import lookingProse, { lookingParts } from './routines.ts';
import writeYaml, { type Value } from './write-yaml.ts';

const [sourceDir = '../source/zork1', outputDir = '../abandoned-empire-1'] = Deno.args.filter((one) =>
  !one.startsWith('--')
);
const force = Deno.args.includes('--force');

const source = await Deno.readTextFile(`${sourceDir}/1dungeon.zil`);
const routines = await Deno.readTextFile(`${sourceDir}/1actions.zil`);

const { rooms, things } = dungeon(source);

const roomsById = new Map(rooms.map((room) => [room.id, room]));
const thingsById = new Map(things.map((thing) => [thing.id, thing]));

/** What an object weighs in ZIL when it does not say: `<PROPDEF SIZE 5>`. */
const ZIL_SIZE = 5;

/** What the port calls a thing ZIL called `WEST-OF-HOUSE`. */
const id = (name: string): string => name.toLowerCase();

/**
 * ZIL's `|` is a line break the player sees. Every other newline in a string
 * is only where the author's line ran out, so it folds back into a space.
 */
const prose = (text: string): string =>
  text
    .split('|')
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** A folder that groups without naming, so a room's id stays the one ZIL gave it. */
const folder = (region: string): string => `(${region.toLowerCase().replaceAll('#', '').trim()})`;

/**
 * The work queue.
 *
 * Everything the seed could not write is filed under a heading rather than
 * thrown onto one list, because the headings are the phases of the port: all
 * the containers are one problem, all the treasures are another.
 */
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

// ---------------------------------------------------------------------------
// Things
// ---------------------------------------------------------------------------

const BAGS = ['LOCAL-GLOBALS', 'GLOBAL-OBJECTS'];

/**
 * Where the eight things ZIL never places belong.
 *
 * Each of them is made during play - a lamp once it is smashed, a diamond once
 * the machine has been through the coal - so ZIL leaves them nowhere and moves
 * them in when the moment comes. Stage asks every thing which room it belongs
 * to even when it begins offstage, so the port has to answer, and the honest
 * answer is the room where the thing comes into the world.
 */
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

/**
 * The room a thing belongs to, following it up out of whatever it is inside.
 *
 * The garlic is in the sack, the sack is on the kitchen table, and the table is
 * in the kitchen; all three are the kitchen's to list.
 */
const homeOf = (thing: Thing): string | null => {
  const seen = new Set<string>();
  let at: Thing | undefined = thing;

  while (at && !seen.has(at.id)) {
    seen.add(at.id);

    if (at.location && roomsById.has(at.location)) {
      return at.location;
    }

    // The chain can run out inside something that is itself made during play -
    // the label is inside the inflated boat, and the boat is nowhere until it
    // has been pumped up - so the answer may belong to a link rather than the
    // thing that started the walk.
    if (!at.location || BAGS.includes(at.location)) {
      return HOMES[at.id] ?? HOMES[thing.id] ?? null;
    }

    at = thingsById.get(at.location);
  }

  return HOMES[thing.id] ?? null;
};

/** Everything a player might call a thing: its own words, and each of them behind each adjective. */
const namesFor = (thing: Thing): Array<string> => {
  const words = thing.synonyms.map((one) => one.toLowerCase());
  const adjectives = thing.adjectives.map((one) => one.toLowerCase());

  const phrases = adjectives.flatMap((adjective) => words.map((word) => `${adjective} ${word}`));

  const all = [...words, ...phrases].filter((one) => one !== thing.name.toLowerCase());

  return [...new Set(all)];
};

/**
 * The line ZIL builds for a thing that gives none of its own.
 *
 * `"There is a " D .OBJ " here."`, written into the game rather than assembled
 * as it is read. Stage refuses to assemble one, on the grounds that a room reads
 * as written or it reads as put together, and one line per thing is what lets a
 * sack say it smells of hot peppers. Written here, it is a sentence an author can
 * see and improve, which is the whole difference.
 *
 * The article is the one liberty taken. ZIL says "a" whatever follows it.
 *
 * @param {String} name What the game calls the thing.
 *
 * @returns {String} The sentence.
 */
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

    // What it costs to carry. ZIL's `<PROPDEF SIZE 5>` means an object saying
    // nothing weighs five, which is why this is written for every takeable
    // thing rather than only for the forty-two that declare one: Stage's own
    // default is one, and a game where most things weigh five and the format
    // assumes one is a game that has to say so.
    out.size = thing.size ?? ZIL_SIZE;
  }

  // What the room says about it lying there. ZIL decides this in
  // DESCRIBE-OBJECT: the first line while nobody has touched the thing, the
  // later line once somebody has, and a plain sentence built from the name
  // where the object gives neither.
  //
  // NDESCBIT is the thing a room never lists, because the room's own prose has
  // already mentioned it. Taking one clears the bit, though, so a takeable one
  // still needs the later line and never gets to show a first line at all.
  const never = thing.flags.includes('NDESCBIT');
  const listed = !never || thing.flags.includes('TAKEBIT');

  if (listed && !never && thing.first) {
    out.first = prose(thing.first);
  }

  if (listed) {
    out.here = thing.resting ? prose(thing.resting) : plainly(thing.name);
  }

  // Where it starts. A thing lying in a room says so; a thing inside another
  // thing waits offstage until the port has containers to put it in, and is
  // listed by the room its container stands in so that it belongs somewhere.
  if (thing.location && roomsById.has(thing.location)) {
    out.start = id(thing.location);
  }

  if (!thing.location || !roomsById.has(thing.location)) {
    out.start = 'offstage';
  }

  // What is written on it. Reading is looking as far as Stage is concerned, so
  // this is the thing's description and needs no verb of its own.
  if (thing.reading) {
    out.actions = [{
      id: 'look',
      triggers: [{ type: 'response', data: { text: prose(thing.reading) } }],
    }];
  }

  if (thing.flags.includes('INVISIBLE')) {
    note(
      'Things that are not there until something reveals them',
      `- \`${id(thing.id)}\` starts unseen, and needs a \`requires\` saying when it is not.`,
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

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

const DARK = 'It is pitch black. You are likely to be eaten by a grue.';

/** What Zork calls you as the score climbs, read out of `V-SCORE`. */
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

/**
 * A room's description.
 *
 * One, now. This used to be one description per combination of things still
 * where the game put them - every subset, most particular first, each gated on
 * an `object-in` for everything in it - because Stage printed nothing after a
 * room's own words and a thing's line had to be written into the room that held
 * it, and taken out again when it was carried off. The living room came to
 * thirty-two descriptions of itself.
 *
 * Stage 0.8.0 gave a thing `here` and `first`, so its line goes on the thing and
 * moves with it. The room says what it always said and nothing more.
 */
const describing = (room: Room): Array<Value> => {
  const written = room.description ?? lookingProse(routines, room.action);

  const parts = lookingParts(routines, room.action);

  if (!written) {
    note(
      'Rooms that describe themselves differently as the world changes',
      `- **${room.name}** says nothing the seed could find, in \`${room.action}\`.`,
    );
  }

  // The seed took the first thing the routine says, which is the part that
  // never changes. Anything after it is a fragment the room adds as the world
  // moves, and the sentence it was part of is left unfinished until somebody
  // writes the rest as `look` actions of their own.
  if (written && parts > 1 && !room.description) {
    note(
      'Rooms that describe themselves differently as the world changes',
      `- **${room.name}** has ${parts} things it may say, in \`${room.action}\`; the seed took the first.`,
    );
  }

  const base = prose(written ?? `TODO: ${room.name}`);

  const action: Record<string, Value> = { id: 'look' };

  if (!room.lit) {
    action.requires = [{ type: 'flag', data: { flag: 'light' } }];
  }

  action.triggers = [{ type: 'response', data: { text: base } }];

  const actions: Array<Value> = [action as Value];

  if (!room.lit) {
    actions.push({ id: 'look', triggers: [{ type: 'response', data: { text: DARK } }] });
  }

  return actions;
};

/** A way out, as an exit. */
const wayOut = (room: Room, exit: Exit): Value => {
  const out: Record<string, Value> = { id: exit.direction };

  // A wall with something to say is an exit that speaks and does not move you.
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

    out.requires = [condition];
  }

  out.triggers = [{ type: 'change-scene', data: { scene: id(exit.to) } }];

  return out;
};

/**
 * Scenery a room shares with others.
 *
 * ZIL keeps one white house and lets twelve rooms point at it. A thing in Stage
 * is in one place, so each room gets a copy of its own, written where it stands
 * because that is the only room it will ever be in.
 */
const sceneryFor = (room: Room): Array<Value> =>
  room.scenery.flatMap((name) => {
    const thing = thingsById.get(name);

    if (!thing) {
      return [];
    }

    // Scenery has no file, so its routine would otherwise go unreported - and
    // the kitchen window, which is the way into the house, is one of these.
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

// ---------------------------------------------------------------------------
// Writing it all out
// ---------------------------------------------------------------------------

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

// Which things are written as files of their own.
//
// Everything except what lives in one of ZIL's scenery bags, which has no room
// of its own and is copied into each room that names it. A thing that is both -
// the trap door lies in the living room and is named again by the cellar below
// it - keeps its file and is copied as well, because Stage cannot have one
// thing standing in two rooms.
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

  // Filed under the region of the room it belongs to rather than the one ZIL
  // defined it in, which is the same block for all of them. A thing sits beside
  // the rooms it is part of.
  await put(
    `objects/${folder(roomsById.get(home ?? '')?.region ?? thing.region)}/${id(thing.id)}.object.yaml`,
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
  // Everything the room is answerable for: what is lying in it, and what is
  // inside something lying in it, which begins offstage but belongs here.
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
    `scenes/${folder(room.region)}/${id(room.id)}.scene.yaml`,
    writeYaml(scene, ['meta', 'actions', 'objects', 'navigation']),
  );
}

// Light. Stage has no notion of it, and `requires` can only say "and", so the
// question "is anything lighting the way" is answered once a turn into a flag:
// cleared first, then set by whatever is burning. Every rule is tested against
// the world as the turn ended and only then fires, so the order is safe.
const lights = things.filter((thing) => thing.flags.includes('LIGHTBIT'));

await put(
  'every-turn.yaml',
  writeYaml({
    'every-turn': [
      { triggers: [{ type: 'set-flag', data: { flag: 'light', value: false } }] },
      ...lights.map((thing) => ({
        requires: [
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

// The words, which all three games share.
await put(
  'vocabulary.yaml',
  writeYaml(vocabulary(), ['verbs', 'directions', 'articles', 'prepositions', 'conjunctions']),
);

// The game itself. Zork keeps one number and calls it the score; the ranks it
// reads out at the end are the thresholds it passes on the way up, which is the
// nearest Stage has to a `score` command while a bare verb reaches nothing.
await put(
  'config.yaml',
  writeYaml(
    {
      id: 'abandoned-empire-1',
      start: id(rooms[0].id),

      metadata: {
        title: 'Abandoned Empire',
        version: '0.1.0',
        description: 'The Great Underground Empire, ported to Stage from Infocom\u2019s own ZIL source. ' +
          'A white house, a trap door, and three hundred and fifty points of treasure ' +
          'between you and the rank of Master Adventurer.',
        genres: ['Adventure', 'Fantasy', 'Puzzle'],
      },

      player: {
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
      },
    } as Record<string, Value>,
    ['metadata', 'player'],
  ),
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
