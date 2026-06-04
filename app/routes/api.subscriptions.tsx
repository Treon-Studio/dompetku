import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';

import { requireUser } from '~/lib/auth.server';
import { createPrismaClient } from '~/lib/prisma';
import { handleGetRecords, handleActionRecords } from '~/lib/api-handler.server';

const ALLOWED_FIELDS = ['name', 'notes', 'url', 'price', 'paid', 'notify', 'date', 'active', 'cancelled_at'];

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	
	const selectFields = {
		name: true,
		notes: true,
		url: true,
		price: true,
		paid: true,
		notify: true,
		id: true,
		date: true,
		active: true,
		cancelled_at: true,
		created_at: true,
		updated_at: true,
	};
	
	return handleGetRecords(db, 'subscriptions', user, request, selectFields);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	
	return handleActionRecords(db, 'subscriptions', user, request, ALLOWED_FIELDS);
}
