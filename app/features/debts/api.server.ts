import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { eq, and, desc } from 'drizzle-orm';

import { requireUser } from '~/features/auth/api.server';
import { createDbClient } from '~/core/db.server';
import { logger } from '~/core/logger.server';
import { DebtSchema } from './schemas';
import { friends, debts } from '~/core/db/schema';

export async function debtsLoader({ request, context }: LoaderFunctionArgs) {
	const db = createDbClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);

	const friendsList = await db.select().from(friends).where(eq(friends.user_id, user.id)).orderBy(desc(friends.updated_at));

	const result = await Promise.all(
		friendsList.map(async (friend) => {
			const debtsList = await db.select().from(debts)
				.where(eq(debts.friend_id, friend.id))
				.orderBy(desc(debts.date), desc(debts.created_at));
			return { ...friend, debts: debtsList };
		})
	);

	return json(result);
}

function generateRandomString(length = 6) {
	return Math.random().toString(36).substring(2, 2 + length);
}

export async function debtsAction({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const body = await request.json() as Record<string, unknown>;
	const { id } = body;

	if (request.method === 'POST') {
		const result = DebtSchema.safeParse(body);
		if (!result.success) {
			console.error("POST Validation Error:", result.error);
			return json({ message: result.error?.issues?.[0]?.message || 'Validation error' }, { status: 400 });
		}

		const { name, friend_name, type, amount, date, notes, linked_debt_id } = result.data;

		try {
			const [existingFriend] = await db.select().from(friends)
				.where(and(eq(friends.user_id, user.id), eq(friends.name, String(friend_name))))
				.limit(1);

			let friend = existingFriend;
			if (!friend) {
				const baseSlug = String(friend_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
				const slug = `${baseSlug || 'teman'}-${generateRandomString(6)}`;
				const [newFriend] = await db.insert(friends).values({
					name: String(friend_name), user_id: user.id, slug,
				}).returning();
				friend = newFriend;
			}

			await db.insert(debts).values({
				notes: notes ? String(notes) : null,
				name: String(name),
				type: String(type),
				amount: String(amount),
				date: String(date),
				user_id: user.id,
				friend_id: friend.id,
				nameHash: String(name).toLowerCase(),
				status: linked_debt_id ? 'PAID' : 'UNPAID',
			});

			if (linked_debt_id) {
				await db.update(debts).set({ status: 'PAID' })
					.where(and(eq(debts.id, String(linked_debt_id)), eq(debts.user_id, user.id)));
			}

			return json({ message: 'added' }, { status: 201 });
		} catch (error) {
			logger.error('Request failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (request.method === 'DELETE') {
		try {
			const [debt] = await db.select().from(debts)
				.where(and(eq(debts.id, String(id)), eq(debts.user_id, user.id)))
				.limit(1);
			if (!debt) return json({ message: 'Not found' }, { status: 404 });

			await db.delete(debts).where(and(eq(debts.id, String(id)), eq(debts.user_id, user.id)));
			return json({ message: 'deleted' });
		} catch (error) {
			logger.error('Delete failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (request.method === 'PUT') {
		const result = DebtSchema.partial().safeParse(body);
		if (!result.success) {
			console.error("PUT Validation Error:", result.error);
			return json({ message: result.error?.issues?.[0]?.message || 'Validation error' }, { status: 400 });
		}

		const { status, name, amount, date, notes } = result.data;
		const updateData: any = {};
		if (status) updateData.status = String(status);
		if (name) updateData.name = String(name);
		if (amount) updateData.amount = String(amount);
		if (date) updateData.date = String(date);
		if (notes !== undefined) updateData.notes = notes ? String(notes) : null;

		try {
			await db.update(debts).set(updateData)
				.where(and(eq(debts.id, String(id)), eq(debts.user_id, user.id)));
			return json({ message: 'updated' });
		} catch (error) {
			logger.error('Update failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}
}

export async function friendsAction({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const body = await request.json() as Record<string, unknown>;
	const { id, slug, is_public } = body;

	if (request.method === 'PUT') {
		if (!id) return json({ message: 'Missing friend ID' }, { status: 400 });

		const updateData: any = {};

		if (slug !== undefined) {
			const sanitizedSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
			if (!sanitizedSlug) return json({ message: 'Invalid slug format' }, { status: 400 });

			const [existing] = await db.select().from(friends).where(eq(friends.slug, sanitizedSlug)).limit(1);
			if (existing && existing.id !== id) {
				return json({ message: 'Slug already taken' }, { status: 409 });
			}
			updateData.slug = sanitizedSlug;
		}

		if (is_public !== undefined) updateData.is_public = Boolean(is_public);

		try {
			await db.update(friends).set(updateData)
				.where(and(eq(friends.id, String(id)), eq(friends.user_id, user.id)));
			return json({ message: 'updated' });
		} catch (error) {
			logger.error('Friend update failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method Not Allowed' }, { status: 405 });
}
