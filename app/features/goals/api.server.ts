import { eq, and, desc } from 'drizzle-orm';
import type { DB } from '~/core/db.server';
import { goals } from '~/core/db/schema';
import { GoalSchema } from './schemas';

export async function getGoals(db: DB, userId: string) {
	return await db.select().from(goals).where(eq(goals.user_id, userId)).orderBy(desc(goals.created_at));
}

export async function createGoal(db: DB, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = GoalSchema.safeParse(data);

	if (!parsed.success) {
		return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
	}

	try {
		const [goal] = await db
			.insert(goals)
			.values({
				user_id: userId,
				name: parsed.data.name,
				target_amount: parsed.data.target_amount,
				current_amount: parsed.data.current_amount || '0',
				deadline: parsed.data.deadline || null,
				status: parsed.data.status || 'IN_PROGRESS',
			})
			.returning();
		return { success: true, data: goal };
	} catch (e: unknown) {
		const error = e as Error;
		return { success: false, error: error.message };
	}
}

export async function updateGoal(db: DB, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = GoalSchema.safeParse(data);

	if (!parsed.success) {
		return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
	}

	if (!parsed.data.id) {
		return { success: false, error: 'ID is required for updating' };
	}

	try {
		const [goal] = await db
			.update(goals)
			.set({
				name: parsed.data.name,
				target_amount: parsed.data.target_amount,
				current_amount: parsed.data.current_amount,
				deadline: parsed.data.deadline,
				status: parsed.data.status,
			})
			.where(and(eq(goals.id, parsed.data.id), eq(goals.user_id, userId)))
			.returning();
		return { success: true, data: goal };
	} catch (e: unknown) {
		const error = e as Error;
		return { success: false, error: error.message };
	}
}

export async function deleteGoal(db: DB, userId: string, id: string) {
	try {
		await db.delete(goals).where(and(eq(goals.id, id), eq(goals.user_id, userId)));
		return { success: true };
	} catch (e: unknown) {
		const error = e as Error;
		return { success: false, error: error.message };
	}
}
