import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { logger } from '~/lib/logger.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);

	const friends = await db.friends.findMany({
		where: { user_id: user.id },
		include: {
			debts: {
				orderBy: {
					created_at: 'desc',
				}
			}
		},
		orderBy: {
			updated_at: 'desc'
		}
	});

	return json(friends);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const body = await request.json() as Record<string, unknown>;
	const { id, status, name, amount, date, notes } = body;

	if (request.method === 'DELETE') {
		try {
			// Find the debt to get the friend_id
			const debt = await db.debts.findUnique({
				where: { id: String(id), user_id: user.id }
			});
			if (!debt) return json({ message: 'Not found' }, { status: 404 });

			await db.debts.delete({
				where: { id: String(id), user_id: user.id },
			});
			
			// Optional: delete friend if no more debts exist. We will keep them for now.

			return json({ message: 'deleted' });
		} catch (error) {
			logger.error('Delete failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (request.method === 'PUT') {
		const updateData: any = {};
		if (status) updateData.status = String(status);
		if (name) updateData.name = String(name);
		if (amount) updateData.amount = String(amount);
		if (date) updateData.date = String(date);
		if (notes !== undefined) updateData.notes = notes ? String(notes) : null;
		
		try {
			await db.debts.update({
				where: { id: String(id), user_id: user.id },
				data: updateData,
			});
			return json({ message: 'updated' });
		} catch (error) {
			logger.error('Update failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}
}
