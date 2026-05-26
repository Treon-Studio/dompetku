import { logger } from '~/lib/logger';

export const incrementUsage = async () => {
	try {
		const res = await fetch('/api/user/usage', { method: 'POST' });
		return await res.json();
	} catch (error) {
		logger.error('Failed to increment usage', { error: String(error) });
	}
};