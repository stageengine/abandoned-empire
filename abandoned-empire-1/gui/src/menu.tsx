import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { reason, stage } from './stage';

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
