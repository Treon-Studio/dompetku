import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const { notes, name, price, units, category, date } = await request.json();
	try {
		await db.investments.create({
			data: { notes, name, price, units, category, user_id: user.id, date },
		});
		return json('added', { status: 201 });
	} catch (error) {
		return json({ error, message: 'Request failed' }, { status: 500 });
	}
}
