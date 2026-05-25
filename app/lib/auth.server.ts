import { createCookieSessionStorage, redirect } from '@remix-run/node';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { SESSION_SECRET, NODE_ENV } from '~/env';

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'expense_session',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secure: NODE_ENV === 'production',
    secrets: [SESSION_SECRET],
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
});

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, redirectTo: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  await prisma.sessions.create({
    data: { user_id: userId, token, expires_at: expiresAt },
  });

  const session = await sessionStorage.getSession();
  session.set('token', token);

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get('Cookie'));
}

export async function getUserFromSession(request: Request) {
  const session = await getSession(request);
  const token = session.get('token');

  if (!token) return null;

  const dbSession = await prisma.sessions.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!dbSession) return null;
  if (dbSession.expires_at < new Date()) {
    await prisma.sessions.delete({ where: { id: dbSession.id } });
    return null;
  }

  return dbSession.user;
}

export async function requireUser(request: Request) {
  const user = await getUserFromSession(request);
  if (!user) {
    throw redirect('/signin');
  }
  return user;
}

export async function signOut(request: Request) {
  const session = await getSession(request);
  const token = session.get('token');

  if (token) {
    await prisma.sessions.deleteMany({ where: { token } });
  }

  return redirect('/signin', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}

export async function createUser(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  return prisma.users.create({
    data: { email, password: passwordHash },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.users.findUnique({ where: { email } });
}

export async function login(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  return user;
}