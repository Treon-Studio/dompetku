import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { requireUser } from '~/features/auth/api.server';
import { createPrismaClient } from '~/lib/prisma';
import { getUserProfile, updateUserProfile, deleteUserAndData } from '~/features/profile/api.server';
import { logger } from '~/lib/logger.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = createPrismaClient(context.cloudflare.env);
  const user = await requireUser(request, db, context);

  try {
    const profile = await getUserProfile(user.id, db);
    return json(profile, { status: 200 });
  } catch (error) {
    logger.error('Request failed', { error: String(error) });
    return json({ message: 'Request failed' }, { status: 500 });
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = createPrismaClient(context.cloudflare.env);
  const user = await requireUser(request, db, context);
  const method = request.method.toUpperCase();

  if (method === 'PATCH') {
    const body = await request.json();
    try {
      await updateUserProfile(user.id, body, user.password, db);
      return json({ message: 'Updated' });
    } catch (error: any) {
      if (error.message === 'Request failed') {
        logger.error('Request failed', { error: String(error) });
        return json({ message: 'Request failed' }, { status: 500 });
      }
      return json({ message: error.message }, { status: 400 });
    }
  }

  if (method === 'DELETE') {
    try {
      await deleteUserAndData(user.id, db);
      return json({ message: 'Deleted' });
    } catch (error) {
      logger.error('Request failed', { error: String(error) });
      return json({ message: 'Request failed' }, { status: 500 });
    }
  }

  return json({ message: 'Method not allowed' }, { status: 405 });
}
