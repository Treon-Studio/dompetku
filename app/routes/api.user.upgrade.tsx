import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { logger } from '~/lib/logger';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const body = await request.json() as Record<string, unknown>;
	const { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number } = body;

	const requiredFields = { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number };
	for (const [key, value] of Object.entries(requiredFields)) {
		if (typeof value !== 'string' || value.length === 0) {
			return json({ message: `Invalid or missing field: ${key}` }, { status: 400 });
		}
	}

	const validPlanStatuses = ['basic', 'premium'] as const;
	const validOrderStatuses = ['pending', 'paid', 'failed'] as const;
	if (!validPlanStatuses.includes(plan_status as any)) {
		return json({ message: 'Invalid plan_status' }, { status: 400 });
	}
	if (!validOrderStatuses.includes(order_status as any)) {
		return json({ message: 'Invalid order_status' }, { status: 400 });
	}

	try {
		await db.users.update({
			data: { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number },
			where: { id: user.id },
		});
		return json('Successful', { status: 200 });
	} catch (error) {
		logger.error('Request failed', { error: String(error) });
		return json({ message: 'Request failed' }, { status: 500 });
	}
}
