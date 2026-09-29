import dungeon from './dungeon.ts';

const [sourceDir = '../source/zork1', gameDir = '../abandoned-empire-1'] = Deno.args;

const { things } = dungeon(await Deno.readTextFile(`${sourceDir}/1dungeon.zil`));

const thingsById = new Map(things.map((thing) => [thing.id.toLowerCase(), thing]));

const plainly = (name: string): string =>
  `There is ${'aeiou'.includes(name[0]?.toLowerCase()) ? 'an' : 'a'} ${name} here.`;

const prose = (text: string): string =>
  text.split('|').map((part) => part.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');

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

let given = 0;

for await (const path of walk(`${gameDir}/objects`)) {
  const body = await Deno.readTextFile(path);
  const lines = body.split('\n');

  const id = lines.find((line) => line.startsWith('id: '))?.slice(4).trim();
  const thing = id ? thingsById.get(id) : undefined;

  if (!thing) {
    continue;
  }

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

  const at = lines.findIndex((line) => line.startsWith('start:'));

  const opening = lines.findIndex((line, index) => index > 0 && line.trim() === '');

  const cut = at >= 0 ? at : opening >= 0 ? opening : lines.length;

  lines.splice(cut, 0, ...added);

  await Deno.writeTextFile(path, lines.join('\n'));

  given += 1;
}

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
