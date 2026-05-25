import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number } =
		await request.json();
	try {
		await db.users.update({
			data: { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number },
			where: { id: user.id },
		});
		return json('Successful', { status: 200 });
	} catch (error) {
		return json({ error, message: 'Request failed' }, { status: 500 });
	}
}
