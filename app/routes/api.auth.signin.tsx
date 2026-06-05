import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { login, createSession, isPhone } from '~/features/auth/api.server';
import { createDbClient } from '~/core/db.server';
import { SigninSchema } from '~/features/auth/schemas';
import { logger } from '~/core/logger.server';

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const db = createDbClient(context.cloudflare.env);
    const body = await request.json();
    const result = SigninSchema.safeParse(body);

    if (!result.success) {
      const error = result.error.issues[0];
      return json({ message: error.message }, { status: 400 });
    }

    const { identity, password } = result.data;

    const user = await login(identity, password, db);
    if (!user) {
      return json({ message: 'Invalid credentials' }, { status: 401 });
    }

    return createSession(user.id, '/dashboard', db, context);
  } catch (error: any) {
    logger.error('Signin error', { error: String(error) });
    return json({ message: 'An error occurred during sign in' }, { status: 500 });
  }
}
