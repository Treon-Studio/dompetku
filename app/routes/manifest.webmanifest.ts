import type { WebAppManifest } from '@remix-pwa/dev';
import { json } from '@remix-run/cloudflare';

export const loader = () => {
	return json(
		{
			short_name: 'Dompetku',
			name: 'Dompetku',
			description: 'Effortlessly Track and Manage your Expenses.',
			start_url: '/?utm_source=homescreen',
			display: 'standalone',
			orientation: 'portrait',
			background_color: '#09090b',
			theme_color: '#09090b',
			icons: [
				{
					src: '/icons/android-chrome-192x192.png',
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: '/icons/android-chrome-512x512.png',
					sizes: '512x512',
					type: 'image/png',
				},
			],
		} as WebAppManifest,
		{
			headers: {
				'Cache-Control': 'public, max-age=600',
				'Content-Type': 'application/manifest+json',
			},
		}
	);
};
