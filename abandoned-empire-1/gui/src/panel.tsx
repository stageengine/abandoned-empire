import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { stage } from './stage';

/**
 * A full screen with a title and a way back - what Load and Settings both are.
 *
 * Puts Stage's keyboard down on arriving: the game screen leaves its prompt
 * focused, and a list of saves to press has no use for a keyboard covering half of it.
 * Escape goes back as well, for whoever is at a real one.
 */
const Panel = ({ title, children }: { title: string; children: ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    stage.blur();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate(-1);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <div className="panel">
      <div className="panel-inner">
        <h2>{title}</h2>

        {children}

        <button type="button" className="btn btn-quiet" onClick={() => navigate(-1)}>
          BACK
        </button>
      </div>
    </div>
  );
};

export default Panel;
