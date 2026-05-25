import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { createUser, getUserByEmail } from '~/lib/auth.server';
import prisma from '~/lib/prisma';
import { createSession } from '~/lib/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return json({ message: 'Email and password are required' }, { status: 400 });
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json({ message: 'Account already exists' }, { status: 400 });
  }

  const user = await createUser(email, password);
  return createSession(user.id, '/');
}