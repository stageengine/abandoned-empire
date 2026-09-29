import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { stage } from './stage';

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
