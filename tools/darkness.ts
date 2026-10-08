import dungeon from './dungeon.ts';

const [sourceDir = '../source/zork1', gameDir = '../abandoned-empire-1'] = Deno.args;

const { rooms } = dungeon(await Deno.readTextFile(`${sourceDir}/1dungeon.zil`));

const WAS = 'Oh, no! A lurking grue slithered into the room and devoured you!';

const scenes = `${gameDir}/scenes`;

async function* walk(at: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(at)) {
    const path = `${at}/${entry.name}`;

    if (entry.isDirectory) {
      yield* walk(path);
      continue;
    }

    yield path;
  }
}

const findRoom = async (id: string): Promise<string | null> => {
  for await (const found of walk(scenes)) {
    if (found.endsWith(`/${id}.scene.config.yaml`)) {
      return found;
    }
  }

  return null;
};

let marked = 0;
let swept = 0;

for (const room of rooms.filter((one) => !one.lit)) {
  const id = room.id.toLowerCase();
  const file = await findRoom(id);

  if (!file) {
    console.error(`no file for ${id}`);
    continue;
  }

  const source = await Deno.readTextFile(file);

  if (!/^tags:/m.test(source)) {
    const tagged = /^id: /m.test(source)
      ? source.replace(/^id: (.+)$/m, 'id: $1\ntags: [dark]')
      : `tags: [dark]\n\n${source}`;

    await Deno.writeTextFile(file, tagged);
    marked += 1;
  }

  const rules = file.replace(/\.scene\.config\.yaml$/, '.scene.turns.yaml');
  const held = rules ? await Deno.readTextFile(rules).catch(() => null) : null;

  if (
    held !== null && held.includes(WAS) && !held.includes('# The ceremony') &&
    held.split('- conditions:').length === 3
  ) {
    await Deno.remove(rules as string);
    swept += 1;
  }
}

console.log(`${marked} rooms told they are dark, ${swept} grue files removed`);
