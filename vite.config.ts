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
        ssr: {
          resolve: {
            externalConditions: ['workerd', 'worker'],
          },
        },
      }),
      tsconfigPaths(),
    ],
    server: {
      port: 3000,
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '~': path.resolve(__dirname, 'app'),
        constants: path.resolve(__dirname, 'constants'),
        lib: path.resolve(__dirname, 'lib'),
        hooks: path.resolve(__dirname, 'hooks'),
        emails: path.resolve(__dirname, 'emails'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
  };
});
