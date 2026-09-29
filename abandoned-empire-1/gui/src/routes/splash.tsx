import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { stage } from '../stage';

const Splash = () => {
  const navigate = useNavigate();
  const begun = useRef(false);

  const [resumable, setResumable] = useState<boolean | null>(null);

  const begin = (fresh: boolean) => {
    if (begun.current) {
      return;
    }

    begun.current = true;

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
  }, []);

  return (
    <div id="splash">
      <div id="splash-inner">
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
