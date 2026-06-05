import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';

import { requireUser } from '~/features/auth/api.server';
import { createDbClient } from '~/core/db.server';
import { handleGetRecords, handleActionRecords } from '~/shared/lib/api-handler.server';
import { ExpenseSchema } from './schemas';
import { getCloudflareEnv } from '~/env';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createDbClient(getCloudflareEnv(context));
	const user = await requireUser(request, db, context);

	const selectFields = {
		notes: true,
		name: true,
		price: true,
		category: true,
		paid_via: true,
		id: true,
		date: true,
		created_at: true,
		updated_at: true,
	};

	return handleGetRecords(db, 'expenses', user, request, selectFields);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(getCloudflareEnv(context));
	const user = await requireUser(request, db, context);

	return handleActionRecords(db, 'expenses', user, request, ExpenseSchema);
}
