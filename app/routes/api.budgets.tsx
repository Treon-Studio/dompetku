import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createDbClient } from '~/core/db.server';
import { requireUser } from '~/features/auth/api.server';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '~/features/budgets/api.server';
import { expenses as expensesTable } from '~/core/db/schema';
import { and, eq, like } from 'drizzle-orm';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createDbClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const url = new URL(request.url);
	const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

	const budgets = await getBudgets(db, user.id, month);

	// Calculate spent amount for each budget category
	const expenses = await db.select().from(expensesTable).where(
		and(
			eq(expensesTable.user_id, user.id),
			like(expensesTable.date, `${month}%`)
		)
	);

	const budgetsWithSpent = budgets.map((budget: any) => {
		const spent = expenses
			.filter(exp => exp.category === budget.category)
			.reduce((total, exp) => total + parseFloat(exp.price), 0);
		return { ...budget, spent };
	});

	return json({ budgets: budgetsWithSpent });
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(context.cloudflare.env);
	const user = await requireUser(request, db, context);
	const method = request.method.toUpperCase();

	if (method === 'POST') {
		const formData = await request.formData();
		const result = await createBudget(db, user.id, formData);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	if (method === 'PUT') {
		const formData = await request.formData();
		const result = await updateBudget(db, user.id, formData);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	if (method === 'DELETE') {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		if (!id) return json({ success: false, error: 'ID is required' }, { status: 400 });
		const result = await deleteBudget(db, user.id, id);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	return json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
