import { type PrismaClient } from '@prisma/client';
import { GoalSchema } from './schemas';
import { handleZodError } from '~/shared/lib/api-handler.server';

export async function getGoals(db: PrismaClient, userId: string) {
	return await db.goals.findMany({
		where: { user_id: userId },
		orderBy: { created_at: 'desc' },
	});
}

export async function createGoal(db: PrismaClient, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = GoalSchema.safeParse(data);

	if (!parsed.success) {
		return { success: false, errors: handleZodError(parsed.error) };
	}

	try {
		const goal = await db.goals.create({
			data: {
				user_id: userId,
				name: parsed.data.name,
				target_amount: parsed.data.target_amount,
				current_amount: parsed.data.current_amount || '0',
				deadline: parsed.data.deadline || null,
				status: parsed.data.status || 'IN_PROGRESS',
			},
		});
		return { success: true, data: goal };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function updateGoal(db: PrismaClient, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = GoalSchema.safeParse(data);

	if (!parsed.success) {
		return { success: false, errors: handleZodError(parsed.error) };
	}

	if (!parsed.data.id) {
		return { success: false, error: 'ID is required for updating' };
	}

	try {
		const goal = await db.goals.update({
			where: { id: parsed.data.id, user_id: userId },
			data: {
				name: parsed.data.name,
				target_amount: parsed.data.target_amount,
				current_amount: parsed.data.current_amount,
				deadline: parsed.data.deadline,
				status: parsed.data.status,
			},
		});
		return { success: true, data: goal };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function deleteGoal(db: PrismaClient, userId: string, id: string) {
	try {
		await db.goals.delete({
			where: { id, user_id: userId },
		});
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
