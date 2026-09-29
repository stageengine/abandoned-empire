import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app';

import './style.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('gui-dist/index.html must carry <div id="root"> for this GUI to mount into');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
