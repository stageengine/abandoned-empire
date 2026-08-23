/**
 * What the reader made of a dungeon file. Run it after changing anything in
 * `read-zil.ts` or `dungeon.ts`, because the whole port rests on this being
 * right and a misread property is quiet until a room is missing a wall.
 */

import dungeon from './dungeon.ts';

const source = await Deno.readTextFile(Deno.args[0] ?? '../source/zork1/1dungeon.zil');
const { rooms, things } = dungeon(source);

const count = (kept: Array<unknown>) => String(kept.length).padStart(4);

console.log(`${count(rooms)} rooms`);
console.log(`${count(rooms.filter((room) => room.description))}   with prose of their own`);
console.log(`${count(rooms.filter((room) => !room.description))}   describing themselves in a routine`);
console.log(`${count(rooms.filter((room) => room.lit))}   lit`);
console.log(`${count(rooms.filter((room) => room.action))}   with an action routine`);

const exits = rooms.flatMap((room) => room.exits);

console.log();
console.log(`${count(exits)} ways out`);
console.log(`${count(exits.filter((exit) => exit.to && !exit.flag && !exit.open))}   plain`);
console.log(`${count(exits.filter((exit) => exit.flag))}   turning on a flag`);
console.log(`${count(exits.filter((exit) => exit.open))}   turning on a thing being open`);
console.log(`${count(exits.filter((exit) => !exit.to && exit.refusal))}   walls with something to say`);
console.log(`${count(exits.filter((exit) => exit.routine))}   worked out in a routine`);

console.log();
console.log(`${count(things)} things`);
console.log(`${count(things.filter((thing) => thing.flags.includes('TAKEBIT')))}   portable`);
console.log(`${count(things.filter((thing) => thing.caseValue > 0))}   treasure`);
console.log(`${count(things.filter((thing) => thing.flags.includes('CONTBIT')))}   containers`);
console.log(`${count(things.filter((thing) => thing.reading))}   with something written on them`);
console.log(`${count(things.filter((thing) => thing.action))}   with an action routine`);

const rooms_ = new Set(rooms.map((room) => room.id));
const inside = things.filter((thing) => thing.location && !rooms_.has(thing.location));

console.log(`${count(inside)}   starting inside another thing or in a scenery bag`);

console.log();
console.log('regions');
for (const region of [...new Set(rooms.map((room) => room.region))]) {
  const held = rooms.filter((room) => room.region === region);
  console.log(`${count(held)}   ${region}`);
}

// Anything the reader could not make sense of is worth seeing rather than
// counting, because every one of them is a hole in the map.
const missing = exits.filter((exit) => !exit.to && !exit.refusal && !exit.routine);

console.log();
console.log(missing.length === 0 ? 'every way out read' : `${missing.length} ways out unread:`);
for (const exit of missing.slice(0, 10)) {
  console.log(`   ${JSON.stringify(exit)}`);
}

const broken = exits.filter((exit) => exit.to && !rooms_.has(exit.to));

console.log(
  broken.length === 0 ? 'every way out lands somewhere' : `${broken.length} ways out land nowhere:`,
);
for (const exit of broken.slice(0, 10)) {
  console.log(`   ${exit.direction} to ${exit.to}`);
}
