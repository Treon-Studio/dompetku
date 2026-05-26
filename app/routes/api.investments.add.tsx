import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { validateRecordFields } from '~/lib/validate';
import { logger } from '~/lib/logger';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const body = await request.json() as Record<string, unknown>;
	const validationError = validateRecordFields(body);
	if (validationError) return validationError;
	const { notes, name, price, units, category, date } = body;
	try {
		await db.investments.create({
			data: { notes, name, price, units, category, user_id: user.id, date },
		});
		return json({ message: 'added' }, { status: 201 });
	} catch (error) {
		logger.error('Request failed', { error: String(error) });
		return json({ message: 'Request failed' }, { status: 500 });
	}
}
