'use client';

import { useMemo } from 'react';

import { useOverview } from '~/shared/components/context/overview-provider';
import { DataTable } from '~/shared/components/recent-activities/data-table';
import StateDisplay from '~/shared/components/state-display';

import { extractRecentData } from '~/shared/lib/extractor';

import { columns } from './columns';

const initialData = {
	no: '',
	category: '',
	amount: '',
	name: '',
};

export default function RecentActivitiesTable() {
	const { data, loading } = useOverview();

	const recentData = useMemo(
		() => extractRecentData(data.expenses, data.subscriptions, data.investments, data.income),
		[data]
	);

	if (loading) {
		return (
			<DataTable
				data={[initialData, initialData, initialData, initialData, initialData]}
				loading={loading}
				columns={columns}
			/>
		);
	}

	if (!recentData.length) {
		return <StateDisplay variant="empty" className="h-64" />;
	}

	return (
		<DataTable
			columns={columns}
			data={recentData.map((datum, index) => ({
				no: `${index + 1}.`,
				category: datum.category,
				amount: datum.price,
				name: datum.name,
			}))}
		/>
	);
}
