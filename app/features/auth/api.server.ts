import { createCookieSessionStorage, redirect } from '@remix-run/cloudflare';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import type { AppLoadContext } from '@remix-run/cloudflare';
import type { CloudflareEnv } from '~/env';
import { isEmail, isPhone as checkPhone, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '~/constants/validation';
import {
  SESSION_COOKIE_NAME,
  BCRYPT_SALT_ROUNDS,
  SESSION_DURATION_MS,
} from '~/constants/app';

export { isEmail } from '~/constants/validation';

export function isPhone(identity: string): boolean {
  return checkPhone(identity.replace(/[\s\-()]/g, ''));
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

function getEnv(context: AppLoadContext): CloudflareEnv {
  const cfEnv = (context.cloudflare?.env || {}) as Partial<CloudflareEnv>;
  return {
    TURSO_DATABASE_URL: cfEnv.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || '',
    TURSO_AUTH_TOKEN: cfEnv.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || '',
    SESSION_SECRET: cfEnv.SESSION_SECRET || process.env.SESSION_SECRET || '',
    RESEND_API_KEY: cfEnv.RESEND_API_KEY || process.env.RESEND_API_KEY || '',
    NODE_ENV: cfEnv.NODE_ENV || process.env.NODE_ENV || 'development',
    GA4_ANALYTICS_ID: cfEnv.GA4_ANALYTICS_ID || process.env.GA4_ANALYTICS_ID,
  } as CloudflareEnv;
}

function getSessionStorage(context: AppLoadContext) {
  const env = getEnv(context);
  if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET environment variable is required');
  return createCookieSessionStorage({
    cookie: {
      name: SESSION_COOKIE_NAME,
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      secrets: [env.SESSION_SECRET],
      maxAge: SESSION_DURATION_MS,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validateIdentity(identity: string): { valid: boolean; message?: string } {
  if (!identity || !identity.trim()) {
    return { valid: false, message: 'Email or phone number is required' };
  }
  if (!isEmail(identity) && !isPhone(identity)) {
    return { valid: false, message: 'Please enter a valid email or phone number' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` };
  }
  return { valid: true };
}

export async function createSession(userId: string, redirectTo: string, db: PrismaClient, context: AppLoadContext) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

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

export async function requireAdmin(request: Request, db: PrismaClient, context: AppLoadContext) {
  const user = await requireUser(request, db, context);
  if (user.role !== 'ADMIN') {
    throw redirect('/dashboard');
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
  const email = !isPhone(identity) && isEmail(identity) ? identity : undefined;

  if (!email && !phone) {
    throw new Error('Must provide a valid email or phone number');
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
  console.log(`[LOGIN DEBUG] Attempting login for identity: "${identity}"`);
  const user = await findUserByIdentity(identity, db);
  if (!user) {
    console.log(`[LOGIN DEBUG] User not found for identity: "${identity}"`);
    return null;
  }
  
  console.log(`[LOGIN DEBUG] User found. ID: ${user.id}, DB Phone: "${user.phone}", DB Email: "${user.email}"`);

  const isValid = await verifyPassword(password, user.password);
  console.log(`[LOGIN DEBUG] Password valid: ${isValid}`);
  if (!isValid) return null;

  return user;
}
