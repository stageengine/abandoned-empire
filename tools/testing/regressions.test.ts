import { assert, assertEquals, assertFalse } from '@std/assert';

import { died, loadGame, pinned, play, seek, transcript } from './harness.ts';
import { diamondSecured, fullGame, postThief, postTroll, torchSecured } from './scenarios.ts';

import type Game from '../../../engine/engine/interfaces/game.ts';

let source: Game;

Deno.test({
  name: 'setup',
  fn: async () => {
    source = await loadGame();
  },
});

Deno.test('scenarios: each plays through cleanly under its own frozen seed', () => {
  for (const scenario of [postTroll, postThief, torchSecured, diamondSecured]) {
    const played = play(source, pinned(source.id, scenario.seed), scenario.commands);

    assertFalse(died(played), transcript(played).join(' | '));
  }
});

Deno.test('allowance: recovers on its own after a wound, rather than staying down forever', () => {
  const wounded = structuredClone(pinned(source.id, '2020-01-01T00:00:00.000Z'));

  wounded.measures.player = { ...wounded.measures.player, allowance: 60 };

  const rested = play(source, wounded, Array(50).fill('look')).state;

  assert(
    rested.measures.player.allowance > 60,
    `expected allowance to climb from 60 after 50 quiet turns, still ${rested.measures.player.allowance}`,
  );
});

Deno.test('trap door: bars itself only the first time it is left open behind you', () => {
  const start = pinned(source.id, '2020-01-01T00:00:00.000Z');
  const toCellar = [
    'south', 'east', 'open window', 'enter window', 'west',
    'take lamp', 'turn on lamp', 'move rug', 'open trap door', 'down',
  ];

  const first = play(source, start, toCellar);

  assert(
    transcript(first).some((line) => line.includes('crashes shut')),
    'expected the first descent to bar the door behind the player',
  );
  assertEquals(first.state.flags['trap-door-open'], false);
  assertEquals(first.state.flags['trap-door-barred'], true);

  const reopened = structuredClone(first.state);

  reopened.scene = 'living-room';
  reopened.flags['trap-door-open'] = true;

  const second = play(source, reopened, ['down']);

  assertFalse(
    transcript(second).some((line) => line.includes('crashes shut')),
    'the second descent should not re-bar a door the player already reopened',
  );
  assertEquals(second.state.scene, 'cellar');
  assertEquals(second.state.flags['trap-door-open'], true);
});

Deno.test('wait: runs the clock three times, matching V-WAIT rather than one plain turn', () => {
  const start = pinned(source.id, '2020-01-01T00:00:00.000Z');
  const setup = ['south', 'east', 'open window', 'enter window', 'west', 'take lamp', 'turn on lamp'];

  const before = play(source, start, setup).state;
  const after = play(source, before, ['wait']).state;

  assertEquals(after.measures.player.moves - before.measures.player.moves, 3);
  assertEquals(before.measures.lamp.life - after.measures.lamp.life, 3);
});

Deno.test('lamp: the budget is 392 turns of light, not the 185 a misread of the ZIL comment gives', () => {
  const start = pinned(source.id, '2020-01-01T00:00:00.000Z');
  const setup = ['south', 'east', 'open window', 'enter window', 'west', 'take lamp', 'turn on lamp'];

  const afterSetup = play(source, start, setup).state;

  assertEquals(afterSetup.measures.lamp.life, 391, 'one tick already spent turning it on this same turn');

  const stillLit = play(source, afterSetup, Array(390).fill('look')).state;

  assertEquals(stillLit.measures.lamp.life, 1);
  assertEquals(stillLit.flags['lamp-burned-out'], undefined);

  const burnedOut = play(source, stillLit, ['look']).state;

  assertEquals(burnedOut.measures.lamp.life, 0);
  assertEquals(burnedOut.flags['lamp-burned-out'], true);
});

Deno.test('torch: lights a room it is merely sitting in, not only one the player is holding it through', () => {
  const start = structuredClone(pinned(source.id, '2020-01-01T00:00:00.000Z'));

  start.scene = 'lower-shaft';
  start.objects.locations['torch'] = 'lower-shaft';

  const { turns } = play(source, start, ['look', 'look']);

  assertFalse(
    turns[1].messages.some((line) => /pitch black/i.test(line)),
    `a room holding an unheld torch should not be dark: ${turns[1].messages.join(' | ')}`,
  );
});

Deno.test('machine: coal becomes the diamond once the switch is thrown on a closed lid', () => {
  const played = play(source, pinned(source.id, diamondSecured.seed), diamondSecured.commands);

  assertEquals(played.state.objects.locations['diamond'], 'inventory');
  assertEquals(played.state.objects.locations['coal'], 'bin');
  assert(
    transcript(played).some((line) => line.includes('dazzling display')),
    'expected the machine to have visibly run',
  );
});

Deno.test('thief: ambushes his own treasure room and stays for the turn he arrives', () => {
  const played = play(source, pinned(source.id, postThief.seed), postThief.commands);

  assert(
    transcript(played).some((line) => line.includes('scream of anguish')),
    'expected the ambush to have fired on first entry',
  );
});

Deno.test('give: "give egg to thief" answers exactly as "give thief the egg" does', () => {
  const upToCyclops = postThief.commands.slice(0, postThief.commands.indexOf('give egg to thief'));

  const prepositional = play(source, pinned(source.id, postThief.seed), [...upToCyclops, 'give egg to thief']);
  const recipientFirst = play(source, pinned(source.id, postThief.seed), [...upToCyclops, 'give thief the egg']);

  const last = (played: typeof prepositional) => played.turns.at(-1)!.messages;

  assertEquals(last(prepositional), last(recipientFirst));
  assert(
    last(prepositional).some((line) => line.includes('stops to admire its beauty')),
    `expected the treasure to be accepted, got: ${last(prepositional).join(' | ')}`,
  );
  assertEquals(
    prepositional.state.objects.locations['egg'],
    'held:thief',
    'expected the egg to actually move to the thief, matching ROBBER-FUNCTION\'s <MOVE ,PRSO ,THIEF>',
  );
});

Deno.test('give: every other treasure is accepted by name too, not just the egg', () => {
  const toTreasureRoom = postThief.commands.slice(0, postThief.commands.indexOf('kill thief with knife'));

  for (const treasure of ['bar', 'jade']) {
    const state = pinned(source.id, postThief.seed);
    const prefix = play(source, state, toTreasureRoom);
    prefix.state.objects.locations[treasure] = 'inventory';

    const played = play(source, prefix.state, [`give ${treasure} to thief`]);

    assert(
      played.turns[0].messages.some((line) => line.includes('stops to admire its beauty')),
      `expected ${treasure} to be accepted, got: ${played.turns[0].messages.join(' | ')}`,
    );
    assertEquals(
      played.state.objects.locations[treasure],
      'held:thief',
      `expected ${treasure} to actually move to the thief, matching ROBBER-FUNCTION's <MOVE ,PRSO ,THIEF>`,
    );
  }
});

Deno.test('chalice: banks in the trophy case instead of refusing every "put chalice in" sentence', () => {
  const toTreasureRoom = postThief.commands.slice(0, postThief.commands.indexOf('kill thief with knife'));
  const played = play(source, pinned(source.id, postThief.seed), [
    ...toTreasureRoom,
    'take chalice',
    'down',
    'east',
    'east',
    'put chalice in case',
  ]);

  assertEquals(played.state.objects.locations['chalice'], 'offstage');
});

Deno.test('canary: banks before the egg it travels inside, rather than being sealed in with it', () => {
  const { seed } = seek(source, postThief.commands, (played) => played.state.objects.locations['thief'] === 'bin');

  const played = play(source, pinned(source.id, seed), [
    ...postThief.commands,
    'take chalice',
    'take egg',
    'take canary',
    'down',
    'east',
    'east',
    'east',
    'east',
    'north',
    'north',
    'wind canary',
    'take bauble',
    'south',
    'east',
    'west',
    'west',
    'put chalice in case',
    'put canary in case',
    'put egg in case',
  ]);

  assertEquals(played.state.objects.locations['canary'], 'offstage');
  assertEquals(played.state.objects.locations['egg'], 'offstage');
});

Deno.test('fullGame: a clean playthrough reaches all 350 points', () => {
  const played = play(source, pinned(source.id, fullGame.seed), fullGame.commands);

  assertFalse(died(played));
  assert(
    transcript(played).some((line) => line.includes('Your score is 350')),
    'expected a full run of the walkthrough to bank every point, lower-shaft bonus included',
  );
});

Deno.test('barrow: winning shows the score/rank line and actually ends the game', () => {
  const played = play(source, pinned(source.id, fullGame.seed), fullGame.commands);

  assert(played.state.finished, 'expected walking into the barrow to end the game');
  assertEquals(played.state.scene, 'stone-barrow', 'expected the winning move to actually be the walk into the barrow');

  const lines = transcript(played);
  assert(
    lines.some((line) => line.includes('mastered the first part of the ZORK trilogy')),
    'expected the sign text on the bridge',
  );
  assert(
    lines.some((line) => line.includes('Your score is 350 (total of 350 points)') && line.includes('Master Adventurer')),
    'expected the win to open on the same score/rank line the score command gives at 350',
  );
});

Deno.test('bat: flies the player to a random mine room, unless garlic is carried or lying here', () => {
  const withoutGarlic = pinned(source.id, '2020-01-01T00:00:00.000Z');
  withoutGarlic.scene = 'bat-room';
  withoutGarlic.flags['light'] = true;

  const flown = play(source, withoutGarlic, ['look']);

  assertEquals(flown.state.scene !== 'bat-room', true, 'expected the bat to relocate a garlic-less player');

  const withGarlicHeld = pinned(source.id, '2020-01-01T00:00:00.000Z');
  withGarlicHeld.scene = 'bat-room';
  withGarlicHeld.flags['light'] = true;
  withGarlicHeld.objects.locations['garlic'] = 'inventory';

  assertEquals(play(source, withGarlicHeld, ['look']).state.scene, 'bat-room');

  const withGarlicHere = pinned(source.id, '2020-01-01T00:00:00.000Z');
  withGarlicHere.scene = 'bat-room';
  withGarlicHere.flags['light'] = true;
  withGarlicHere.objects.locations['garlic'] = 'bat-room';

  assertEquals(play(source, withGarlicHere, ['look']).state.scene, 'bat-room');
});

const seekFrom = (
  commands: ReadonlyArray<string>,
  prime: (state: ReturnType<typeof pinned>) => void,
  check: (played: ReturnType<typeof play>) => boolean,
  tries = 500,
) => {
  for (let i = 0; i < tries; i++) {
    const seed = new Date(Date.parse('2020-01-01T00:00:00.000Z') + i * 1000).toISOString();
    const state = pinned(source.id, seed);
    prime(state);

    const played = play(source, state, commands);

    if (check(played)) {
      return played;
    }
  }

  throw new Error(`no seed in [0, ${tries}) satisfied the check for ${JSON.stringify(commands)}`);
};

Deno.test('combat: other weapons fight the troll and thief instead of a wrong generic refusal', () => {
  const toTroll = [
    'south', 'east', 'open window', 'enter window', 'west', 'take lamp', 'turn on lamp',
    'move rug', 'open trap door', 'down', 'north',
  ];
  const trollPlayed = seekFrom(
    [...toTroll, ...Array(6).fill('kill troll with knife')],
    (state) => {
      state.objects.locations['knife'] = 'inventory';
    },
    (played) => played.state.objects.locations['troll'] === 'bin',
  );

  assert(
    trollPlayed.turns
      .slice(toTroll.length)
      .flatMap((turn) => turn.messages)
      .some((line) => line.includes('struck on the arm') || line.includes('fatal blow')),
    'expected a real fight, not a generic refusal, from kill troll with knife',
  );

  const toThief = postThief.commands.slice(0, postThief.commands.indexOf('kill thief with knife'));
  const thiefFight = seek(
    source,
    [...toThief.filter((c) => c !== 'drop sword'), ...Array(9).fill('kill thief with sword')],
    (played) => played.state.objects.locations['thief'] === 'bin',
  );

  assert(
    thiefFight.played.turns
      .slice(toThief.length)
      .flatMap((turn) => turn.messages)
      .some((line) => line.includes("thief's arm") || line.includes('crumples to the floor')),
    'expected a real fight, not a generic refusal, from kill thief with sword',
  );
});

Deno.test('cyclops: provoking him and staying escalates to a real death, not a free pass', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'cyclops-room';
  state.objects.locations['torch'] = 'inventory';

  const played = play(source, state, ['attack cyclops', ...Array(6).fill('look')]);
  const passing = played.turns.flatMap((turn) => turn.passing ?? []);

  for (const snippet of [
    'somewhat agitated',
    'getting more agitated',
    'looking for something',
    'salt and pepper',
    'unfriendly manner',
    'two choices',
  ]) {
    assert(
      passing.some((line) => line.includes(snippet)),
      `expected one of CYCLOMAD's six warnings ("${snippet}") among the escalation`,
    );
  }
  assert(
    passing.some((line) => line.includes('grabs you firmly')),
    'expected the seventh turn provoked and un-appeased to kill the player',
  );
});

Deno.test('cyclops: leaving the room pauses the timer instead of continuing it unseen', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'cyclops-room';
  state.objects.locations['torch'] = 'inventory';

  const played = play(source, state, ['attack cyclops', 'look', 'look', 'northwest', ...Array(6).fill('look')]);

  assertEquals(played.state.measures?.cyclops?.wrath, 3, 'expected the count to stop the moment he left, not keep climbing');
  assertEquals(played.state.flags['player-died'], undefined);
});

Deno.test('cyclops: lunch and water in time puts him to sleep rather than killing the player', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'cyclops-room';
  state.objects.locations['torch'] = 'inventory';
  state.objects.locations['lunch'] = 'inventory';
  state.objects.locations['bottle'] = 'inventory';
  state.objects.locations['water'] = 'in:bottle';

  const played = play(source, state, [
    'give lunch to cyclops',
    'give bottle to cyclops',
    ...Array(8).fill('look'),
  ]);

  assertEquals(played.state.flags['cyclops-asleep'], true);
  assertEquals(played.state.flags['player-died'], undefined);
});

Deno.test('mirror: breaking it stops the teleport and answers examine differently', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'mirror-room-1';
  state.objects.locations['torch'] = 'inventory';

  const played = play(source, state, ['break mirror', 'break mirror', 'examine mirror', 'touch mirror']);

  assertEquals(
    played.turns[0].messages[0],
    "You have broken the mirror. I hope you have a seven years' supply of good luck handy.",
  );
  assertEquals(played.turns[1].messages[0], "Haven't you done enough damage already?");
  assertEquals(played.turns[2].messages[0], 'The mirror is broken into many pieces.');
  assertEquals(played.state.scene, 'mirror-room-1', 'expected a broken mirror to no longer teleport');
});

Deno.test('mirror: rubbing it with a tool tingles rather than teleporting', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'mirror-room-1';
  state.objects.locations['torch'] = 'inventory';
  state.objects.locations['knife'] = 'inventory';

  const played = play(source, state, ['rub mirror with knife']);

  assertEquals(played.turns[0].messages, ['You feel a faint tingling transmitted through it.']);
  assertEquals(played.state.scene, 'mirror-room-1');
});

Deno.test('mirror: touching it bare-handed still swaps rooms', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'mirror-room-1';
  state.objects.locations['torch'] = 'inventory';

  const played = play(source, state, ['touch mirror']);

  assertEquals(played.state.scene, 'mirror-room-2');
});

Deno.test('rainbow: the pot of gold is invisible until the sceptre actually solidifies it', () => {
  const withoutWaving = pinned(source.id, '2020-01-01T00:00:00.000Z');
  withoutWaving.scene = 'end-of-rainbow';
  withoutWaving.objects.locations['torch'] = 'inventory';

  assertEquals(
    play(source, withoutWaving, ['take pot']).turns[0].messages,
    ["You can't see any pot here."],
  );

  const afterWaving = pinned(source.id, '2020-01-01T00:00:00.000Z');
  afterWaving.scene = 'end-of-rainbow';
  afterWaving.objects.locations['torch'] = 'inventory';
  afterWaving.objects.locations['sceptre'] = 'inventory';

  const played = play(source, afterWaving, ['wave sceptre', 'take pot']);

  assertEquals(played.turns[1].messages, ['Taken.']);
});

Deno.test('rainbow: waving again dissolves it, and waving from atop it is fatal', () => {
  const toggle = pinned(source.id, '2020-01-01T00:00:00.000Z');
  toggle.scene = 'aragain-falls';
  toggle.objects.locations['torch'] = 'inventory';
  toggle.objects.locations['sceptre'] = 'inventory';

  const played = play(source, toggle, ['wave sceptre', 'wave sceptre']);

  assertEquals(played.turns[1].messages, ['The rainbow seems to have become somewhat run-of-the-mill.']);
  assertEquals(played.state.flags['rainbow-flag'], false);

  const fatal = pinned(source.id, '2020-01-01T00:00:00.000Z');
  fatal.scene = 'on-rainbow';
  fatal.objects.locations['torch'] = 'inventory';
  fatal.objects.locations['sceptre'] = 'inventory';

  assert(
    play(source, fatal, ['wave sceptre']).turns[0].messages.some((line) => line.includes('hanging in midair')),
  );
});

Deno.test('death: scatters what was carried, treasures underground and belongings above ground', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'troll-room';
  state.objects.locations['lamp'] = 'inventory';
  state.objects.locations['coffin'] = 'inventory';
  state.objects.locations['chalice'] = 'inventory';
  state.objects.locations['knife'] = 'inventory';
  state.flags['player-died'] = true;

  const played = play(source, state, ['look']);

  const aboveGround = ['west-of-house', 'north-of-house', 'east-of-house', 'south-of-house', 'forest-1',
    'forest-2', 'forest-3', 'path', 'clearing', 'grating-clearing', 'canyon-view'];
  const underground = ['round-room', 'troll-room', 'cellar', 'maze-1', 'deep-canyon', 'reservoir-south',
    'dam-room', 'torch-room', 'egypt-room', 'south-temple', 'gallery'];

  assertEquals(played.state.objects.locations['lamp'], 'living-room', "ZIL's own special case");
  assertEquals(played.state.objects.locations['coffin'], 'egypt-room', "ZIL's own special case");
  assertEquals(
    underground.includes(played.state.objects.locations['chalice'] as string),
    true,
    'expected the chalice (a treasure) to land in one of the underground scatter rooms',
  );
  assertEquals(
    aboveGround.includes(played.state.objects.locations['knife'] as string),
    true,
    'expected the knife (a belonging, not a treasure) to land in one of the above-ground scatter rooms',
  );
});

Deno.test('exorcise: "exorcise ghosts" reaches the ceremony hint, not a bare-verb refusal', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'entrance-to-hades';
  state.objects.locations['torch'] = 'inventory';
  state.objects.locations['ghosts'] = 'entrance-to-hades';

  const played = play(source, state, ['exorcise ghosts']);

  assertEquals(played.turns[0].messages, ["You aren't equipped for an exorcism."]);
});

Deno.test('exorcise: bare "exorcise" gives the same ceremony hint the named form does', () => {
  const unequipped = pinned(source.id, '2020-01-01T00:00:00.000Z');
  unequipped.scene = 'entrance-to-hades';
  unequipped.objects.locations['torch'] = 'inventory';
  unequipped.objects.locations['ghosts'] = 'entrance-to-hades';

  const withoutGear = play(source, unequipped, ['exorcise']);
  assertEquals(withoutGear.turns[0].messages, ["You aren't equipped for an exorcism."]);

  const equipped = pinned(source.id, '2020-01-01T00:00:00.000Z');
  equipped.scene = 'entrance-to-hades';
  equipped.objects.locations['torch'] = 'inventory';
  equipped.objects.locations['ghosts'] = 'entrance-to-hades';
  equipped.objects.locations['bell'] = 'inventory';
  equipped.objects.locations['book'] = 'inventory';
  equipped.objects.locations['candles'] = 'inventory';

  const withGear = play(source, equipped, ['exorcise']);
  assertEquals(withGear.turns[0].messages, ['You must perform the ceremony.']);
});

Deno.test('grate: refuses the handful of objects ZIL genuinely sizes too large for it', () => {
  for (const scene of ['grating-room', 'grating-clearing']) {
    const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
    state.scene = scene;
    state.objects.locations['torch'] = 'inventory';
    state.objects.locations['sword'] = 'inventory';
    state.flags['grate-unlocked'] = true;
    state.flags['grate-revealed'] = true;
    state.flags['grate-open'] = true;

    const played = play(source, state, ['put sword in grate']);

    assertEquals(played.turns[0].messages, ["It won't fit through the grating."]);
  }
});

Deno.test('boat: a weapon dropped, put aboard, or attacking it while aboard punctures it', () => {
  const primed = (scene: string) => {
    const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
    state.scene = scene;
    state.flags['aboard'] = true;
    state.objects.locations['inflated-boat'] = scene;
    state.objects.locations['torch'] = 'inventory';
    return play(source, state, ['look']).state;
  };

  const dropped = primed('river-2');
  dropped.objects.locations['knife'] = 'inventory';
  const droppedResult = play(source, dropped, ['drop knife']);
  assert(droppedResult.turns[0].messages.some((line) => line.includes("didn't agree with the boat")));

  const putIn = primed('river-3');
  putIn.objects.locations['sword'] = 'inventory';
  const putInResult = play(source, putIn, ['put sword in boat']);
  assert(putInResult.turns[0].messages.some((line) => line.includes("didn't agree with the boat")));

  const attacked = primed('river-4');
  attacked.objects.locations['axe'] = 'inventory';
  const attackedResult = play(source, attacked, ['attack boat with axe']);
  assert(attackedResult.turns[0].messages.some((line) => line.includes("didn't agree with the boat")));
});

Deno.test('boat: puncturing it is fatal mid-river but only costs the boat on land', () => {
  const midRiver = pinned(source.id, '2020-01-01T00:00:00.000Z');
  midRiver.scene = 'river-2';
  midRiver.flags['aboard'] = true;
  midRiver.objects.locations['inflated-boat'] = 'river-2';
  midRiver.objects.locations['knife'] = 'inventory';

  const midRiverResult = play(source, midRiver, ['drop knife']);
  assert(midRiverResult.turns[0].messages.some((line) => line.includes('carried over a waterfall')));

  const onLand = pinned(source.id, '2020-01-01T00:00:00.000Z');
  onLand.scene = 'dam-base';
  onLand.flags['aboard'] = true;
  onLand.objects.locations['inflated-boat'] = 'dam-base';
  onLand.objects.locations['knife'] = 'inventory';

  const onLandResult = play(source, onLand, ['drop knife']);
  assertFalse(onLandResult.turns[0].messages.some((line) => line.includes('carried over a waterfall')));
  assertEquals(onLandResult.state.flags['aboard'], false);
  assertEquals(onLandResult.state.objects.locations['punctured-boat'], 'dam-base');
});

Deno.test('disembark: getting out mid-river refuses instead of killing the player', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'river-2';
  state.flags['aboard'] = true;
  state.objects.locations['inflated-boat'] = 'river-2';
  state.objects.locations['torch'] = 'inventory';

  const played = play(source, state, ['get out of boat']);

  assertEquals(played.turns[0].messages, ['You realize that getting out here would be fatal.']);
  assertEquals(played.state.flags['aboard'], true);
  assertFalse(played.state.flags['player-died']);
});

Deno.test('loud room: a rising reservoir ejects a player who stays, unless the tide is already low', () => {
  const draining = pinned(source.id, '2020-01-01T00:00:00.000Z');
  draining.scene = 'loud-room';
  draining.objects.locations['torch'] = 'inventory';
  draining.flags['gates-open'] = true;

  const drainingResult = play(source, draining, Array(6).fill('wait'));
  assert(
    ['damp-cave', 'round-room', 'deep-canyon'].includes(drainingResult.state.scene),
    `expected ejection to one of the room's three exits, landed in ${drainingResult.state.scene}`,
  );

  const drained = pinned(source.id, '2020-01-01T00:00:00.000Z');
  drained.scene = 'loud-room';
  drained.objects.locations['torch'] = 'inventory';
  drained.flags['gates-open'] = true;
  drained.flags['low-tide'] = true;
  drained.measures ??= {};
  drained.measures['dam'] = { water: 0 };

  const drainedResult = play(source, drained, Array(6).fill('wait'));
  assertEquals(drainedResult.state.scene, 'loud-room');
});

Deno.test('bell: ringing it while already holding lit candles drops and puts them out', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'entrance-to-hades';
  state.objects.locations['torch'] = 'inventory';
  state.objects.locations['ghosts'] = 'entrance-to-hades';
  state.objects.locations['bell'] = 'inventory';
  state.objects.locations['candles'] = 'inventory';
  state.flags['candles-on'] = true;

  const played = play(source, state, ['ring bell']);

  assertEquals(played.state.objects.locations['candles'], 'entrance-to-hades');
  assertEquals(played.state.flags['candles-on'], false);
});

Deno.test('treasures: painting, skull and trunk carry the treasure tag like every other one', () => {
  for (const treasure of ['painting', 'skull', 'trunk']) {
    const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
    state.scene = 'troll-room';
    state.objects.locations[treasure] = 'inventory';
    state.flags['player-died'] = true;

    const played = play(source, state, ['look']);

    const underground = ['round-room', 'troll-room', 'cellar', 'maze-1', 'deep-canyon', 'reservoir-south',
      'dam-room', 'torch-room', 'egypt-room', 'south-temple', 'gallery'];

    assert(
      underground.includes(played.state.objects.locations[treasure] as string),
      `expected ${treasure} to scatter underground as a treasure, landed in ${played.state.objects.locations[treasure]}`,
    );
  }
});

Deno.test('torch-room: mentions the dangling rope once it is tied above', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'torch-room';
  state.objects.locations['torch'] = 'inventory';
  state.flags['dome-flag'] = true;

  const played = play(source, state, ['look', 'look']);

  assert(played.turns[1].messages[0].includes('A piece of rope descends from the railing above'));
});

Deno.test('dam: "plug with X" answers differently from a bare "plug dam"', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'dam-room';
  state.objects.locations['torch'] = 'inventory';
  state.objects.locations['screwdriver'] = 'inventory';

  assertEquals(
    play(source, state, ['plug dam']).turns[0].messages,
    ['Are you the little Dutch boy, then? Sorry, this is a big dam.'],
  );
  assertEquals(
    play(source, state, ['plug dam with screwdriver']).turns[0].messages,
    ['Do you know how big this dam is? You could only stop a tiny leak with that.'],
  );
});

Deno.test('rope: dropped untied in the Dome Room, it falls out of reach into the Torch Room', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'dome-room';
  state.objects.locations['torch'] = 'inventory';
  state.objects.locations['rope'] = 'inventory';

  const played = play(source, state, ['drop rope']);

  assertEquals(played.turns[0].messages, ['The rope drops gently to the floor below.']);
  assertEquals(played.state.objects.locations['rope'], 'torch-room');
});

Deno.test('rope: tied to the railing, it refuses to be taken back rather than quietly detaching', () => {
  const base = pinned(source.id, '2020-01-01T00:00:00.000Z');
  base.scene = 'dome-room';
  base.objects.locations['torch'] = 'inventory';
  base.objects.locations['rope'] = 'dome-room';
  base.flags['dome-flag'] = true;
  const state = play(source, base, ['look']).state;

  const played = play(source, state, ['take rope']);

  assertEquals(played.turns[0].messages, ['The rope is tied to the railing.']);
  assertEquals(played.state.objects.locations['rope'], 'dome-room');
});

Deno.test('thief: robs a treasure lying in the room before ever touching the player\'s own hands', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'round-room';
  state.flags['light'] = true;
  state.objects.locations['thief'] = 'round-room';
  state.objects.locations['bar'] = 'round-room';

  const played = play(source, state, ['wait']);

  assertEquals(played.state.objects.locations['bar'], 'held:thief');
});

Deno.test('thief: "listen" and "take thief" get their own lines instead of a generic refusal', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'round-room';
  state.flags['light'] = true;
  state.objects.locations['thief'] = 'round-room';

  assertEquals(
    play(source, state, ['listen to thief']).turns[0].messages,
    ['The thief says nothing, as you have not been formally introduced.'],
  );
  assertEquals(
    play(source, state, ['take thief']).turns[0].messages,
    ['Once you got him, what would you do with him?'],
  );
});

Deno.test('thief: throwing the knife at him before he is fighting angers rather than kills him', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'round-room';
  state.flags['light'] = true;
  state.objects.locations['thief'] = 'round-room';
  state.objects.locations['knife'] = 'inventory';

  const played = play(source, state, ['throw knife at thief']);

  assert(played.turns[0].messages.some((line) => line.includes('You missed')));
  assertEquals(played.state.objects.locations['knife'], 'round-room');
  assertEquals(played.state.flags['thief-fighting'], true);
});

Deno.test('gas room: a held flame ignites the coal gas, whichever of the three it is', () => {
  for (
    const setup of [
      (s: ReturnType<typeof pinned>) => {
        s.objects.locations['torch'] = 'inventory';
      },
      (s: ReturnType<typeof pinned>) => {
        s.objects.locations['candles'] = 'inventory';
        s.flags['candles-on'] = true;
      },
      (s: ReturnType<typeof pinned>) => {
        s.objects.locations['match'] = 'inventory';
        s.flags['match-on'] = true;
      },
    ]
  ) {
    const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
    state.scene = 'gas-room';
    setup(state);

    const played = play(source, state, ['wait']);

    assert(
      (played.turns[0].passing ?? []).some((line) => line.includes('BOOOOOOOOOOOM')),
      `expected a held flame to ignite the gas: ${JSON.stringify(played.turns[0])}`,
    );
  }

  const safe = pinned(source.id, '2020-01-01T00:00:00.000Z');
  safe.scene = 'gas-room';
  safe.objects.locations['torch'] = 'gas-room';

  const safePlayed = play(source, safe, ['wait']);

  assertFalse(
    (safePlayed.turns[0].passing ?? []).some((line) => line.includes('BOOOOOOOOOOOM')),
    'a lit torch merely lying in the room should not ignite the gas',
  );
});

Deno.test('boat: puncturing it in the reservoir or in-stream drowns rather than costing just the boat', () => {
  for (const scene of ['reservoir', 'in-stream']) {
    const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
    state.scene = scene;
    state.flags['aboard'] = true;
    state.objects.locations['inflated-boat'] = scene;
    state.objects.locations['torch'] = 'inventory';
    state.objects.locations['knife'] = 'inventory';
    const primed = play(source, state, ['look']).state;

    const played = play(source, primed, ['drop knife']);

    assert(
      played.turns[0].messages.some((line) => line.includes('heralds your drowning')),
      `expected a puncture in ${scene} to drown the player, got: ${played.turns[0].messages.join(' | ')}`,
    );
  }
});

Deno.test('disembark: getting out in the reservoir or in-stream also refuses rather than killing', () => {
  for (const scene of ['reservoir', 'in-stream']) {
    const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
    state.scene = scene;
    state.flags['aboard'] = true;
    state.objects.locations['inflated-boat'] = scene;
    state.objects.locations['torch'] = 'inventory';
    const primed = play(source, state, ['look']).state;

    const played = play(source, primed, ['get out of boat']);

    assertEquals(played.turns[0].messages, ['You realize that getting out here would be fatal.']);
    assertEquals(played.state.flags['aboard'], true);
  }
});

Deno.test('reservoir: the lake answers "cross"/"swim" differently once it has drained', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'reservoir-north';
  state.objects.locations['torch'] = 'inventory';
  state.flags['low-tide'] = true;
  const primed = play(source, state, ['look']).state;

  assertEquals(play(source, primed, ['cross lake']).turns[0].messages, ["There's not much lake left...."]);
  assertEquals(play(source, primed, ['swim lake']).turns[0].messages, ["There's not much lake left...."]);
});

Deno.test('chimney: the Studio climb gates on the lamp and a count of two items, not a size', () => {
  const climb = (setup: (state: ReturnType<typeof pinned>) => void) => {
    const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
    state.scene = 'studio';
    setup(state);
    const primed = play(source, state, ['look']).state;
    return play(source, primed, ['up']);
  };

  assertEquals(
    climb(() => {}).turns[0].messages,
    ['Going up empty-handed is a bad idea.'],
  );

  const lampOnly = climb((s) => {
    s.objects.locations['lamp'] = 'inventory';
  });
  assertEquals(lampOnly.state.scene, 'kitchen');

  const lampAndOne = climb((s) => {
    s.objects.locations['lamp'] = 'inventory';
    s.objects.locations['sword'] = 'inventory';
  });
  assertEquals(lampAndOne.state.scene, 'kitchen');

  const lampAndTwo = climb((s) => {
    s.objects.locations['lamp'] = 'inventory';
    s.objects.locations['sword'] = 'inventory';
    s.objects.locations['knife'] = 'inventory';
  });
  assertEquals(lampAndTwo.turns[0].messages, ["You can't get up there with what you're carrying."]);
  assertEquals(lampAndTwo.state.scene, 'studio');

  const noLamp = climb((s) => {
    s.objects.locations['sword'] = 'inventory';
  });
  assertEquals(noLamp.turns[0].messages, ["You can't get up there with what you're carrying."]);
  assertEquals(noLamp.state.scene, 'studio');
});

Deno.test('troll: giving him a blade can kill him outright, a second way to clear the room', () => {
  const state = pinned(source.id, '2020-01-01T00:00:01.000Z');
  state.scene = 'troll-room';
  state.objects.locations['torch'] = 'inventory';
  const primed = play(source, state, ['look']).state;
  primed.objects.locations['knife'] = 'inventory';

  const played = play(source, primed, ['give knife to troll']);

  assert(played.turns[0].messages.some((line) => line.includes('dies from an internal hemorrhage')));
  assertEquals(played.state.flags['troll-flag'], true);
  assertEquals(played.state.objects.locations['axe'], 'troll-room');
});

Deno.test('troll: a blade he does not eat is thrown back, and other gifts are simply eaten', () => {
  const gift = (item: string, command: string) => {
    const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
    state.scene = 'troll-room';
    state.objects.locations['torch'] = 'inventory';
    const primed = play(source, state, ['look']).state;
    primed.objects.locations[item] = 'inventory';
    return play(source, primed, [command]);
  };

  const thrownBack = gift('knife', 'give knife to troll');
  assert(thrownBack.turns[0].messages.some((line) => line.includes('throws it back')));
  assertEquals(thrownBack.state.objects.locations['knife'], 'troll-room');

  const eaten = gift('garlic', 'give garlic to troll');
  assert(eaten.turns[0].messages.some((line) => line.includes('gleefully eats it')));
});

Deno.test('troll: "take"/"mung"/"listen" get their own lines instead of a generic refusal', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'troll-room';
  state.objects.locations['torch'] = 'inventory';
  const primed = play(source, state, ['look']).state;

  assertEquals(
    play(source, primed, ['take troll']).turns[0].messages,
    ['The troll spits in your face, grunting "Better luck next time" in a rather barbarous accent.'],
  );
  assertEquals(
    play(source, primed, ['break troll']).turns[0].messages,
    ['The troll laughs at your puny gesture.'],
  );
  assertEquals(
    play(source, primed, ['listen to troll']).turns[0].messages,
    ['Every so often the troll says something, probably uncomplimentary, in his guttural tongue.'],
  );
});

Deno.test('cyclops: throwing something at him provokes the same as attacking, and gets its own lines', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'cyclops-room';
  state.objects.locations['torch'] = 'inventory';
  const primed = play(source, state, ['look']).state;

  const thrown = play(source, primed, ['throw sword at cyclops']);
  assertEquals(thrown.turns[0].messages, ['The cyclops shrugs but otherwise ignores your pitiful attempt.']);
  assertEquals(thrown.state.flags['cyclops-provoked'], true);

  assertEquals(
    play(source, primed, ['break cyclops']).turns[0].messages,
    ['"Do you think I\'m as stupid as my father was?", he says, dodging.'],
  );
  assertEquals(
    play(source, primed, ['take cyclops']).turns[0].messages,
    ["The cyclops doesn't take kindly to being grabbed."],
  );
  assertEquals(
    play(source, primed, ['tie cyclops']).turns[0].messages,
    ['You cannot tie the cyclops, though he is fit to be tied.'],
  );
  assertEquals(
    play(source, primed, ['listen to cyclops']).turns[0].messages,
    ['You can hear his stomach rumbling.'],
  );
});

Deno.test('match: two drafty coal-mine rooms waste it instantly instead of lighting', () => {
  for (const scene of ['lower-shaft', 'timber-room']) {
    const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
    state.scene = scene;
    state.objects.locations['lamp'] = 'inventory';
    state.flags['lamp-on'] = true;
    state.objects.locations['match'] = 'inventory';

    const played = play(source, state, ['burn match']);

    assertEquals(played.turns[0].messages, ['This room is drafty, and the match goes out instantly.']);
    assertFalse(played.state.flags['match-on']);
  }

  const elsewhere = pinned(source.id, '2020-01-01T00:00:00.000Z');
  elsewhere.scene = 'gas-room';
  elsewhere.objects.locations['lamp'] = 'inventory';
  elsewhere.flags['lamp-on'] = true;
  elsewhere.objects.locations['match'] = 'inventory';

  const lit = play(source, elsewhere, ['burn match']);

  assertEquals(lit.turns[0].messages, ['One of the matches starts to burn.']);
  assertEquals(lit.state.flags['match-on'], true);
});

Deno.test('carrying: picking up one item too many refuses with the overloaded message', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'timber-room';
  state.objects.locations['lamp'] = 'inventory';
  state.flags['lamp-on'] = true;
  state.objects.locations['coffin'] = 'inventory';
  state.objects.locations['trunk'] = 'inventory';
  state.objects.locations['timbers'] = 'timber-room';
  const primed = play(source, state, ['look']).state;

  const played = play(source, primed, ['take timbers']);

  assertEquals(played.turns[0].messages, ['Your load is too heavy.']);
  assertEquals(played.state.objects.locations['timbers'], 'timber-room');
});

Deno.test('sword: examining it says nothing about glowing unless it actually is', () => {
  const plain = pinned(source.id, '2020-01-01T00:00:00.000Z');
  plain.scene = 'living-room';
  plain.objects.locations['sword'] = 'inventory';
  const plainPrimed = play(source, plain, ['look']).state;

  assertEquals(
    play(source, plainPrimed, ['look sword']).turns[0].messages,
    ["There's nothing special about the sword."],
  );

  const withTroll = pinned(source.id, '2020-01-01T00:00:00.000Z');
  withTroll.scene = 'troll-room';
  withTroll.flags['light'] = true;
  withTroll.objects.locations['torch'] = 'inventory';
  withTroll.objects.locations['sword'] = 'inventory';
  const trollPrimed = play(source, withTroll, ['look']).state;

  assertEquals(
    play(source, trollPrimed, ['look sword']).turns[0].messages,
    ['Your sword is glowing very brightly.'],
  );
});

Deno.test('sword: glows faintly for a fixed villain one room over, not just in the same room', () => {
  const nearTroll = pinned(source.id, '2020-01-01T00:00:00.000Z');
  nearTroll.scene = 'cellar';
  nearTroll.flags['light'] = true;
  nearTroll.objects.locations['torch'] = 'inventory';
  nearTroll.objects.locations['sword'] = 'inventory';

  const nearTrollPlayed = play(source, nearTroll, ['look']);

  assert(
    (nearTrollPlayed.turns[0].passing ?? []).includes('Your sword is glowing with a faint blue glow.'),
  );
  assertEquals(nearTrollPlayed.state.measures?.['sword']?.['glow'], 1);

  const elsewhere = pinned(source.id, '2020-01-01T00:00:00.000Z');
  elsewhere.scene = 'living-room';
  elsewhere.objects.locations['sword'] = 'inventory';

  const elsewherePlayed = play(source, elsewhere, ['look']);

  assertEquals(elsewherePlayed.turns[0].passing, undefined);
  assertEquals(elsewherePlayed.state.measures?.['sword']?.['glow'], 0);

  const trollDead = pinned(source.id, '2020-01-01T00:00:00.000Z');
  trollDead.scene = 'cellar';
  trollDead.flags['light'] = true;
  trollDead.objects.locations['torch'] = 'inventory';
  trollDead.objects.locations['sword'] = 'inventory';
  trollDead.objects.locations['troll'] = 'bin';

  const trollDeadPlayed = play(source, trollDead, ['look']);

  assertEquals(trollDeadPlayed.turns[0].passing, undefined);
  assertEquals(trollDeadPlayed.state.measures?.['sword']?.['glow'], 0);
});

Deno.test('hello: greeting a character by name reaches their own answer, not the bare-verb one', () => {
  const bare = pinned(source.id, '2020-01-01T00:00:00.000Z');
  bare.scene = 'living-room';

  assert(
    ['Hello.', 'Good day.', "Nice weather we've been having, don't you think?", 'Goodbye.'].includes(
      play(source, bare, ['hello']).turns[0].messages[0],
    ),
  );

  const troll = pinned(source.id, '2020-01-01T00:00:00.000Z');
  troll.scene = 'troll-room';
  troll.flags['light'] = true;

  assertEquals(
    play(source, troll, ['hello troll']).turns[0].messages,
    ['The troll bows his head to you in greeting.'],
  );

  const ghosts = pinned(source.id, '2020-01-01T00:00:00.000Z');
  ghosts.scene = 'entrance-to-hades';
  ghosts.flags['light'] = true;

  assertEquals(
    play(source, ghosts, ['hello ghosts']).turns[0].messages,
    ['The ghosts bow their heads to you in greeting.'],
  );
});
