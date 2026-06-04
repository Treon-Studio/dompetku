import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { createPrismaClient } from '~/lib/prisma';
import { requireAdmin } from '~/lib/auth.server';
import { logger } from '~/lib/logger.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	await requireAdmin(request, db, context);

	const url = new URL(request.url);
	const search = url.searchParams.get('q') || '';
	
	const users = await db.users.findMany({
		where: {
			OR: [
				{ email: { contains: search } },
				{ phone: { contains: search } }
			]
		},
		select: {
			id: true,
			email: true,
			phone: true,
			role: true,
			plan_status: true,
			order_status: true,
			created_at: true,
		},
		orderBy: { created_at: 'desc' },
		take: 50,
	});

	return json(users);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	await requireAdmin(request, db, context);
	
	const body = await request.json() as Record<string, unknown>;
	const { id, action } = body;

	if (!id || typeof id !== 'string') {
		return json({ message: 'Invalid ID' }, { status: 400 });
	}

	try {
		if (action === 'UPGRADE') {
			await db.users.update({
				where: { id },
				data: { plan_status: 'premium', order_status: 'paid' }
			});
			return json({ message: 'User upgraded to premium' });
		}
		
		if (action === 'DOWNGRADE') {
			await db.users.update({
				where: { id },
				data: { plan_status: 'basic', order_status: null }
			});
			return json({ message: 'User downgraded to basic' });
		}

		if (action === 'DELETE') {
			await db.users.delete({ where: { id } });
			return json({ message: 'User deleted' });
		}
		
		return json({ message: 'Unknown action' }, { status: 400 });
	} catch (error) {
		logger.error('Admin action failed', { error: String(error) });
		return json({ message: 'Action failed' }, { status: 500 });
	}
}
