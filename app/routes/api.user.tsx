import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { addYears } from 'date-fns';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';

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
			},
		});
		const isPremiumPlan = data?.order_status === 'paid' && data?.plan_status === 'premium';
		const isPremiumPlanEnded =
			isPremiumPlan && data?.billing_start_date && new Date() > addYears(new Date(data.billing_start_date), 1);
		const isPremium = isPremiumPlan && !isPremiumPlanEnded;

		return json({ ...data, isPremium, isPremiumPlanEnded }, { status: 200 });
	} catch (error) {
		return json({ error, message: 'Request failed' }, { status: 500 });
	}
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const method = request.method.toUpperCase();

	if (method === 'PATCH') {
		const { currency, locale } = await request.json();
		try {
			await db.users.update({ data: { currency, locale }, where: { id: user.id } });
			return json('Updated');
		} catch (error) {
			return json({ error, message: 'Request failed' }, { status: 500 });
		}
	}

	if (method === 'DELETE') {
		try {
			await db.sessions.deleteMany({ where: { user_id: user.id } });
			await db.feedbacks.deleteMany({ where: { user_id: user.id } });
			await db.expenses.deleteMany({ where: { user_id: user.id } });
			await db.income.deleteMany({ where: { user_id: user.id } });
			await db.investments.deleteMany({ where: { user_id: user.id } });
			await db.subscriptions.deleteMany({ where: { user_id: user.id } });
			await db.users.delete({ where: { id: user.id } });
			return json('Deleted');
		} catch (error) {
			return json({ error, message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method not allowed' }, { status: 405 });
}
