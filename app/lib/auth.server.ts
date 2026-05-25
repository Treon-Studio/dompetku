import { createCookieSessionStorage, redirect } from '@remix-run/cloudflare';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import type { AppLoadContext } from '@remix-run/cloudflare';
import type { CloudflareEnv } from '~/env';

function getEnv(context: AppLoadContext): CloudflareEnv {
  const cfEnv = (context.cloudflare?.env || {}) as Partial<CloudflareEnv>;
  return {
    TURSO_DATABASE_URL: cfEnv.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || '',
    TURSO_AUTH_TOKEN: cfEnv.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || '',
    SESSION_SECRET: cfEnv.SESSION_SECRET || process.env.SESSION_SECRET || 'default-secret-change-me',
    RESEND_API_KEY: cfEnv.RESEND_API_KEY || process.env.RESEND_API_KEY || '',
    NODE_ENV: cfEnv.NODE_ENV || process.env.NODE_ENV || 'development',
    GA4_ANALYTICS_ID: cfEnv.GA4_ANALYTICS_ID || process.env.GA4_ANALYTICS_ID,
  } as CloudflareEnv;
}

function getSessionStorage(context: AppLoadContext) {
  const env = getEnv(context);
  return createCookieSessionStorage({
    cookie: {
      name: 'expense_session',
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      secrets: [env.SESSION_SECRET],
      maxAge: 60 * 60 * 24 * 30,
    },
  });
}

export function isPhone(identity: string): boolean {
  return /^\+?\d{7,15}$/.test(identity.replace(/[\s\-()]/g, ''));
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, redirectTo: string, db: PrismaClient, context: AppLoadContext) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await db.sessions.create({
    data: { user_id: userId, token, expires_at: expiresAt },
  });

  const sessionStorage = getSessionStorage(context);
  const session = await sessionStorage.getSession();
  session.set('token', token);

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function getSession(request: Request, context: AppLoadContext) {
  const sessionStorage = getSessionStorage(context);
  return sessionStorage.getSession(request.headers.get('Cookie'));
}

export async function getUserFromSession(request: Request, db: PrismaClient, context: AppLoadContext) {
  const session = await getSession(request, context);
  const token = session.get('token');

  if (!token) return null;

  const dbSession = await db.sessions.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!dbSession) return null;
  if (dbSession.expires_at < new Date()) {
    await db.sessions.delete({ where: { id: dbSession.id } });
    return null;
  }

  return dbSession.user;
}

export async function requireUser(request: Request, db: PrismaClient, context: AppLoadContext) {
  const user = await getUserFromSession(request, db, context);
  if (!user) {
    throw redirect('/signin');
  }
  return user;
}

export async function signOut(request: Request, db: PrismaClient, context: AppLoadContext) {
  const session = await getSession(request, context);
  const token = session.get('token');
  const sessionStorage = getSessionStorage(context);

  if (token) {
    await db.sessions.deleteMany({ where: { token } });
  }

  return redirect('/signin', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}

export async function createUser(identity: string, password: string, db: PrismaClient) {
  const passwordHash = await hashPassword(password);
  const phone = isPhone(identity) ? normalizePhone(identity) : undefined;
  const email = !isPhone(identity) ? identity : undefined;

  if (!email && !phone) {
    throw new Error('Must provide email or phone number');
  }

  return db.users.create({
    data: {
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      password: passwordHash,
    },
  });
}

export async function findUserByIdentity(identity: string, db: PrismaClient) {
  if (isPhone(identity)) {
    const phone = normalizePhone(identity);
    return db.users.findUnique({ where: { phone } });
  }
  return db.users.findUnique({ where: { email: identity } });
}

export async function login(identity: string, password: string, db: PrismaClient) {
  const user = await findUserByIdentity(identity, db);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  return user;
}
