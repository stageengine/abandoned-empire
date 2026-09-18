import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app';

import './style.css';

// `#root` is guaranteed to already be in the DOM by the time this runs -
// `assemble.ts` places gui-dist/index.html's own body (this element,
// verbatim) ahead of this script in the assembled document. See
// gui/public/index.html for the element itself.
const root = document.getElementById('root');

if (!root) {
  throw new Error('gui-dist/index.html must carry <div id="root"> for this GUI to mount into');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
