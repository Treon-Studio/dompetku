import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
	url: TURSO_DATABASE_URL,
	authToken: TURSO_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

export default prisma;