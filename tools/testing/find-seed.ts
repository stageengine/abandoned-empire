#!/usr/bin/env -S deno run --allow-read
import { died, loadGame, seek, transcript } from './harness.ts';

import type { Played } from './harness.ts';

const scoreOf = (played: Played): number | null => {
  const match = transcript(played)
    .map((line) => line.match(/Your score is (\d+)/))
    .findLast((m) => m);

  return match ? Number(match[1]) : null;
};

const WALKTHROUGH = new URL('../zork1-350-walkthrough.txt', import.meta.url).pathname;

interface Checkpoint {
  name: string;
  through: number;
  ok?: (played: Played) => boolean;
}

const CHECKPOINTS: ReadonlyArray<Checkpoint> = [
  { name: 'postTroll', through: 35 },
  { name: 'postThief', through: 124 },
  { name: 'torchSecured', through: 157 },
  { name: 'diamondSecured', through: 327, ok: (played) => played.state.objects.locations['diamond'] === 'inventory' },
  { name: 'fullGame', through: 10_000, ok: (played) => scoreOf(played) === 350 },
];

const lines = (await Deno.readTextFile(WALKTHROUGH)).split('\n');

const commandsThrough = (line: number): Array<string> =>
  lines
    .slice(0, line)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('@checkpoint'));

const source = await loadGame();

const results: Array<{ name: string; seed: string; commands: Array<string> }> = [];

for (const { name, through, ok } of CHECKPOINTS) {
  const commands = commandsThrough(through);
  const check = (played: Played) => !died(played) && (ok?.(played) ?? true);
  const { seed } = seek(source, commands, check);

  console.log(`${name}: ${commands.length} commands, seed ${seed}`);
  results.push({ name, seed, commands });
}

const quoted = (s: string) => JSON.stringify(s);

const body = results
  .map(
    ({ name, seed, commands }) => `export const ${name}: Scenario = {
  seed: ${quoted(seed)},
  commands: [
${commands.map((c) => `    ${quoted(c)},`).join('\n')}
  ],
};
`,
  )
  .join('\n');

const header = `export interface Scenario {
  seed: string;
  commands: Array<string>;
}

`;

await Deno.writeTextFile(new URL('./scenarios.ts', import.meta.url), header + body);
console.log('\nwrote scenarios.ts');
