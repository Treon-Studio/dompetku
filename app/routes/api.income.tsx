import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { DB_QUERY_LIMIT } from '~/constants/app';
import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { validateRecordFields } from '~/lib/validate';

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

		const data = await db.income.findMany({
			where,
			orderBy: { updated_at: 'desc' },
			take: DB_QUERY_LIMIT,
			select: {
				notes: true,
				name: true,
				price: true,
				category: true,
				id: true,
				date: true,
				created_at: true,
				updated_at: true,
			},
		});
		return json(data.sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date)));
	} catch (error) {
		console.error('Request failed:', error);
		return json({ message: 'Request failed' }, { status: 500 });
	}
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const { id } = await request.json();
	const method = request.method.toUpperCase();

	if (method === 'DELETE') {
		if (!Array.isArray(id) || id.length === 0) {
			return json({ message: 'Invalid request' }, { status: 400 });
		}
		const record = await db.income.findUnique({ where: { id: id[0] } });
		if (!record || record.user_id !== user.id) return json({ message: 'Not found' }, { status: 404 });
		try {
			await db.income.delete({
				where: { id: id[0] },
			});
			return json({ message: 'deleted' }, { status: 200 });
		} catch (error) {
			console.error('Request failed:', error);
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'PUT') {
		const body = await request.json() as Record<string, unknown>;
		const { id, notes, name, price, category, date } = body;
		if (!id) return json({ message: 'Invalid request' }, { status: 400 });
		const validationError = validateRecordFields(body);
		if (validationError) return validationError;
		const record = await db.income.findUnique({ where: { id } });
		if (!record || record.user_id !== user.id) return json({ message: 'Not found' }, { status: 404 });
		try {
			await db.income.update({
				data: { notes, name, price, date, category },
				where: { id },
			});
			return json({ message: 'updated' }, { status: 200 });
		} catch (error) {
			console.error('Request failed:', error);
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method not allowed' }, { status: 405 });
}
