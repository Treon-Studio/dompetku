import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	try {
		await db.users.update({ data: { usage: { increment: 1 } }, where: { id: user.id } });
		return json('Done');
	} catch (error: any) {
		return json({ message: String(error) || 'Error' }, { status: 500 });
	}
}
