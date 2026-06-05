import { json } from '@remix-run/cloudflare';
import { eq, and, gte, lte, inArray, desc } from 'drizzle-orm';
import { DB_QUERY_LIMIT } from '~/shared/constants/app';
import { logger } from '~/core/logger.server';
import { z } from 'zod';
import type { DB } from '~/core/db.server';
import * as schema from '~/core/db/schema';

type TableName = 'expenses' | 'income' | 'investments' | 'subscriptions';

function getTable(modelName: TableName) {
	const tableMap = {
		expenses: schema.expenses,
		income: schema.income,
		investments: schema.investments,
		subscriptions: schema.subscriptions,
	};
	return tableMap[modelName];
}

export async function handleGetRecords(db: DB, modelName: TableName, user: any, request: Request, _selectFields?: any) {
	const { searchParams } = new URL(request.url);
	const from = searchParams.get('from') || '';
	const to = searchParams.get('to') || '';
	const categories = searchParams.get('categories') || '';

	try {
		const table = getTable(modelName) as any;
		const conditions: any[] = [eq(table.user_id, user.id)];

		if (from && to) {
			conditions.push(gte(table.date, from));
			conditions.push(lte(table.date, to));
		}

		if (categories) {
			const categoryList = categories.split(',').filter(Boolean);
			if (categoryList.length > 0) {
				conditions.push(inArray(table.category, categoryList));
			}
		}

		const data = await db
			.select()
			.from(table)
			.where(and(...conditions))
			.orderBy(desc(table.updated_at))
			.limit(DB_QUERY_LIMIT);

		return json(data.sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date)));
	} catch (error) {
		logger.error(`[GET ${modelName}] Request failed`, { error: String(error) });
		return json({ message: 'Request failed' }, { status: 500 });
	}
}

export async function handleActionRecords(db: DB, modelName: TableName, user: any, request: Request, schema_: z.ZodSchema) {
	const method = request.method.toUpperCase();
	const body = await request.json() as Record<string, unknown>;
	const table = getTable(modelName) as any;

	if (method === 'DELETE') {
		const { id } = body;
		if (!Array.isArray(id) || id.length === 0) {
			return json({ message: 'Invalid request' }, { status: 400 });
		}
		const [record] = await db.select().from(table).where(eq(table.id, id[0])).limit(1);
		if (!record || record.user_id !== user.id) return json({ message: 'Not found' }, { status: 404 });
		try {
			await db.delete(table).where(eq(table.id, id[0]));
			return json({ message: 'deleted' }, { status: 200 });
		} catch (error) {
			logger.error(`[DELETE ${modelName}] Request failed`, { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'POST') {
		const result = schema_.safeParse(body);
		if (!result.success) {
			const error = result.error.issues[0];
			return json({ message: error.message }, { status: 400 });
		}

		const data: any = { user_id: user.id, ...result.data };

		try {
			await db.insert(table).values(data);
			return json({ message: 'created' }, { status: 201 });
		} catch (error) {
			logger.error(`[POST ${modelName}] Request failed`, { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'PUT') {
		const { id } = body;
		if (!id) return json({ message: 'Invalid request' }, { status: 400 });

		const result = schema_.safeParse(body);
		if (!result.success) {
			const error = result.error.issues[0];
			return json({ message: error.message }, { status: 400 });
		}

		const [record] = await db.select().from(table).where(eq(table.id, id)).limit(1);
		if (!record || record.user_id !== user.id) return json({ message: 'Not found' }, { status: 404 });

		const data: any = { ...result.data };
		delete data.id;

		try {
			await db.update(table).set(data).where(eq(table.id, id));
			return json({ message: 'updated' }, { status: 200 });
		} catch (error) {
			logger.error(`[PUT ${modelName}] Request failed`, { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method not allowed' }, { status: 405 });
}

export function handleZodError(error: any) {
	return json({ message: error.issues?.[0]?.message || 'Validation error' }, { status: 400 });
}
