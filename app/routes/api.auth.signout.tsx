import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { signOut } from '~/features/auth/api.server';
import { createDbClient } from '~/core/db.server';
import { getCloudflareEnv } from '~/env';

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(getCloudflareEnv(context));
	return signOut(request, db, context);
}
