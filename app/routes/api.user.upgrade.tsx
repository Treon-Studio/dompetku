import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { requireUser } from '~/lib/auth.server';
import prisma from '~/lib/prisma';

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request);
	const { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number } =
		await request.json();
	try {
		await prisma.users.update({
			data: { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number },
			where: { id: user.id },
		});
		return json('Successful', { status: 200 });
	} catch (error) {
		return json({ error, message: 'Request failed' }, { status: 500 });
	}
}