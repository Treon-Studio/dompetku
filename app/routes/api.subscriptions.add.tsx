import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const { name, price, paid, notify, date, url } = await request.json();
	try {
		await db.subscriptions.create({
			data: { name, price, paid, notify, user_id: user.id, date, url },
		});
		return json('added', { status: 201 });
	} catch (error) {
		return json({ error, message: 'Request failed' }, { status: 500 });
	}
}
