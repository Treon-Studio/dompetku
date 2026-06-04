import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { addYears } from 'date-fns';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { hashPassword, verifyPassword, isPhone, normalizePhone } from '~/lib/auth.server';
import { isEmail, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '~/constants/validation';
import { logger } from '~/lib/logger.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);

	try {
		const data = await db.users.findUnique({
			where: { id: user.id },
			select: {
				currency: true,
				locale: true,
				billing_start_date: true,
				trial_start_date: true,
				order_status: true,
				usage: true,
				email: true,
				phone: true,
				plan_status: true,
				new_signup_email: true,
				created_at: true,
			},
		});
		const isPremiumPlan = data?.order_status === 'paid' && data?.plan_status === 'premium';
		const isPremiumPlanEnded =
			isPremiumPlan && data?.billing_start_date && new Date() > addYears(new Date(data.billing_start_date), 1);
		const isPremium = isPremiumPlan && !isPremiumPlanEnded;

		return json({ ...data, isPremium, isPremiumPlanEnded }, { status: 200 });
	} catch (error) {
		logger.error('Request failed', { error: String(error) });
		return json({ message: 'Request failed' }, { status: 500 });
	}
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const method = request.method.toUpperCase();

	if (method === 'PATCH') {
		const body = await request.json();
		const updateData: Record<string, any> = {};

		if (body.currency !== undefined) updateData.currency = body.currency;
		if (body.locale !== undefined) updateData.locale = body.locale;

		if (body.email !== undefined) {
			if (body.email && !isEmail(body.email)) {
				return json({ message: 'Please enter a valid email address' }, { status: 400 });
			}
			updateData.email = body.email || null;
		}

		if (body.phone !== undefined) {
			if (body.phone && !isPhone(body.phone)) {
				return json({ message: 'Please enter a valid phone number' }, { status: 400 });
			}
			updateData.phone = body.phone ? normalizePhone(body.phone) : null;
		}

		if (body.currentPassword && body.newPassword) {
			const valid = await verifyPassword(body.currentPassword, user.password);
			if (!valid) {
				return json({ message: 'Current password is incorrect' }, { status: 400 });
			}
			if (body.newPassword.length < PASSWORD_MIN_LENGTH || body.newPassword.length > PASSWORD_MAX_LENGTH) {
				return json({ message: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters` }, { status: 400 });
			}
			updateData.password = await hashPassword(body.newPassword);
		}

		if (Object.keys(updateData).length === 0) {
			return json({ message: 'No fields to update' }, { status: 400 });
		}

		try {
			await db.users.update({ data: updateData, where: { id: user.id } });
			return json({ message: 'Updated' });
		} catch (error) {
			logger.error('Request failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'DELETE') {
		try {
			await db.$transaction([
				db.sessions.deleteMany({ where: { user_id: user.id } }),
				db.feedbacks.deleteMany({ where: { user_id: user.id } }),
				db.expenses.deleteMany({ where: { user_id: user.id } }),
				db.income.deleteMany({ where: { user_id: user.id } }),
				db.investments.deleteMany({ where: { user_id: user.id } }),
				db.subscriptions.deleteMany({ where: { user_id: user.id } }),
				db.users.delete({ where: { id: user.id } }),
			]);
			return json({ message: 'Deleted' });
		} catch (error) {
			logger.error('Request failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method not allowed' }, { status: 405 });
}
