import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { requireUser } from '~/lib/auth.server';
import prisma from '~/lib/prisma';

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request);
	try {
		await prisma.users.update({ data: { usage: { increment: 1 } }, where: { id: user.id } });
		return json('Done');
	} catch (error: any) {
		return json({ message: String(error) || 'Error' }, { status: 500 });
	}
}