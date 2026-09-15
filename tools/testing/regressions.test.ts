/**
 * One test per fidelity bug found and fixed against the real Zork I this
 * session. Each of these used to require a subprocess per side, a script fed
 * over stdin, and text scraped back out - and for anything past the troll or
 * the thief, a retry loop, since a script played from a fresh start dies to
 * combat as often as it survives. `harness.ts` replaces all of that: the game
 * runs in process, a `Turn` is structured data rather than text to grep, and
 * a pinned seed makes every roll in `scenarios.ts` come out the same way
 * every time this file runs.
 *
 * `tools/audit.py` (dfrotz vs. the port) is still what checks fidelity
 * against the real ZIL binary - nothing here replaces that. What these check
 * is that the specific things that were once wrong stay fixed, in seconds,
 * without a copy of Zork I in the loop.
 */
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
  // A wound built directly (`arch/0012`'s technique) rather than fished for in
  // a real fight: which of the troll's blows land, and how many, is exactly
  // the sort of thing a pinned seed fixes for one script and not for whatever
  // a later edit turns that script into, and this test's own subject is the
  // recovery, not the wounding.
  const wounded = structuredClone(pinned(source.id, '2020-01-01T00:00:00.000Z'));

  wounded.measures.player = { ...wounded.measures.player, allowance: 60 };

  // Fifty plain, silent turns - `look` costs nothing to answer and rolls no
  // dice of its own, so this is fifty ticks of healing and nothing else.
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

  // Standing in for having come back up some other way (the chimney, in a
  // real playthrough) and reopened it from the living room, which is the
  // only situation a second descent is reachable from at all - `arch/0012`'s
  // technique of editing a state directly rather than replaying a route that
  // is not this test's own subject.
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
  // The lamp is lit through the wait, so its own life is the more direct
  // witness: three ticks of light spent for one typed command, not one.
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

  start.scene = 'lower-shaft'; // "Drafty Room", by its display name
  start.objects.locations['torch'] = 'lower-shaft';

  // Two turns, not one: `light` is computed by an every-turn rule, which runs
  // after an action rather than before it, so a state built by hand like this
  // one - skipping the turn that would ordinarily have set `light` on arrival
  // - reads its own stale default (dark) on the very first command. The
  // second `look` is the one answering with `light` as this scene actually
  // leaves it, which is `look`'s own subject in this test, not the first.
  const { turns } = play(source, start, ['look', 'look']);

  assertFalse(
    turns[1].messages.some((line) => /pitch black/i.test(line)),
    `a room holding an unheld torch should not be dark: ${turns[1].messages.join(' | ')}`,
  );
});

Deno.test('machine: coal becomes the diamond once the switch is thrown on a closed lid', () => {
  const played = play(source, pinned(source.id, diamondSecured.seed), diamondSecured.commands);

  // `diamondSecured` runs all the way through `take diamond`, the scenario's
  // own namesake, so the diamond is in the player's hands by the end of it,
  // not still sitting in the machine.
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
  // Sliced relative to the `give` itself, not a bare `indexOf('up')` - the
  // attic visit earlier in this same script also says `up`, and would find
  // that one instead.
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

Deno.test('chalice: banks in the trophy case instead of refusing every "put chalice in" sentence', () => {
  // Taken and banked the moment the treasure room is reached, before the
  // thief fight even starts - he is still alive and wandering the rest of
  // this scenario's own script, and a chalice carried the long way round
  // risks his ordinary theft the way the fight's own outcome never does.
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
  // `diamondSecured` does not require the thief to actually die - this one
  // does, since the canary and egg are his to drop, not the treasure room's
  // own furniture the way the chalice is. `seek` over `postThief`'s own
  // commands for a seed where the seven scripted knife swings land enough of
  // them, the same search `find-seed.ts` runs, rather than a hand-built state:
  // the first seed to satisfy it is deterministic, so this costs nothing on
  // every later run.
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

/**
 * Like `seek`, but starting from a state the caller gets to mutate first -
 * for a weapon this early game never hands the player any other way to
 * reach without replaying the maze that actually holds one.
 */
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
  // `kill troll with knife`, reached the ordinary way (down through the
  // cellar) but carrying a knife the real maze does not hand out this
  // early - primed directly, since the fight itself is what is under test,
  // not the maze. Used to fall through every action on `troll.character.yaml` -
  // none of them owned a `with knife` shape - and land on the engine's own
  // "You cannot attack the troll with the knife" rather than a fight.
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

  // `kill thief with sword`, reached the ordinary way (through to the
  // treasure-room ambush), used to fall through the same way.
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

Deno.test('death: scatters carried treasures outside instead of quietly keeping them', () => {
  const state = pinned(source.id, '2020-01-01T00:00:00.000Z');
  state.scene = 'troll-room';
  state.objects.locations['lamp'] = 'inventory';
  state.objects.locations['coffin'] = 'inventory';
  state.objects.locations['chalice'] = 'inventory';
  state.objects.locations['knife'] = 'inventory';
  state.flags['player-died'] = true;

  const played = play(source, state, ['look']);

  assertEquals(played.state.objects.locations['lamp'], 'living-room', "ZIL's own special case");
  assertEquals(played.state.objects.locations['coffin'], 'egypt-room', "ZIL's own special case");
  assertEquals(
    ['west-of-house', 'north-of-house', 'east-of-house', 'south-of-house', 'forest-1', 'forest-2', 'forest-3',
      'path', 'clearing', 'grating-clearing', 'canyon-view'].includes(
      played.state.objects.locations['chalice'] as string,
    ),
    true,
    'expected the chalice to land in one of the eleven above-ground scatter rooms',
  );
  assertEquals(played.state.objects.locations['knife'], 'inventory', 'a non-treasure is not scattered');
});
