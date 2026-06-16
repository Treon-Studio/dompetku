import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { loadServiceWorker } from '@remix-pwa/sw';

startTransition(() => {
	hydrateRoot(document, <RemixBrowser />);
});

loadServiceWorker();
