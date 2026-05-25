import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import { login, createSession } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const db = createPrismaClient(context.cloudflare.env);
    const body = await request.json();
    const identity = body.identity;
    const password = body.password;

    if (!identity || !password) {
      return json({ message: 'Email/phone and password are required' }, { status: 400 });
    }

    const user = await login(identity, password, db);
    if (!user) {
      return json({ message: 'Invalid credentials' }, { status: 401 });
    }

    return createSession(user.id, '/dashboard', db, context);
  } catch (error: any) {
    console.error('Signin error:', error);
    return json({ message: error.message || 'An error occurred during sign in' }, { status: 500 });
  }
}
