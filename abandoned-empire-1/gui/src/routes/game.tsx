import { useEffect, useMemo, useRef, useState } from 'react';

import { stage, type Measure, type Turn } from '../stage';

const PARAGRAPHS = /\n[ \t]*\n/;

interface Paragraph {
  key: string;
  voice: string;
  text: string;
}

// One of the player's own measures, by id - `undefined` where a game
// declares none of them, which config.yaml's own comments say is most games,
// just not this one: `score`/`moves` are kept there on purpose so prose (and
// this bar) can read them without asking the engine for its own turn count.
const measureValue = (measures: ReadonlyArray<Measure>, id: string): number =>
  measures.find((one) => one.id === id)?.value ?? 0;

/**
 * Every line in a turn's transcript, split into the same per-voice
 * paragraphs the vanilla `script.js` built by hand with `document.append` -
 * on blank lines, the same way that version did, each becoming its own
 * `.line-<voice>` block. `turn.lines` is the whole transcript so far, oldest
 * first and append-only (see `TurnMessage`), so this recomputes over all of
 * it each time rather than tracking a separate "already drawn" cursor: React
 * reconciles the unchanged prefix away on its own, which is what the
 * original's own `drawn` counter was hand-rolling.
 */
const paragraphsOf = (turn: Turn | null): Array<Paragraph> => {
  if (!turn) {
    return [];
  }

  const paragraphs: Array<Paragraph> = [];

  turn.lines.forEach((line, lineAt) => {
    line.text
      .split(PARAGRAPHS)
      .filter((part) => part.trim())
      .forEach((part, partAt) => {
        paragraphs.push({ key: `${lineAt}-${partAt}`, voice: line.voice, text: part });
      });
  });

  return paragraphs;
};

/**
 * The actual playthrough screen - `/game`. Reached only once `Splash` has
 * already called `Stage.gui.begin()`, so there is nothing here to gate.
 *
 * Ports the vanilla GUI's status bar, scrollback and prompt line as they
 * stood in the original `script.js`: `onTurn` redraws the bar and the
 * scrollback, `ownsPrompt()`/`onTyping` draw this screen's own picture of
 * Stage's real, invisible field, a click focuses or blurs it depending on
 * where it landed, and `onTrace` keeps logging to the console exactly as
 * before - nothing new, this is a faithful port.
 */
const Game = () => {
  const [turn, setTurn] = useState<Turn | null>(null);
  const [typed, setTyped] = useState('');

  const scrollbackRef = useRef<HTMLPreElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const endedRef = useRef(false);

  const paragraphs = useMemo(() => paragraphsOf(turn), [turn]);
  const ended = Boolean(turn?.reply?.finished);

  endedRef.current = ended;

  useEffect(() => {
    stage.onTurn(setTurn);
    stage.onTyping(setTyped);

    // Proving the bridge end to end against a real game, not drawing
    // anything with it yet - this game's own config.yaml turns both trace
    // categories on for exactly that reason. A visible use of this (a
    // journal overlay, effects tied to a specific trigger) is separate work
    // once the mechanism itself is confirmed working live.
    stage.onTrace((trace) => {
      console.log('stage:trace', trace);
    });

    // This screen's own prompt line takes over the *look* of Stage's fixed
    // one - see `OwnsPromptMessage`. Told once, as early as this runs; there
    // is no going back to Stage's own look for the rest of this GUI's
    // lifetime. The real field a player types into stays Stage's own
    // regardless - see `onTyping`/`focus` below - this document never gets
    // an `<input>` of its own to draw a look around.
    stage.ownsPrompt();
  }, []);

  // A tap on the prompt line itself is where a player means to type - asking
  // Stage to focus its own field, since there is nothing of this document's
  // own to focus. A tap anywhere else - the scrollback, reading back - is
  // the opposite: it should be possible to put the keyboard away by tapping
  // away from typing, the same as tapping outside any real `<input>` would
  // have done without being asked. Both go through Stage, since the field
  // lives outside this document either way - see `Stage.gui.focus`/`blur`.
  //
  // The vanilla version guarded this with `if (!begun || ended) return;`,
  // where `!begun` was there only because a click dismissing the splash
  // bubbles up into this same listener in the same tick, reaching it before
  // `begun` was set - see the note on this in Splash.tsx. That cannot happen
  // here: `/` and `/game` are different mounted components, so a click on
  // the Play button has nothing of this screen's to bubble into. `ended`
  // alone is what is left to guard.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (endedRef.current) {
        return;
      }

      if (promptRef.current?.contains(event.target as Node)) {
        stage.focus();

        return;
      }

      stage.blur();
    };

    document.addEventListener('click', onClick);

    return () => document.removeEventListener('click', onClick);
  }, []);

  // Stays pinned to the bottom whenever a new turn arrives, and whenever the
  // screen itself changes size - not only on a new turn - on iOS, focusing
  // the prompt shrinks the webview's own frame to clear the keyboard (see
  // `keyboard_tracking` in `prompt_bar.rs`), which moves nothing here on its
  // own: the scrollback was already scrolled to what used to be its own
  // bottom, and the keyboard opening does not re-ask for that to still be
  // true under the new, shorter height.
  useEffect(() => {
    const pin = () => {
      const el = scrollbackRef.current;

      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    };

    pin();

    addEventListener('resize', pin);

    return () => removeEventListener('resize', pin);
  }, [paragraphs]);

  // The classic Zork status line - a room's own name, falling back to its id
  // the same way Stage's own default bar does for one nobody titled, and the
  // game's own `score`/`moves` measures rather than the engine's own turn
  // count, since those are what config.yaml declares for exactly this.
  const location = turn?.reply ? turn.reply.scene.title ?? turn.reply.scene.id : '';
  const score = turn?.reply ? `Score: ${measureValue(turn.reply.measures, 'score')}` : '';
  const moves = turn?.reply ? `Moves: ${measureValue(turn.reply.measures, 'moves')}` : '';

  return (
    <div id="screen">
      <div id="bar">
        <div id="bar-inner">
          <span id="bar-location">{location}</span>
          <span id="bar-stats">
            <span id="bar-score">{score}</span>
            <span id="bar-moves">{moves}</span>
          </span>
        </div>
      </div>

      <div id="crt"></div>

      <pre id="scrollback" ref={scrollbackRef}>
        {paragraphs.map((paragraph) => (
          <div key={paragraph.key} className={`line-${paragraph.voice}`}>
            {paragraph.text}
          </div>
        ))}
      </pre>

      <div id="prompt" ref={promptRef} className={ended ? 'ended' : undefined}>
        <span id="prompt-caret">&gt;</span>
        <span id="typed">{typed}</span>
        <span id="cursor">|</span>
      </div>
    </div>
  );
};

export default Game;
