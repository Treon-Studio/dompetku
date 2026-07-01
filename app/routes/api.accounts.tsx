import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { createDbClient } from "~/core/db.server";
import { getCloudflareEnv } from "~/env";
import { requireUser } from "~/features/auth/api.server";
import {
	createPaymentAccount,
	deletePaymentAccount,
	getPaymentAccounts,
	updatePaymentAccount,
} from "~/features/accounts/api.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createDbClient(getCloudflareEnv(context));
	const user = await requireUser(request, db, context);
	const accounts = await getPaymentAccounts(db, user.id);
	return json({ accounts });
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(getCloudflareEnv(context));
	const user = await requireUser(request, db, context);
	const method = request.method.toUpperCase();

	if (method === "POST") {
		const formData = await request.formData();
		const result = await createPaymentAccount(db, user.id, formData);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	if (method === "PUT") {
		const formData = await request.formData();
		const result = await updatePaymentAccount(db, user.id, formData);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	if (method === "DELETE") {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		if (!id) return json({ success: false, error: "ID is required" }, { status: 400 });
		const result = await deletePaymentAccount(db, user.id, id);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	return json({ success: false, error: "Method not allowed" }, { status: 405 });
}
