import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { reason, stage } from './stage';

/**
 * The menu over the game screen: back to it, load another save, the settings, start
 * again, or leave.
 *
 * Start again asks first. It leaves whatever was saved exactly where it is, but what
 * has happened since the last save is not something to lose to one stray press. Load
 * is already a choice of one particular save from a list, and Quit is what the
 * window's own close button does, which does not ask either. Every call here can be
 * refused, and says why in the menu rather than closing it as if it had worked.
 */
const GameMenu = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();

  const [confirming, setConfirming] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const startAgain = () => {
    setProblem(null);

    stage.restart().then(onClose).catch((error) => setProblem(reason(error)));
  };

  return (
    <div
      id="menu"
      role="dialog"
      aria-label="Menu"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div id="menu-inner">
        {confirming
          ? (
            <>
              <p>Start again? Anything since you last saved is lost.</p>

              <button type="button" className="btn" onClick={startAgain}>
                START AGAIN
              </button>

              <button type="button" className="btn btn-quiet" onClick={() => setConfirming(false)}>
                KEEP PLAYING
              </button>
            </>
          )
          : (
            <>
              <button type="button" className="btn" onClick={onClose}>
                RESUME
              </button>

              <button type="button" className="btn" onClick={() => navigate('/load')}>
                LOAD GAME
              </button>

              <button type="button" className="btn" onClick={() => navigate('/settings')}>
                SETTINGS
              </button>

              <button type="button" className="btn" onClick={() => setConfirming(true)}>
                START AGAIN
              </button>

              <button type="button" className="btn btn-quiet" onClick={() => stage.quit()}>
                QUIT
              </button>
            </>
          )}

        {problem && <p className="problem">{problem}</p>}
      </div>
    </div>
  );
};

export default GameMenu;
