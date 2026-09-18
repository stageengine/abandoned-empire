const PARAGRAPHS = /\n[ \t]*\n/;

const typed = document.getElementById('typed');
const prompt = document.getElementById('prompt');
const barScore = document.getElementById('bar-score');
const barMoves = document.getElementById('bar-moves');
const scrollback = document.getElementById('scrollback');
const barLocation = document.getElementById('bar-location');

// One of the player's own measures, by id - `undefined` where a game
// declares none of them, which config.yaml's own comments say is most games,
// just not this one: `score`/`moves` are kept there on purpose so prose
// (and this bar) can read them without asking the engine for its own turn
// count.
const measure = (measures, id) => measures.find((one) => one.id === id)?.value ?? 0;

let drawn = 0;
let ended = false;

const paragraph = (voice, text) => {
  const line = document.createElement('div');

  line.className = 'line-' + voice;
  line.textContent = text;

  return line;
};

Stage.gui.onTurn((turn) => {
  for (let at = drawn; at < turn.lines.length; at += 1) {
    const line = turn.lines[at];

    line.text.split(PARAGRAPHS).filter((part) => part.trim()).forEach((part) => {
      scrollback.append(paragraph(line.voice, part));
    });
  }

  drawn = turn.lines.length;

  scrollback.scrollTop = scrollback.scrollHeight;

  ended = Boolean(turn.reply && turn.reply.finished);

  prompt.classList.toggle('ended', ended);

  // The classic Zork status line - a room's own name, falling back to its
  // id the same way Stage's own default bar does for one nobody titled, and
  // the game's own `score`/`moves` measures rather than the engine's own
  // turn count, since those are what config.yaml declares for exactly this.
  if (turn.reply) {
    barLocation.textContent = turn.reply.scene.title ?? turn.reply.scene.id;
    barScore.textContent = `Score: ${measure(turn.reply.measures, 'score')}`;
    barMoves.textContent = `Moves: ${measure(turn.reply.measures, 'moves')}`;
  }
});

// This screen's own prompt line takes over the *look* of Stage's fixed one
// - see `OwnsPromptMessage`. Told once, as early as this runs; there is no
// going back to Stage's own look for the rest of this GUI's lifetime. The
// real field a player types into stays Stage's own regardless - see
// `onTyping`/`focus` below - this document never gets an `<input>` of its
// own to draw a look around.
Stage.gui.ownsPrompt();

// What Stage's own real, invisible field currently holds - the whole of
// what this line ever shows.
Stage.gui.onTyping((text) => {
  typed.textContent = text;
});

// A tap on the prompt line itself is where a player means to type - asking
// Stage to focus its own field, since there is nothing of this document's
// own to focus. A tap anywhere else - the scrollback, reading back - is the
// opposite: it should be possible to put the keyboard away by tapping away
// from typing, the same as tapping outside any real `<input>` would have
// done without being asked. Both go through Stage, since the field lives
// outside this document either way - see `Stage.gui.focus`/`blur`.
document.addEventListener('click', (event) => {
  if (ended) {
    return;
  }

  if (prompt.contains(event.target)) {
    Stage.gui.focus();

    return;
  }

  Stage.gui.blur();
});

Stage.gui.focus();

// Stays pinned to the bottom whenever the screen itself changes size, not
// only when a new turn arrives - on iOS, focusing the prompt shrinks the
// webview's own frame to clear the keyboard (see `keyboard_tracking` in
// `prompt_bar.rs`), which moves nothing here on its own: the scrollback was
// already scrolled to what used to be its own bottom, and the keyboard
// opening does not re-ask for that to still be true under the new, shorter
// height.
addEventListener('resize', () => {
  scrollback.scrollTop = scrollback.scrollHeight;
});
