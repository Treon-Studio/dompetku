import { json } from '@remix-run/cloudflare';
import { DB_QUERY_LIMIT } from '~/constants/app';
import { logger } from '~/lib/logger.server';
import { validateRecordFields } from '~/lib/validate';

export async function handleGetRecords(db: any, modelName: string, user: any, request: Request, selectFields?: any) {
	const { searchParams } = new URL(request.url);
	const from = searchParams.get('from') || '';
	const to = searchParams.get('to') || '';
	const categories: any = searchParams.get('categories') || '';
	const OR = { OR: categories?.split(',').map((category: any) => ({ category: { contains: category } })) };

	try {
		const where: any = {
			user_id: user.id,
			...(categories.length && OR),
			...(to && from && { date: { lte: to, gte: from } }),
		};

		if (!from && !to) {
			delete where.date;
		}

		const data = await db[modelName].findMany({
			where,
			orderBy: { updated_at: 'desc' },
			take: DB_QUERY_LIMIT,
			...(selectFields && { select: selectFields }),
		});
		return json(data.sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date)));
	} catch (error) {
		logger.error(`[GET ${modelName}] Request failed`, { error: String(error) });
		return json({ message: 'Request failed' }, { status: 500 });
	}
}

export async function handleActionRecords(db: any, modelName: string, user: any, request: Request, allowedFields: string[]) {
	const method = request.method.toUpperCase();
	const body = await request.json() as Record<string, unknown>;

	if (method === 'DELETE') {
		const { id } = body;
		if (!Array.isArray(id) || id.length === 0) {
			return json({ message: 'Invalid request' }, { status: 400 });
		}
		const record = await db[modelName].findUnique({ where: { id: id[0] } });
		if (!record || record.user_id !== user.id) return json({ message: 'Not found' }, { status: 404 });
		try {
			await db[modelName].delete({
				where: { id: id[0] },
			});
			return json({ message: 'deleted' }, { status: 200 });
		} catch (error) {
			logger.error(`[DELETE ${modelName}] Request failed`, { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'POST') {
		const validationError = validateRecordFields(body);
		if (validationError) return validationError;
		
		const data: any = { user_id: user.id };
		allowedFields.forEach((field) => {
			if (body[field] !== undefined) data[field] = body[field];
		});

		try {
			await db[modelName].create({ data });
			return json({ message: 'created' }, { status: 201 });
		} catch (error) {
			logger.error(`[POST ${modelName}] Request failed`, { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'PUT') {
		const { id } = body;
		if (!id) return json({ message: 'Invalid request' }, { status: 400 });
		
		const validationError = validateRecordFields(body);
		if (validationError) return validationError;
		
		const record = await db[modelName].findUnique({ where: { id } });
		if (!record || record.user_id !== user.id) return json({ message: 'Not found' }, { status: 404 });
		
		const data: any = {};
		allowedFields.forEach((field) => {
			if (body[field] !== undefined) data[field] = body[field];
		});

		try {
			await db[modelName].update({
				data,
				where: { id },
			});
			return json({ message: 'updated' }, { status: 200 });
		} catch (error) {
			logger.error(`[PUT ${modelName}] Request failed`, { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method not allowed' }, { status: 405 });
}
