import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { createDbClient } from '~/core/db.server';
import { app_settings } from '~/core/db/schema';
import { asc, eq } from 'drizzle-orm';
import { requireAdmin } from '~/features/auth/api.server';
import { logger } from '~/core/logger.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createDbClient(context.cloudflare.env);
	await requireAdmin(request, db, context);

	const settings = await db.select().from(app_settings).orderBy(asc(app_settings.key));

	return json(settings);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(context.cloudflare.env);
	await requireAdmin(request, db, context);
	
	const body = await request.json() as Record<string, unknown>;
	const { key, value, description, action } = body;

	if (!key || typeof key !== 'string') {
		return json({ message: 'Invalid Key' }, { status: 400 });
	}

	try {
		if (action === 'TOGGLE') {
			const [existing] = await db.select().from(app_settings).where(eq(app_settings.key, key)).limit(1);
			const newValue = existing?.value === 'true' ? 'false' : 'true';
			
			if (existing) {
				await db.update(app_settings).set({ value: newValue }).where(eq(app_settings.key, key));
			} else {
				await db.insert(app_settings).values({ 
					key, 
					value: newValue, 
					description: typeof description === 'string' ? description : '' 
				});
			}
			return json({ message: `${key} is now ${newValue}` });
		}
		
		if (action === 'DELETE') {
			await db.delete(app_settings).where(eq(app_settings.key, key));
			return json({ message: 'Setting deleted' });
		}
		
		return json({ message: 'Unknown action' }, { status: 400 });
	} catch (error) {
		logger.error('Admin setting action failed', { error: String(error) });
		return json({ message: 'Action failed' }, { status: 500 });
	}
}
