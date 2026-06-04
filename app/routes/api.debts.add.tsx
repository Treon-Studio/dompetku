import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { logger } from '~/lib/logger.server';

function generateRandomString(length = 6) {
	return Math.random().toString(36).substring(2, 2 + length);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const body = await request.json() as Record<string, unknown>;
	const { notes, name, friend_name, type, amount, date } = body;

	if (!name || !friend_name || !type || !amount || !date) {
		return json({ message: 'Missing required fields' }, { status: 400 });
	}

	try {
		// Find or create friend
		let friend = await db.friends.findUnique({
			where: {
				user_id_name: {
					user_id: user.id,
					name: String(friend_name),
				}
			}
		});

		if (!friend) {
			const baseSlug = String(friend_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
			const slug = `${baseSlug || 'teman'}-${generateRandomString(6)}`;
			friend = await db.friends.create({
				data: {
					name: String(friend_name),
					user_id: user.id,
					slug,
				}
			});
		}

		await db.debts.create({
			data: { 
				notes: notes ? String(notes) : null,
				name: String(name),
				type: String(type), // "I_OWE" or "OWES_ME"
				amount: String(amount),
				date: String(date),
				user_id: user.id,
				friend_id: friend.id,
				nameHash: String(name).toLowerCase()
			},
		});

		return json({ message: 'added' }, { status: 201 });
	} catch (error) {
		logger.error('Request failed', { error: String(error) });
		return json({ message: 'Request failed' }, { status: 500 });
	}
}
