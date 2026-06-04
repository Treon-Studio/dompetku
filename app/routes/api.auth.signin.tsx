import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { login, createSession, isPhone } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { validateIdentityField, validatePasswordField } from '~/lib/validate';
import { logger } from '~/lib/logger.server';

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const db = createPrismaClient(context.cloudflare.env);
    const body = await request.json();
    const identity = body.identity;
    const password = body.password;

    const identityError = validateIdentityField(body.identity, isPhone);
    if (identityError) return json({ message: identityError }, { status: 400 });

    const passwordError = validatePasswordField(body.password);
    if (passwordError) return json({ message: passwordError }, { status: 400 });

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
