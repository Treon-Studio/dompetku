import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { createUser, findUserByIdentity, createSession, isPhone, normalizePhone } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { validateIdentityField, validatePasswordField } from '~/lib/validate';

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
    console.error('Signup error:', error);
    return json({ message: 'An error occurred during sign up' }, { status: 500 });
  }
}
