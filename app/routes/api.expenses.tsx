import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { DB_QUERY_LIMIT } from '~/constants/app';
import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { validateRecordFields } from '~/lib/validate';
import { logger } from '~/lib/logger';

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
			take: DB_QUERY_LIMIT,
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
		logger.error('Request failed', { error: String(error) });
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
		const record = await db.expenses.findUnique({ where: { id: id[0] } });
		if (!record || record.user_id !== user.id) return json({ message: 'Not found' }, { status: 404 });
		try {
			await db.expenses.delete({
				where: { id: id[0] },
			});
			return json({ message: 'deleted' }, { status: 200 });
		} catch (error) {
			logger.error('Request failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'PUT') {
		const body = await request.json() as Record<string, unknown>;
		const { id, notes, name, price, category, date, paid_via } = body;
		if (!id) return json({ message: 'Invalid request' }, { status: 400 });
		const validationError = validateRecordFields(body);
		if (validationError) return validationError;
		const record = await db.expenses.findUnique({ where: { id } });
		if (!record || record.user_id !== user.id) return json({ message: 'Not found' }, { status: 404 });
		try {
			await db.expenses.update({
				data: { notes, name, price, date, paid_via, category },
				where: { id },
			});
			return json({ message: 'updated' }, { status: 200 });
		} catch (error) {
			logger.error('Request failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method not allowed' }, { status: 405 });
}
