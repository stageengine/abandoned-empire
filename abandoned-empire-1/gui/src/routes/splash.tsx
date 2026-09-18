import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { stage } from '../stage';

/**
 * The splash/title screen - `/`.
 *
 * A faithful port of the original `#splash` markup and its `begin()` in the
 * vanilla `script.js`: a click on Play, or Enter/Space anywhere, calls
 * `Stage.gui.begin()` once and moves on to `/game`. Guarded against firing
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

  const begin = () => {
    if (begun.current) {
      return;
    }

    begun.current = true;

    stage.begin();

    navigate('/game');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (begun.current) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();

        begin();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="splash">
      <div id="splash-inner">
        <h1>ABANDONED EMPIRE I</h1>

        <p id="splash-tag">The Great Underground Empire</p>

        <p id="splash-copyright">
          A port of Zork I, by Infocom
          <br />
          Copyright &copy; 1981, 1982, 1983 Infocom, Inc.
        </p>

        <button id="splash-play" type="button" onClick={begin}>
          PLAY
        </button>

        <p id="splash-hint">or press Enter</p>
      </div>
    </div>
  );
};

export default Splash;
