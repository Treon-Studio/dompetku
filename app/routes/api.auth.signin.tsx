import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { login, createSession } from '~/lib/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return json({ message: 'Email and password are required' }, { status: 400 });
  }

  const user = await login(email, password);
  if (!user) {
    return json({ message: 'Invalid credentials' }, { status: 401 });
  }

  return createSession(user.id, '/dashboard');
}