import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/features/auth/api.server';
import { createPrismaClient } from '~/core/db.server';
import { logger } from '~/core/logger.server';
import { DebtSchema } from './schemas';

export async function debtsLoader({ request, context }: LoaderFunctionArgs) {
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

function generateRandomString(length = 6) {
	return Math.random().toString(36).substring(2, 2 + length);
}

export async function debtsAction({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const body = await request.json() as Record<string, unknown>;
	const { id, status, name, amount, date, notes, friend_name, type } = body;

	if (request.method === 'POST') {
		const result = DebtSchema.safeParse(body);
		if (!result.success) {
			const error = result.error.errors[0];
			return json({ message: error.message }, { status: 400 });
		}
		
		const { name, friend_name, type, amount, date, notes } = result.data;

		try {
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
					type: String(type),
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

	if (request.method === 'DELETE') {
		try {
			const debt = await db.debts.findUnique({
				where: { id: String(id), user_id: user.id }
			});
			if (!debt) return json({ message: 'Not found' }, { status: 404 });

			await db.debts.delete({
				where: { id: String(id), user_id: user.id },
			});
			return json({ message: 'deleted' });
		} catch (error) {
			logger.error('Delete failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	if (request.method === 'PUT') {
		const result = DebtSchema.safeParse(body);
		if (!result.success) {
			const error = result.error.errors[0];
			return json({ message: error.message }, { status: 400 });
		}
		
		const { status, name, amount, date, notes } = result.data;
		
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

export async function friendsAction({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const body = await request.json() as Record<string, unknown>;
	const { id, slug, is_public } = body;

	if (request.method === 'PUT') {
		if (!id) return json({ message: 'Missing friend ID' }, { status: 400 });

		const updateData: any = {};
		
		if (slug !== undefined) {
			const sanitizedSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
			if (!sanitizedSlug) return json({ message: 'Invalid slug format' }, { status: 400 });
			
			// Check if slug is taken by someone else
			const existing = await db.friends.findUnique({
				where: { slug: sanitizedSlug }
			});
			if (existing && existing.id !== id) {
				return json({ message: 'Slug already taken' }, { status: 409 });
			}
			updateData.slug = sanitizedSlug;
		}

		if (is_public !== undefined) {
			updateData.is_public = Boolean(is_public);
		}
		
		try {
			await db.friends.update({
				where: { id: String(id), user_id: user.id },
				data: updateData,
			});
			return json({ message: 'updated' });
		} catch (error) {
			logger.error('Friend update failed', { error: String(error) });
			return json({ message: 'Request failed' }, { status: 500 });
		}
	}

	return json({ message: 'Method Not Allowed' }, { status: 405 });
}
