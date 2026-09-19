import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Panel from '../panel';
import { reason, type SaveEntry, stage } from '../stage';

/**
 * How long ago, or when, a save was written - in the player's own locale, and
 * plainly nothing where the save's own file could not say.
 */
const when = (savedAt: string | null): string => {
  const date = savedAt ? new Date(savedAt) : null;

  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Saved at an unknown time';
};

/**
 * Every save this game has, so one can be chosen on purpose - `/load`.
 *
 * Read once, on the way in. It can take a moment: Stage brings the player's other
 * devices' saves down first, so a save made elsewhere is here without a trip to
 * anywhere else. Choosing one starts from it once it has opened, and a save that
 * cannot be opened says why here and leaves whatever was being played exactly as it was.
 */
const Load = () => {
  const navigate = useNavigate();

  const [saves, setSaves] = useState<Array<SaveEntry> | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  // Which save is being opened, so a second press cannot start a second load.
  const [opening, setOpening] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let asking = true;

    stage.saves()
      .then((found) => asking && setSaves(found))
      .catch((error) => asking && setFailed(reason(error)));

    return () => {
      asking = false;
    };
  }, []);

  const open = (id: string) => {
    if (opening) {
      return;
    }

    setOpening(id);
    setProblem(null);

    stage.load(id)
      .then(() => navigate('/game', { replace: true }))
      .catch((error) => {
        setProblem(reason(error));
        setOpening(null);
      });
  };

  return (
    <Panel title="LOAD GAME">
      {failed && <p className="problem">The saves could not be listed. {failed}</p>}

      {!failed && saves === null && <p className="panel-note">Looking for saves...</p>}

      {saves?.length === 0 && <p className="panel-note">There is nothing saved for this game yet.</p>}

      {saves && saves.length > 0 && (
        <ul className="save-list">
          {saves.map((save) => (
            <li key={save.id}>
              <button
                type="button"
                className="btn save-row"
                disabled={opening !== null}
                onClick={() => open(save.id)}
              >
                {save.name || 'Untitled'}

                <span className="save-when">
                  {opening === save.id ? 'Opening...' : when(save.savedAt)}
                  {save.turns !== null && ` - ${save.turns} turns`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {problem && <p className="problem">{problem}</p>}
    </Panel>
  );
};

export default Load;
