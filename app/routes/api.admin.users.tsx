import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { desc, eq, like, or } from "drizzle-orm";
import { users } from "~/core/db/schema";
import { createDbClient } from "~/core/db.server";
import { logger } from "~/core/logger.server";
import { getCloudflareEnv } from "~/env";
import { requireAdmin } from "~/features/auth/api.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createDbClient(getCloudflareEnv(context));
	await requireAdmin(request, db, context);

	const url = new URL(request.url);
	const search = url.searchParams.get("q") || "";

	const usersData = await db
		.select({
			id: users.id,
			email: users.email,
			phone: users.phone,
			role: users.role,
			plan_status: users.plan_status,
			order_status: users.order_status,
			created_at: users.created_at,
		})
		.from(users)
		.where(search ? or(like(users.email, `%${search}%`), like(users.phone, `%${search}%`)) : undefined)
		.orderBy(desc(users.created_at))
		.limit(50);

	return json(usersData);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(getCloudflareEnv(context));
	await requireAdmin(request, db, context);

	const body = (await request.json()) as Record<string, unknown>;
	const { id, action } = body;

	if (!id || typeof id !== "string") {
		return json({ message: "Invalid ID" }, { status: 400 });
	}

	try {
		if (action === "UPGRADE") {
			await db.update(users).set({ plan_status: "premium", order_status: "paid" }).where(eq(users.id, id));
			return json({ message: "User upgraded to premium" });
		}

		if (action === "DOWNGRADE") {
			await db.update(users).set({ plan_status: "basic", order_status: null }).where(eq(users.id, id));
			return json({ message: "User downgraded to basic" });
		}

		if (action === "DELETE") {
			await db.delete(users).where(eq(users.id, id));
			return json({ message: "User deleted" });
		}

		return json({ message: "Unknown action" }, { status: 400 });
	} catch (error) {
		logger.error("Admin action failed", { error: String(error) });
		return json({ message: "Action failed" }, { status: 500 });
	}
}
