/**
 * Say which rooms are dark, so one rule can speak for all of them.
 *
 * This used to write the grue into every dark room's own `every-turn.yaml`,
 * because nothing could ask whether the player was standing in a dark room and
 * a rule about a class of room had no class to attach to. Seventy-seven rooms
 * held one byte-identical file.
 *
 * Stage 0.8.0 gave a room `tags` and a `scene` condition to read them, so all
 * of that is one rule in the game's own `every-turn.yaml` and this only has to
 * mark the rooms. It removes the files it used to write, so running it over a
 * game seeded by the older version tidies up after that version.
 *
 * A room that has rules of its own keeps them: only a file this tool would have
 * written, byte for byte, is taken away.
 */

import dungeon from './dungeon.ts';

const [sourceDir = '../source/zork1', gameDir = '../abandoned-empire-1'] = Deno.args;

const { rooms } = dungeon(await Deno.readTextFile(`${sourceDir}/1dungeon.zil`));

/** What this tool used to write into every dark room, kept so it can be recognised. */
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

/** Where a room's own file sits, whichever of the two shapes it is written in. */
const findRoom = async (id: string): Promise<string | null> => {
  for await (const found of walk(scenes)) {
    if (found.endsWith(`/${id}.scene.yaml`) || found.endsWith(`/${id}/config.yaml`)) {
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
    await Deno.writeTextFile(file, source.replace(/^id: (.+)$/m, 'id: $1\ntags: [dark]'));
    marked += 1;
  }

  // The file this tool wrote before there was anything to write instead. Read
  // rather than assumed: a room that has since been given rules of its own
  // keeps them, and only the grue goes.
  const rules = file.endsWith('config.yaml') ? file.replace(/config\.yaml$/, 'every-turn.yaml') : null;
  const held = rules ? await Deno.readTextFile(rules).catch(() => null) : null;

  if (
    held !== null && held.includes(WAS) && !held.includes('# The ceremony') &&
    held.split('- requires:').length === 3
  ) {
    await Deno.remove(rules as string);
    swept += 1;
  }
}

console.log(`${marked} rooms told they are dark, ${swept} grue files removed`);
