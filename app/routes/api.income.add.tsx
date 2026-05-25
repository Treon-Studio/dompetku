import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { requireUser } from '~/lib/auth.server';
import prisma from '~/lib/prisma';

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request);
	const { notes, name, price, category, date } = await request.json();
	try {
		await prisma.income.create({
			data: { notes, name, price, category, user_id: user.id, date },
		});
		return json('added', { status: 201 });
	} catch (error) {
		return json({ error, message: 'Request failed' }, { status: 500 });
	}
}