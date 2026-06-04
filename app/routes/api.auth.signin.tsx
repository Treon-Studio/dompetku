import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { login, createSession, isPhone } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { SigninSchema } from '~/lib/schemas';
import { logger } from '~/lib/logger.server';

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const db = createPrismaClient(context.cloudflare.env);
    const body = await request.json();
    const result = SigninSchema.safeParse(body);

    if (!result.success) {
      const error = result.error.errors[0];
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
