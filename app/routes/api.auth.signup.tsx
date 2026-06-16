import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { createDbClient } from "~/core/db.server";
import { logger } from "~/core/logger.server";
import { getCloudflareEnv } from "~/env";
import { createSession, createUser, findUserByIdentity, isPhone } from "~/features/auth/api.server";
import { SignupSchema } from "~/features/auth/schemas";

export async function action({ request, context }: ActionFunctionArgs) {
	try {
		const db = createDbClient(getCloudflareEnv(context));
		const body = await request.json();
		const result = SignupSchema.safeParse(body);

		if (!result.success) {
			const error = result.error.issues[0];
			return json({ message: error.message }, { status: 400 });
		}

		const { identity, password } = result.data;

		const existingUser = await findUserByIdentity(identity, db);
		if (existingUser) {
			return json({ message: "Account already exists" }, { status: 400 });
		}

		if (isPhone(identity)) {
			// Already checked via findUserByIdentity above, which uses Drizzle
		}

		const user = await createUser(identity, password, db);
		return createSession(user.id, "/", db, context);
	} catch (e: unknown) {
		const error = e as Error;
		logger.error("Signup error", { error: String(error) });
		return json({ message: "An error occurred during sign up" }, { status: 500 });
	}
}
