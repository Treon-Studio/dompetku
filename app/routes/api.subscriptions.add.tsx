import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { validateSubscriptionFields } from '~/lib/validate';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const body = await request.json() as Record<string, unknown>;
	const validationError = validateSubscriptionFields(body);
	if (validationError) return validationError;
	const { name, price, paid, notify, date, url } = body;
	try {
		await db.subscriptions.create({
			data: { name, price, paid, notify, user_id: user.id, date, url },
		});
		return json({ message: 'added' }, { status: 201 });
	} catch (error) {
		console.error('Request failed:', error);
		return json({ message: 'Request failed' }, { status: 500 });
	}
}
