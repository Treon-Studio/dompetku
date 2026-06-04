'use client';

import { useMemo } from 'react';

import { BarList } from '@tremor/react';

import { useUser } from '~/features/auth/components/auth-provider';
import { useOverview } from '~/shared/components/context/overview-provider';
import ChartLoader from '~/shared/components/loader/chart';
import StateDisplay from '~/shared/components/state-display';

import { extractTopExpenseCategories } from '~/shared/lib/extractor';
import { formatCurrency } from '~/shared/lib/formatter';

export default function TopSpentExpenses() {
	const user = useUser();
	const { data, loading } = useOverview();
	const chartData = useMemo<Array<any>>(() => extractTopExpenseCategories(data.expenses), [data.expenses]);

	if (loading) {
		return <ChartLoader className="mb-10 h-[230px] pl-0 pt-0" type="barlist" />;
	}

	if (!chartData.length) {
		return <StateDisplay variant="empty" className="h-64" />;
	}

	return (
		<BarList
			data={chartData}
			valueFormatter={(value: any) => {
				return formatCurrency({ value, currency: user.currency, locale: user.locale });
			}}
			showAnimation={false}
			className="mt-2"
			color="blue"
		/>
	);
}
