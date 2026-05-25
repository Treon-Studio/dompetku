import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const { searchParams } = new URL(request.url);
	const from = searchParams.get('from') || '';
	const to = searchParams.get('to') || '';
	const categories: any = searchParams.get('categories') || '';
	const OR = { OR: categories?.split(',').map((category: any) => ({ category: { contains: category } })) };

	try {
		const where = {
			user_id: user.id,
			...(categories.length && OR),
			...(to && from && { date: { lte: to, gte: from } }),
		};

		if (!from && !to) {
			delete where.date;
		}

		const data = await db.expenses.findMany({
			where,
			orderBy: { updated_at: 'desc' },
			select: {
				notes: true,
				name: true,
				price: true,
				category: true,
				paid_via: true,
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

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const { id } = await request.json();
	const method = request.method.toUpperCase();

	if (method === 'DELETE') {
		if (!id.length) {
			return json('Invalid request', { status: 400 });
		}
		try {
			await db.expenses.delete({
				where: { id: id[0] },
			});
			return json('deleted', { status: 200 });
		} catch (error) {
			return json({ error, message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'PUT') {
		const { notes, name, price, category, id, date, paid_via } = await request.json();
		if (!id) {
			return json('Invalid request', { status: 400 });
		}
		try {
			await db.expenses.update({
				data: { notes, name, price, date, paid_via, category },
				where: { id },
			});
			return json('updated', { status: 200 });
		} catch (error) {
			return json({ error, message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method not allowed' }, { status: 405 });
}
