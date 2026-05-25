export const incrementUsage = async () => {
	try {
		const res = await fetch('/api/user/usage', { method: 'POST' });
		return await res.json();
	} catch (error) {
		console.error('Failed to increment usage:', error);
	}
};