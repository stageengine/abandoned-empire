import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { stage } from '../stage';

/**
 * The splash/title screen - `/`.
 *
 * A faithful port of the original `#splash` markup and its `begin()` in the
 * vanilla `script.js`: a click on Play, or Enter/Space anywhere, calls
 * `Engine.gui.begin()` once and moves on to `/game`. Where the window was
 * opened to come back to a save, Play reads Continue and Start again sits
 * beside it - the one thing here that is not a port, since the vanilla GUI
 * had no way to be told. Enter and Space only ever mean the first: a stray
 * keypress must not be able to put a save down. Guarded against firing
 * twice the same way the original guarded `begun` - a click and an Enter in
 * the same moment should not ask twice - with a ref rather than state, since
 * this only needs to be checked synchronously inside the handlers
 * themselves, never rendered.
 *
 * The original's other reason for guarding `begun` - a click that dismissed
 * the splash bubbling up into the game screen's own click handler and
 * immediately blurring the prompt `begin()` just focused - cannot happen
 * here at all: `/game` is a different mounted component, not overlapping
 * DOM this one's click could ever reach. See Game.tsx's own click handler,
 * which has nothing guarding against that because there is nothing to guard
 * against.
 */
const Splash = () => {
  const navigate = useNavigate();
  const begun = useRef(false);

  // Whether the window was opened to come back to a save - `null` until Stage
  // has said, which is `ready`. Told rather than found out: this document is
  // sandboxed and has no way to look for a save itself. See `ResumableMessage`.
  const [resumable, setResumable] = useState<boolean | null>(null);

  const begin = (fresh: boolean) => {
    if (begun.current) {
      return;
    }

    begun.current = true;

    // On to the game once its first turn is in, not on the click: the game screen
    // then mounts with something to draw. Asked again if it was refused - a splash
    // that could not start has nothing better to do than let somebody try again.
    (fresh ? stage.restart() : stage.begin())
      .then(() => navigate('/game'))
      .catch((error) => {
        console.error('could not begin', error);

        begun.current = false;
      });
  };

  useEffect(() => {
    stage.ready.then(() => setResumable(stage.isResumable));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (begun.current) {
        return;
      }

      // A button that has focus answers Enter and Space itself, and what it does is
      // its own: Load game must not start the game because a key was pressed on it.
      // Play has focus too, and starts the game when it does that.
      if (event.target instanceof Element && event.target.closest('button')) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();

        begin(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="splash">
      <div id="splash-inner">
        {/* Written as the file's own name, exactly - `assemble.ts` swaps every
            literal mention of a file this GUI carries for a `data:` URI, which is
            the only way a sandboxed blob document can reach it. The file lives in
            `public/` for `vite build` to copy across; `emptyOutDir` would wipe it
            from `gui-dist/` otherwise. Decorative: the title below says the same.
            Sized in attributes so its space is held before it has decoded. */}
        <img id="splash-banner" src="splash-banner.webp" alt="" width={1260} height={708} />

        <h1>ABANDONED EMPIRE I</h1>

        <p id="splash-tag">The Great Underground Empire</p>

        <p id="splash-copyright">
          A port of Zork I, by Infocom
          <br />
          Copyright &copy; 1981, 1982, 1983 Infocom, Inc.
        </p>

        <div id="splash-actions" className={resumable === null ? 'pending' : undefined}>
          <button id="splash-play" type="button" onClick={() => begin(false)}>
            {resumable ? 'CONTINUE' : 'PLAY'}
          </button>

          {resumable && (
            <button id="splash-again" type="button" onClick={() => begin(true)}>
              START AGAIN
            </button>
          )}
        </div>

        <p id="splash-hint">or press Enter</p>

        <div id="splash-links" className={resumable === null ? 'pending' : undefined}>
          <button type="button" className="link" onClick={() => navigate('/load')}>
            LOAD GAME
          </button>

          <button type="button" className="link" onClick={() => navigate('/settings')}>
            SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};

export default Splash;
