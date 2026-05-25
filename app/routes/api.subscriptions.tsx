import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { requireUser } from '~/lib/auth.server';
import prisma from '~/lib/prisma';

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await requireUser(request);
	const { searchParams } = new URL(request.url);
	const from = searchParams.get('from') || '';
	const to = searchParams.get('to') || '';

	try {
		const where = {
			user_id: user.id,
			...(to && from && { date: { lte: to, gte: from } }),
		};

		if (!from && !to) {
			delete where.date;
		}

		const data = await prisma.subscriptions.findMany({
			where,
			orderBy: { updated_at: 'desc' },
			select: {
				name: true,
				price: true,
				paid: true,
				notify: true,
				id: true,
				date: true,
				created_at: true,
				updated_at: true,
			},
		});
		return json(data.sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date)));
	} catch (error) {
		return json({ error, message: 'Request failed' }, { status: 500 });
	}
}

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request);
	const { id } = await request.json();
	const method = request.method.toUpperCase();

	if (method === 'DELETE') {
		if (!id.length) {
			return json('Invalid request', { status: 400 });
		}
		try {
			await prisma.subscriptions.delete({
				where: { id: id[0] },
			});
			return json('deleted', { status: 200 });
		} catch (error) {
			return json({ error, message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'PUT') {
		const { name, price, paid, notify, id, date } = await request.json();
		if (!id) {
			return json('Invalid request', { status: 400 });
		}
		try {
			await prisma.subscriptions.update({
				data: { name, price, paid, notify, date },
				where: { id },
			});
			return json('updated', { status: 200 });
		} catch (error) {
			return json({ error, message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method not allowed' }, { status: 405 });
}