import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createPrismaClient } from '~/core/db.server';
import { requireUser } from '~/features/auth/api.server';
import { getGoals, createGoal, updateGoal, deleteGoal } from '~/features/goals/api.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);

	const goals = await getGoals(db, user.id);
	return json({ goals });
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const method = request.method.toUpperCase();

	if (method === 'POST') {
		const formData = await request.formData();
		const result = await createGoal(db, user.id, formData);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	if (method === 'PUT') {
		const formData = await request.formData();
		const result = await updateGoal(db, user.id, formData);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	if (method === 'DELETE') {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		if (!id) return json({ success: false, error: 'ID is required' }, { status: 400 });
		const result = await deleteGoal(db, user.id, id);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	return json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
