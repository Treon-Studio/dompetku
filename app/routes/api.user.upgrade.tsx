import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { requireUser } from '~/features/auth/api.server';
import { createPrismaClient } from '~/core/db.server';
import { logger } from '~/core/logger.server';
import { upgradeUserPlan } from '~/features/profile/api.server';

export async function action({ request, context }: ActionFunctionArgs) {
  const db = createPrismaClient(context.cloudflare.env);
  const user = await requireUser(request, db, context);
  const body = await request.json();

  try {
    await upgradeUserPlan(user.id, body, db);
    return json('Successful', { status: 200 });
  } catch (error: any) {
    if (error.message.startsWith('Invalid')) {
      return json({ message: error.message }, { status: 400 });
    }
    logger.error('Request failed', { error: String(error) });
    return json({ message: 'Request failed' }, { status: 500 });
  }
}
