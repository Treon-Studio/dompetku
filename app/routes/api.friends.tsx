import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { logger } from '~/lib/logger.server';

export async function action({ request, context }: ActionFunctionArgs) {
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
