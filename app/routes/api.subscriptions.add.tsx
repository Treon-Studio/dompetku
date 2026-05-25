import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { requireUser } from '~/lib/auth.server';
import prisma from '~/lib/prisma';

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request);
	const { name, price, paid, notify, date, url } = await request.json();
	try {
		await prisma.subscriptions.create({
			data: { name, price, paid, notify, user_id: user.id, date, url },
		});
		return json('added', { status: 201 });
	} catch (error) {
		return json({ error, message: 'Request failed' }, { status: 500 });
	}
}