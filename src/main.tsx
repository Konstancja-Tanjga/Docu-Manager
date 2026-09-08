import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '@bighat/ui';

// The design system's stylesheet first — token definitions and base rules.
// Product styles second, so they layer on top rather than under.
import '@bighat/ui/styles.css';
import './app.css';

import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

createRoot(root).render(
  <StrictMode>
    {/* `bh-root` scopes the token values. `ToastProvider` owns the live region. */}
    <div className="bh-root">
      <ToastProvider>
        <App />
      </ToastProvider>
    </div>
  </StrictMode>,
);
