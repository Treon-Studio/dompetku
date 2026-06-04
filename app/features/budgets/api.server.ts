import { type PrismaClient } from '@prisma/client';
import { BudgetSchema } from './schemas';
import { handleZodError } from '~/shared/lib/api-handler.server';

export async function getBudgets(db: PrismaClient, userId: string, month: string) {
	return await db.budgets.findMany({
		where: { user_id: userId, month },
		orderBy: { created_at: 'desc' },
	});
}

export async function createBudget(db: PrismaClient, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = BudgetSchema.safeParse(data);

	if (!parsed.success) {
		return { success: false, errors: handleZodError(parsed.error) };
	}

	try {
		const budget = await db.budgets.upsert({
			where: {
				user_id_category_month: {
					user_id: userId,
					category: parsed.data.category,
					month: parsed.data.month,
				}
			},
			update: {
				amount: parsed.data.amount,
			},
			create: {
				user_id: userId,
				category: parsed.data.category,
				amount: parsed.data.amount,
				month: parsed.data.month,
			},
		});
		return { success: true, data: budget };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function updateBudget(db: PrismaClient, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = BudgetSchema.safeParse(data);

	if (!parsed.success) {
		return { success: false, errors: handleZodError(parsed.error) };
	}

	if (!parsed.data.id) {
		return { success: false, error: 'ID is required for updating' };
	}

	try {
		const budget = await db.budgets.update({
			where: { id: parsed.data.id, user_id: userId },
			data: {
				category: parsed.data.category,
				amount: parsed.data.amount,
				month: parsed.data.month,
			},
		});
		return { success: true, data: budget };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function deleteBudget(db: PrismaClient, userId: string, id: string) {
	try {
		await db.budgets.delete({
			where: { id, user_id: userId },
		});
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
