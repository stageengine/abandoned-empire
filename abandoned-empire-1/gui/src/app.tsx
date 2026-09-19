import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { CrtProvider } from './crt';
import Splash from './routes/splash';
import Game from './routes/game';
import Load from './routes/load';
import Settings from './routes/settings';

/**
 * `MemoryRouter`, not `BrowserRouter` or `HashRouter`: this document is
 * assembled by `app/src/gui-host/assemble.ts` into one blob and given to a
 * sandboxed iframe at a `blob:` URL, which has no real path structure to
 * route against and no history of its own worth reflecting in a URL bar
 * nothing here ever shows.
 */
const App = () => (
  <CrtProvider>
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/game" element={<Game />} />
        <Route path="/load" element={<Load />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MemoryRouter>
  </CrtProvider>
);

export default App;
