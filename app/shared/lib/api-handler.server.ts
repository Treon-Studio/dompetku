import { json } from "@remix-run/cloudflare";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { z } from "zod";
import * as schema from "~/core/db/schema";
import type { DB } from "~/core/db.server";
import { logger } from "~/core/logger.server";
import { DB_QUERY_LIMIT } from "~/shared/constants/app";

type TableName = "expenses" | "income" | "investments" | "subscriptions";

export async function handleGetRecords(
	db: DB,
	modelName: TableName,
	user: schema.User,
	request: Request,
	_selectFields?: any,
) {
	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from") || "";
	const to = searchParams.get("to") || "";
	const categories = searchParams.get("categories") || "";

	try {
		// biome-ignore lint/performance/noDynamicNamespaceImportAccess: Intentional dynamic access for generic handling
		const table = schema[modelName];
		const conditions = [eq(table.user_id, user.id)];

		if (from && to && "date" in table) {
			conditions.push(gte(table.date as any, from));
			conditions.push(lte(table.date as any, to));
		}

		if (categories && "category" in table) {
			const categoryList = categories.split(",").filter(Boolean);
			if (categoryList.length > 0) {
				conditions.push(inArray(table.category as any, categoryList));
			}
		}

		const data = await db
			.select()
			.from(table)
			.where(and(...conditions))
			.orderBy(desc(table.updated_at))
			.limit(DB_QUERY_LIMIT);

		return json(
			data.sort((a, b) => {
				const dateA = "date" in a ? Date.parse(a.date as string) : 0;
				const dateB = "date" in b ? Date.parse(b.date as string) : 0;
				return dateB - dateA;
			}),
		);
	} catch (error) {
		logger.error(`[GET ${modelName}] Request failed`, { error: String(error) });
		return json({ message: "Request failed" }, { status: 500 });
	}
}

export async function handleActionRecords(
	db: DB,
	modelName: TableName,
	user: schema.User,
	request: Request,
	schema_: z.ZodSchema,
) {
	const method = request.method.toUpperCase();
	const body = (await request.json()) as Record<string, any>;
	// biome-ignore lint/performance/noDynamicNamespaceImportAccess: Intentional dynamic access for generic handling
	const table = schema[modelName];

	if (method === "DELETE") {
		const { id } = body;
		if (!Array.isArray(id) || id.length === 0) {
			return json({ message: "Invalid request" }, { status: 400 });
		}
		const [record] = await db
			.select()
			.from(table)
			.where(eq(table.id, id[0] as any))
			.limit(1);
		if (!record || record.user_id !== user.id) return json({ message: "Not found" }, { status: 404 });
		try {
			await db.delete(table).where(eq(table.id, id[0] as any));
			return json({ message: "deleted" }, { status: 200 });
		} catch (error) {
			logger.error(`[DELETE ${modelName}] Request failed`, { error: String(error) });
			return json({ message: "Request failed" }, { status: 500 });
		}
	}

	if (method === "POST") {
		const result = schema_.safeParse(body);
		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			return json({ message: "Validation failed", errors }, { status: 400 });
		}

		const data = { user_id: user.id, ...(result.data as object) };

		try {
			await db.insert(table).values(data as any);
			return json({ message: "created" }, { status: 201 });
		} catch (error) {
			logger.error(`[POST ${modelName}] Request failed`, { error: String(error) });
			return json({ message: "Request failed" }, { status: 500 });
		}
	}

	if (method === "PUT") {
		const { id } = body;
		if (!id) return json({ message: "Invalid request" }, { status: 400 });

		const result = schema_.safeParse(body);
		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			return json({ message: "Validation failed", errors }, { status: 400 });
		}

		const [record] = await db
			.select()
			.from(table)
			.where(eq(table.id, id as any))
			.limit(1);
		if (!record || record.user_id !== user.id) return json({ message: "Not found" }, { status: 404 });

		const data = { ...(result.data as object) };
		delete (data as { id?: string }).id;

		try {
			await db
				.update(table)
				.set(data as any)
				.where(eq(table.id, id as any));
			return json({ message: "updated" }, { status: 200 });
		} catch (error) {
			logger.error(`[PUT ${modelName}] Request failed`, { error: String(error) });
			return json({ message: "Request failed" }, { status: 500 });
		}
	}

	return json({ message: "Method not allowed" }, { status: 405 });
}

export function handleZodError(error: z.ZodError) {
	return json({ message: error.issues?.[0]?.message || "Validation error" }, { status: 400 });
}

