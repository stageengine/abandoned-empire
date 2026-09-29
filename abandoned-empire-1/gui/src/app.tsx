import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Game from './routes/game';
import Load from './routes/load';
import { CrtProvider } from './crt';
import Splash from './routes/splash';
import Settings from './routes/settings';

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
