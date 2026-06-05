import { addYears } from 'date-fns';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, isPhone, normalizePhone } from '~/features/auth/api.server';
import { isEmail, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '~/shared/constants/validation';
import type { DB } from '~/core/db.server';
import { users, sessions, feedbacks, expenses, income, investments, subscriptions } from '~/core/db/schema';
import { sql } from 'drizzle-orm';

export async function getUserProfile(userId: string, db: DB) {
	const [data] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	if (!data) return null;

	const isPremiumPlan = data.order_status === 'paid' && data.plan_status === 'premium';
	const isPremiumPlanEnded =
		isPremiumPlan && data.billing_start_date && new Date() > addYears(new Date(data.billing_start_date), 1);
	const isPremium = isPremiumPlan && !isPremiumPlanEnded;

	return { ...data, isPremium, isPremiumPlanEnded };
}

export async function updateUserProfile(userId: string, body: any, currentUserPasswordHash: string, db: DB) {
	const updateData: Record<string, any> = {};

	if (body.currency !== undefined) updateData.currency = body.currency;
	if (body.locale !== undefined) updateData.locale = body.locale;

	if (body.email !== undefined) {
		if (body.email && !isEmail(body.email)) {
			throw new Error('Please enter a valid email address');
		}
		updateData.email = body.email || null;
	}

	if (body.phone !== undefined) {
		if (body.phone && !isPhone(body.phone)) {
			throw new Error('Please enter a valid phone number');
		}
		updateData.phone = body.phone ? normalizePhone(body.phone) : null;
	}

	if (body.currentPassword && body.newPassword) {
		const valid = await verifyPassword(body.currentPassword, currentUserPasswordHash);
		if (!valid) {
			throw new Error('Current password is incorrect');
		}
		if (body.newPassword.length < PASSWORD_MIN_LENGTH || body.newPassword.length > PASSWORD_MAX_LENGTH) {
			throw new Error(`Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`);
		}
		updateData.password = await hashPassword(body.newPassword);
	}

	if (Object.keys(updateData).length === 0) {
		throw new Error('No fields to update');
	}

	await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function deleteUserAndData(userId: string, db: DB) {
	await db.delete(sessions).where(eq(sessions.user_id, userId));
	await db.delete(feedbacks).where(eq(feedbacks.user_id, userId));
	await db.delete(expenses).where(eq(expenses.user_id, userId));
	await db.delete(income).where(eq(income.user_id, userId));
	await db.delete(investments).where(eq(investments.user_id, userId));
	await db.delete(subscriptions).where(eq(subscriptions.user_id, userId));
	await db.delete(users).where(eq(users.id, userId));
}

export async function upgradeUserPlan(userId: string, body: any, db: DB) {
	const { order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number } = body;

	const requiredFields = {
		order_identifier,
		billing_start_date,
		plan_status,
		order_status,
		order_store_id,
		order_number,
	};
	for (const [key, value] of Object.entries(requiredFields)) {
		if (typeof value !== 'string' || value.length === 0) {
			throw new Error(`Invalid or missing field: ${key}`);
		}
	}

	const validPlanStatuses = ['basic', 'premium'] as const;
	const validOrderStatuses = ['pending', 'paid', 'failed'] as const;
	if (!validPlanStatuses.includes(plan_status as any)) throw new Error('Invalid plan_status');
	if (!validOrderStatuses.includes(order_status as any)) throw new Error('Invalid order_status');

	await db
		.update(users)
		.set({ order_identifier, billing_start_date, plan_status, order_status, order_store_id, order_number })
		.where(eq(users.id, userId));
}

export async function incrementUserUsage(userId: string, db: DB) {
	await db
		.update(users)
		.set({ usage: sql`${users.usage} + 1` })
		.where(eq(users.id, userId));
}
