import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { handleGetRecords, handleActionRecords } from '~/lib/api-handler.server';
import { SubscriptionSchema } from './schemas';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	
	const selectFields = {
		notes: true,
		name: true,
		price: true,
		paid: true,
		url: true,
		notify: true,
		id: true,
		date: true,
		created_at: true,
		updated_at: true,
	};
	
	return handleGetRecords(db, 'subscriptions', user, request, selectFields);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	
	return handleActionRecords(db, 'subscriptions', user, request, SubscriptionSchema);
}
