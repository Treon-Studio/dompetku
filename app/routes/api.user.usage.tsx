import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { requireUser } from '~/features/auth/api.server';
import { createDbClient } from '~/core/db.server';
import { logger } from '~/core/logger.server';
import { incrementUserUsage } from '~/features/profile/api.server';

export async function action({ request, context }: ActionFunctionArgs) {
  const db = createDbClient(context.cloudflare.env);
  const user = await requireUser(request, db, context);
  try {
    await incrementUserUsage(user.id, db);
    return json('Done');
  } catch (error) {
    logger.error('Request failed', { error: String(error) });
    return json({ message: 'An error occurred' }, { status: 500 });
  }
}
