import dungeon from './dungeon.ts';

const [sourceDir = '../source/zork1', gameDir = '../abandoned-empire-1'] = Deno.args;

const { things } = dungeon(await Deno.readTextFile(`${sourceDir}/1dungeon.zil`));

const thingsById = new Map(things.map((thing) => [thing.id.toLowerCase(), thing]));

const ZIL_SIZE = 5;

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
  const lines = (await Deno.readTextFile(path)).split('\n');

  const id = lines.find((line) => line.startsWith('id: '))?.slice(4).trim();
  const thing = id ? thingsById.get(id) : undefined;

  if (!thing || !thing.flags.includes('TAKEBIT')) {
    continue;
  }

  if (lines.some((line) => line.startsWith('size:'))) {
    continue;
  }

  const at = lines.findIndex((line) => line.startsWith('portable:'));

  if (at < 0) {
    continue;
  }

  lines.splice(at + 1, 0, `size: ${thing.size ?? ZIL_SIZE}`);

  await Deno.writeTextFile(path, lines.join('\n'));

  given += 1;
}

console.log(`Said what ${given} things weigh.`);
