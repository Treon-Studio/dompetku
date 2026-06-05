import { eq, and, desc } from 'drizzle-orm';
import type { DB } from '~/core/db.server';
import { budgets } from '~/core/db/schema';
import { BudgetSchema } from './schemas';

export async function getBudgets(db: DB, userId: string, month: string) {
	return await db
		.select()
		.from(budgets)
		.where(and(eq(budgets.user_id, userId), eq(budgets.month, month)))
		.orderBy(desc(budgets.created_at));
}

export async function createBudget(db: DB, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = BudgetSchema.safeParse(data);

	if (!parsed.success) {
		return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
	}

	try {
		// Upsert: check if exists first
		const [existing] = await db
			.select()
			.from(budgets)
			.where(
				and(
					eq(budgets.user_id, userId),
					eq(budgets.category, parsed.data.category),
					eq(budgets.month, parsed.data.month)
				)
			)
			.limit(1);

		let budget;
		if (existing) {
			const [updated] = await db
				.update(budgets)
				.set({ amount: parsed.data.amount })
				.where(eq(budgets.id, existing.id))
				.returning();
			budget = updated;
		} else {
			const [created] = await db
				.insert(budgets)
				.values({
					user_id: userId,
					category: parsed.data.category,
					amount: parsed.data.amount,
					month: parsed.data.month,
				})
				.returning();
			budget = created;
		}
		return { success: true, data: budget };
	} catch (e: unknown) {
		const error = e as Error;
		return { success: false, error: error.message };
	}
}

export async function updateBudget(db: DB, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = BudgetSchema.safeParse(data);

	if (!parsed.success) {
		return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
	}

	if (!parsed.data.id) {
		return { success: false, error: 'ID is required for updating' };
	}

	try {
		const [budget] = await db
			.update(budgets)
			.set({
				category: parsed.data.category,
				amount: parsed.data.amount,
				month: parsed.data.month,
			})
			.where(and(eq(budgets.id, parsed.data.id), eq(budgets.user_id, userId)))
			.returning();
		return { success: true, data: budget };
	} catch (e: unknown) {
		const error = e as Error;
		return { success: false, error: error.message };
	}
}

export async function deleteBudget(db: DB, userId: string, id: string) {
	try {
		await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.user_id, userId)));
		return { success: true };
	} catch (e: unknown) {
		const error = e as Error;
		return { success: false, error: error.message };
	}
}
