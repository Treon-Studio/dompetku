import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { createUser, findUserByIdentity, createSession, isPhone, normalizePhone } from '~/features/auth/api.server';
import { createPrismaClient } from '~/core/db.server';
import { SignupSchema } from '~/features/auth/schemas';
import { logger } from '~/core/logger.server';

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const db = createPrismaClient(context.cloudflare.env);
    const body = await request.json();
    const result = SignupSchema.safeParse(body);
    
    if (!result.success) {
      const error = result.error.issues[0];
      return json({ message: error.message }, { status: 400 });
    }

    const { identity, password } = result.data;

    const existingUser = await findUserByIdentity(identity, db);
    if (existingUser) {
      return json({ message: 'Account already exists' }, { status: 400 });
    }

    if (isPhone(identity)) {
      const phone = normalizePhone(identity);
      const phoneExists = await db.users.findUnique({ where: { phone } });
      if (phoneExists) {
        return json({ message: 'Phone number already registered' }, { status: 400 });
      }
    }

    const user = await createUser(identity, password, db);
    return createSession(user.id, '/', db, context);
  } catch (error: any) {
    logger.error('Signup error', { error: String(error) });
    return json({ message: 'An error occurred during sign up' }, { status: 500 });
  }
}
