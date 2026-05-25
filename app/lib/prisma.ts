import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import type { CloudflareEnv } from '~/env';

export function createPrismaClient(env: CloudflareEnv) {
  const cfUrl = (env as Record<string, string | undefined>).TURSO_DATABASE_URL;
  const cfToken = (env as Record<string, string | undefined>).TURSO_AUTH_TOKEN;
  let url = cfUrl || process.env.TURSO_DATABASE_URL;
  const authToken = cfToken || process.env.TURSO_AUTH_TOKEN;

  if (!url) throw new Error('TURSO_DATABASE_URL is not set. env keys: ' + Object.keys(env || {}).join(', '));
  if (!authToken) throw new Error('TURSO_AUTH_TOKEN is not set');

  if (url.startsWith('libsql://')) {
    url = url.replace('libsql://', 'https://');
  }

  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}
