import path from "node:path";
import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
	schema: "./app/core/db/schema.ts",
	out: "./app/core/db/migrations",
	dialect: "turso",
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL || "file:local.db",
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
	verbose: true,
	strict: true,
});
