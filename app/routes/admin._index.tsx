import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData, Link } from '@remix-run/react';

import { createPrismaClient } from '~/core/db.server';
import { requireAdmin } from '~/features/auth/api.server';
import LayoutHeader from '~/shared/components/layout/header';
import { Button } from '~/shared/components/ui/button';
import { DonutChart, Legend } from '@tremor/react';

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createPrismaClient(context.cloudflare.env);
	await requireAdmin(request, db, context);

	const totalUsers = await db.users.count();
	const premiumUsers = await db.users.count({
		where: { plan_status: 'premium' }
	});
	const basicUsers = totalUsers - premiumUsers;
	
	const totalFeedbacks = await db.feedbacks.count();
	
	return json({ totalUsers, premiumUsers, basicUsers, totalFeedbacks });
}

export default function AdminDashboard() {
	const { totalUsers, premiumUsers, basicUsers, totalFeedbacks } = useLoaderData<typeof loader>();

	const userPlanData = [
		{ name: 'Premium Users', value: premiumUsers },
		{ name: 'Basic Users', value: basicUsers },
	];

	return (
		<>
			<LayoutHeader title="Super Admin Dashboard" />
			<div className="p-6 space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="p-4 bg-card border rounded-lg shadow-sm">
						<p className="text-sm text-gray-500 font-medium">Total Users</p>
						<p className="text-3xl font-bold">{totalUsers}</p>
					</div>
					<div className="p-4 bg-card border rounded-lg shadow-sm">
						<p className="text-sm text-gray-500 font-medium">Premium Users</p>
						<p className="text-3xl font-bold text-green-600">{premiumUsers}</p>
					</div>
					<div className="p-4 bg-card border rounded-lg shadow-sm">
						<p className="text-sm text-gray-500 font-medium">Basic Users</p>
						<p className="text-3xl font-bold">{basicUsers}</p>
					</div>
					<div className="p-4 bg-card border rounded-lg shadow-sm">
						<p className="text-sm text-gray-500 font-medium">Total Feedbacks</p>
						<p className="text-3xl font-bold">{totalFeedbacks}</p>
					</div>
				</div>

				<div className="flex gap-4">
					<Link to="/admin/users">
						<Button>Kelola Pengguna (Manage Users)</Button>
					</Link>
					<Link to="/admin/settings">
						<Button variant="outline">System Settings</Button>
					</Link>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-4 bg-card border rounded-lg shadow-sm">
						<h3 className="font-semibold mb-4 text-primary">User Plan Distribution</h3>
						<div className="flex flex-col items-center">
							<DonutChart
								data={userPlanData}
								category="value"
								index="name"
								valueFormatter={(num) => `${num} Users`}
								colors={["emerald", "slate"]}
								className="h-72 mt-4"
							/>
							<Legend className="mt-3" categories={['Premium Users', 'Basic Users']} colors={["emerald", "slate"]} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
