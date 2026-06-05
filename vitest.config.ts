import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		pool: 'forks',
		include: ['app/__tests__/**/*.test.{ts,tsx}'],
		setupFiles: ['./app/setup-test.ts'],
	},
});
