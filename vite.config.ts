import { vitePlugin as remix, cloudflareDevProxyVitePlugin } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(async () => {
	const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

	return {
		plugins: [
			tailwindcss(),
			cloudflareDevProxyVitePlugin({
				getLoadContext({ context }) {
					return context;
				},
			}),
			remix({
				ignoredRouteFiles: ['**/*.test.{js,jsx,ts,tsx}'],
				future: {
					v3_fetcherPersist: true,
					v3_lazyRouteDiscovery: true,
					v3_relativeSplatPath: true,
					v3_singleFetch: true,
					v3_throwAbortReason: true,
				},
			}),
			tsconfigPaths(),
		],
		server: {
			port: 3000,
		},
		ssr: {
			resolve: {
				externalConditions: ['workerd', 'worker'],
			},
		},
		resolve: {
			dedupe: ['react', 'react-dom'],
			alias: {
				'~': path.resolve(__dirname, 'app'),
				emails: path.resolve(__dirname, 'emails'),
			},
		},
		optimizeDeps: {
			include: ['sonner', '@radix-ui/react-tooltip'],
		},
		build: {
			chunkSizeWarningLimit: 1000,
		},
	};
});
