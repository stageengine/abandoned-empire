/**
 * Put each thing's own line on the thing, and take it out of the rooms.
 *
 * Stage printed nothing after a room's own words, so the port wrote a thing's
 * line into the room holding it, and wrote it again for every combination of
 * what was still lying there: one `look` per subset, each gated on an
 * `object-in` for everything in it. The living room came to thirty-two
 * descriptions of itself.
 *
 * Stage 0.8.0 gave a thing `here` and `first`, so the line goes on the thing and
 * travels with it. `generate.ts` seeds a game that way now. This does the same to
 * a game already seeded and worked on since, because the port is hand-authored
 * well past its seed and re-seeding it would throw that work away.
 *
 * Careful in both directions. A thing that already says either line is left
 * alone, and the only `look` actions taken out of a room are the ones this port
 * would have written: gated on `object-in` naming that very room. A gate naming
 * a container is a different sentence and stays - the South Temple says "on the
 * altar is a large black book" only while the book is in the altar, and a thing
 * inside a container says no line of its own.
 */

import dungeon from './dungeon.ts';

const [sourceDir = '../source/zork1', gameDir = '../abandoned-empire-1'] = Deno.args;

const { things } = dungeon(await Deno.readTextFile(`${sourceDir}/1dungeon.zil`));

const thingsById = new Map(things.map((thing) => [thing.id.toLowerCase(), thing]));

/**
 * The line ZIL builds for a thing that gives none of its own.
 *
 * Kept in step with `generate.ts`, which writes the same sentence when it seeds.
 *
 * @param {String} name What the game calls the thing.
 *
 * @returns {String} The sentence.
 */
const plainly = (name: string): string =>
  `There is ${'aeiou'.includes(name[0]?.toLowerCase()) ? 'an' : 'a'} ${name} here.`;

/**
 * ZIL's `|` is a line break the player sees; every other newline is only where
 * the author's line ran out.
 *
 * @param {String} text
 *
 * @returns {String} One paragraph, or several where ZIL asked for them.
 */
const prose = (text: string): string =>
  text.split('|').map((part) => part.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');

/** Write a value as YAML would, folding a long line the way the port does. */
const scalar = (key: string, text: string): Array<string> => {
  if (!text.includes('\n') && `${key}: ${text}`.length <= 96 && !/^[>|&*#?%@`'"[\]{},]/.test(text)) {
    return [`${key}: ${text}`];
  }

  const words = text.split(' ');
  const lines: Array<string> = [];

  let line = '';

  for (const word of words) {
    if (line && `${line} ${word}`.length > 94) {
      lines.push(`  ${line}`);
      line = word;
    }

    line = line ? `${line} ${word}` : word;
  }

  if (line) {
    lines.push(`  ${line}`);
  }

  return [`${key}: >-`, ...lines];
};

async function* walk(at: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(at)) {
    const path = `${at}/${entry.name}`;

    if (entry.isDirectory) {
      yield* walk(path);
      continue;
    }

    if (entry.name.endsWith('.yaml')) {
      yield path;
    }
  }
}

// ---------------------------------------------------------------------------
// The things
// ---------------------------------------------------------------------------

let given = 0;

for await (const path of walk(`${gameDir}/objects`)) {
  const body = await Deno.readTextFile(path);
  const lines = body.split('\n');

  const id = lines.find((line) => line.startsWith('id: '))?.slice(4).trim();
  const thing = id ? thingsById.get(id) : undefined;

  if (!thing) {
    continue;
  }

  // Anything already saying either line was written by hand, and this is not the
  // tool to argue with it.
  if (lines.some((line) => line.startsWith('here:') || line.startsWith('first:'))) {
    continue;
  }

  const never = thing.flags.includes('NDESCBIT');

  if (never && !thing.flags.includes('TAKEBIT')) {
    continue;
  }

  const added = [
    ...(!never && thing.first ? scalar('first', prose(thing.first)) : []),
    ...scalar('here', thing.resting ? prose(thing.resting) : plainly(thing.name)),
  ];

  // Where `generate.ts` puts them: after what the thing is, before where it
  // begins. A file with no `start` has them at the end of its opening block.
  const at = lines.findIndex((line) => line.startsWith('start:'));

  const opening = lines.findIndex((line, index) => index > 0 && line.trim() === '');

  const cut = at >= 0 ? at : opening >= 0 ? opening : lines.length;

  lines.splice(cut, 0, ...added);

  await Deno.writeTextFile(path, lines.join('\n'));

  given += 1;
}

// ---------------------------------------------------------------------------
// The rooms
// ---------------------------------------------------------------------------

/**
 * Whether a `look` action is one the old port wrote to list what was lying about.
 *
 * The signature is an `object-in` naming this room. A gate on anything else is an
 * author saying something about the room itself and is left where it is.
 *
 * @param {String} block The action, as authored.
 * @param {String} room The scene's id.
 *
 * @returns {Boolean} True where the port wrote it and the things now say it.
 */
const listing = (block: string, room: string): boolean =>
  block.includes('type: object-in') &&
  new RegExp(`^\\s+location: ${room}$`, 'm').test(block);

let emptied = 0;
let dropped = 0;

for await (const path of walk(`${gameDir}/scenes`)) {
  const body = await Deno.readTextFile(path);

  if (!body.includes('type: object-in')) {
    continue;
  }

  const room = body.split('\n').find((line) => line.startsWith('id: '))?.slice(4).trim();

  if (!room) {
    continue;
  }

  const lines = body.split('\n');

  const from = lines.findIndex((line) => line === 'actions:');

  if (from < 0) {
    continue;
  }

  let to = lines.length;

  for (let index = from + 1; index < lines.length; index += 1) {
    if (lines[index] && !lines[index].startsWith(' ')) {
      to = index;
      break;
    }
  }

  // Split the list into its items, each running to the next `- id:` at the top
  // level of the list.
  const items: Array<Array<string>> = [];

  for (const line of lines.slice(from + 1, to)) {
    if (line.startsWith('  - id: ')) {
      items.push([]);
    }

    if (items.length) {
      items[items.length - 1].push(line);
    }
  }

  const kept = items.filter((item) => {
    const block = item.join('\n');

    if (!block.startsWith('  - id: look')) {
      return true;
    }

    const listed = listing(block, room);

    dropped += listed ? 1 : 0;

    return !listed;
  });

  if (kept.length === items.length) {
    continue;
  }

  // Each item keeps its own trailing blank line, so rejoining needs no separator
  // beyond trimming the tail the last one carries.
  const rebuilt = kept.flat();

  while (rebuilt.length && rebuilt[rebuilt.length - 1].trim() === '') {
    rebuilt.pop();
  }

  await Deno.writeTextFile(
    path,
    [...lines.slice(0, from + 1), ...rebuilt, '', ...lines.slice(to)].join('\n'),
  );

  emptied += 1;
}

console.log(`Gave ${given} things a line of their own.`);
console.log(`Took ${dropped} listing descriptions out of ${emptied} rooms.`);
