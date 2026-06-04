import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { signOut } from '~/features/auth/api.server';
import { createPrismaClient } from '~/core/db.server';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	return signOut(request, db, context);
}
