import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { stage } from './stage';

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

  const setCrt = useCallback((on: boolean) => {
    setCrtState(on);

    stage.storage.set(KEY, on).catch((error) => console.error('could not keep the CRT setting', error));
  }, []);

  return <CrtContext.Provider value={{ crt, setCrt }}>{children}</CrtContext.Provider>;
};

export const useCrt = (): Crt => useContext(CrtContext);
