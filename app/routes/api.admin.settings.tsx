import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { createPrismaClient } from '~/core/db.server';
import { requireAdmin } from '~/features/auth/api.server';
import { logger } from '~/core/logger.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	await requireAdmin(request, db, context);

	const settings = await db.app_settings.findMany({
		orderBy: { key: 'asc' },
	});

	return json(settings);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	await requireAdmin(request, db, context);
	
	const body = await request.json() as Record<string, unknown>;
	const { key, value, description, action } = body;

	if (!key || typeof key !== 'string') {
		return json({ message: 'Invalid Key' }, { status: 400 });
	}

	try {
		if (action === 'TOGGLE') {
			const existing = await db.app_settings.findUnique({ where: { key } });
			const newValue = existing?.value === 'true' ? 'false' : 'true';
			await db.app_settings.upsert({
				where: { key },
				update: { value: newValue },
				create: { key, value: newValue, description: typeof description === 'string' ? description : undefined }
			});
			return json({ message: `${key} is now ${newValue}` });
		}
		
		if (action === 'DELETE') {
			await db.app_settings.delete({ where: { key } });
			return json({ message: 'Setting deleted' });
		}
		
		return json({ message: 'Unknown action' }, { status: 400 });
	} catch (error) {
		logger.error('Admin setting action failed', { error: String(error) });
		return json({ message: 'Action failed' }, { status: 500 });
	}
}
