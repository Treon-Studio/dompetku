import path from "node:path";
import { remixPWA } from "@remix-pwa/dev";
import { cloudflareDevProxyVitePlugin, vitePlugin as remix } from "@remix-run/dev";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(async () => {
	const { default: tsconfigPaths } = await import("vite-tsconfig-paths");

	return {
		plugins: [
			tailwindcss(),
			cloudflareDevProxyVitePlugin({
				getLoadContext({ context }) {
					return context;
				},
			}),
			remix({
				ignoredRouteFiles: ["**/*.test.{js,jsx,ts,tsx}"],
				future: {
					v3_fetcherPersist: true,
					v3_lazyRouteDiscovery: true,
					v3_relativeSplatPath: true,
					v3_singleFetch: true,
					v3_throwAbortReason: true,
				},
			}),
			remixPWA(),
			tsconfigPaths(),
		],
		server: {
			port: 3000,
		},
		ssr: {
			resolve: {
				externalConditions: ["workerd", "worker"],
			},
		},
		resolve: {
			dedupe: ["react", "react-dom"],
			alias: {
				"~": path.resolve(__dirname, "app"),
				emails: path.resolve(__dirname, "emails"),
			},
		},
		optimizeDeps: {
			include: ["sonner", "@radix-ui/react-tooltip"],
		},
		build: {
			chunkSizeWarningLimit: 1000,
		},
	};
});
