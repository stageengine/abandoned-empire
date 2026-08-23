/**
 * Say what each thing weighs.
 *
 * Stage 0.8.0 gave the player a carrying limit and a thing a `size`, so the port
 * can say what ZIL always said: a coffin is fifty-five and a matchbook is two,
 * and the difference is most of what makes Zork's inventory a puzzle.
 *
 * `generate.ts` seeds a game that way now. This does the same to a game already
 * seeded and worked on since, for the reason `lying.ts` gave: the port is
 * hand-authored well past its seed and re-seeding would throw that work away.
 *
 * Only takeable things get one. ZIL gives every object a `SIZE`, defaulting to
 * five, but a limit only ever weighs what the player is holding, so a size on a
 * wall is a number nothing reads. A thing that already says one is left alone.
 */

import dungeon from './dungeon.ts';

const [sourceDir = '../source/zork1', gameDir = '../zork1'] = Deno.args;

const { things } = dungeon(await Deno.readTextFile(`${sourceDir}/1dungeon.zil`));

const thingsById = new Map(things.map((thing) => [thing.id.toLowerCase(), thing]));

/** What an object weighs in ZIL when it does not say: `<PROPDEF SIZE 5>`. */
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

  // Beside `portable`, which is the other half of the same fact: whether the
  // player may pick it up, and what it costs them to.
  const at = lines.findIndex((line) => line.startsWith('portable:'));

  if (at < 0) {
    continue;
  }

  lines.splice(at + 1, 0, `size: ${thing.size ?? ZIL_SIZE}`);

  await Deno.writeTextFile(path, lines.join('\n'));

  given += 1;
}

console.log(`Said what ${given} things weigh.`);
