import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { stage } from './stage';

/**
 * Whether the CRT effect is on - scanlines, a soft vignette and a faint glow over
 * the game screen - kept for next time in this GUI's own storage.
 *
 * On until somebody says otherwise: it is the look this game was made with, and a
 * player who has never opened Settings has not chosen against it. Read once, when
 * Stage says it is ready; a value that cannot be read (or is not a yes or a no) leaves
 * it as it was, on, rather than putting a failure between somebody and the game.
 */
const KEY = 'crt';

interface Crt {
  crt: boolean;
  setCrt: (on: boolean) => void;
}

const CrtContext = createContext<Crt>({ crt: true, setCrt: () => {} });

export const CrtProvider = ({ children }: { children: ReactNode }) => {
  const [crt, setCrtState] = useState(true);

  useEffect(() => {
    let current = true;

    stage.ready
      .then(() => stage.storage.get(KEY, true))
      .then((stored) => {
        if (current && stored === false) {
          setCrtState(false);
        }
      })
      .catch((error) => console.error('could not read the CRT setting', error));

    return () => {
      current = false;
    };
  }, []);

  // The screen changes on the press, not once the disk has answered - a switch that
  // waits to be told it worked feels broken - and a failure to keep it is said to the
  // console and otherwise costs nothing but having to press it again next time.
  const setCrt = useCallback((on: boolean) => {
    setCrtState(on);

    stage.storage.set(KEY, on).catch((error) => console.error('could not keep the CRT setting', error));
  }, []);

  return <CrtContext.Provider value={{ crt, setCrt }}>{children}</CrtContext.Provider>;
};

export const useCrt = (): Crt => useContext(CrtContext);
