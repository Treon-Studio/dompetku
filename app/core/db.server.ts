import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './db/schema';

export type DB = ReturnType<typeof createDbClient>;

export function createDbClient(env: { TURSO_DATABASE_URL?: string; TURSO_AUTH_TOKEN?: string }) {
  const url = env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || '';
  const authToken = env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || '';

  if (!url) throw new Error('TURSO_DATABASE_URL is not set');

  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}
