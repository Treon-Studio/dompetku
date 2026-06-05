'use client';

import { useMemo } from 'react';

import SummaryCard from '~/shared/components/card/summary-card';
import { useUser } from '~/features/auth/components/auth-provider';
import { useData } from '~/shared/components/context/data-provider';
import CardLoader from '~/shared/components/loader/card';

import { formatCurrency } from '~/shared/lib/formatter';

export default function SubscriptionsSummary() {
	const user = useUser();
	const { data = [], loading = true } = useData();
	const monthlyData = useMemo(
		() =>
			data.filter(
				(datum: { active: boolean; paid: string; price: number }) => datum.active && datum.paid === 'monthly'
			),
		[data]
	);
	const yearlyData = useMemo(
		() =>
			data.filter((datum: { active: boolean; paid: string; price: number }) => datum.active && datum.paid === 'yearly'),
		[data]
	);

	return (
		<>
			<h2 className="mb-4 font-semibold text-primary dark:text-white">Summary</h2>
			{loading ? (
				<CardLoader cards={4} className="mb-6" />
			) : (
				<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
					<SummaryCard title="total subscriptions" data={data.length} />
					<SummaryCard
						title="Active - Cancelled"
						data={`${data.filter((datum: { active: boolean; paid: string; price: number }) => datum.active).length} - ${
							data.filter((datum: { active: boolean; paid: string; price: number }) => !datum.active).length
						}`}
					/>
					<SummaryCard
						title="Total Active - Monthly"
						data={formatCurrency({
							value: monthlyData.reduce((acc: number, datum: { price: number }) => Number(datum.price) + acc, 0),
							currency: user?.currency,
							locale: user?.locale,
						})}
					/>

					<SummaryCard
						title="Total Active - Yearly"
						data={formatCurrency({
							value: yearlyData.reduce((acc: number, datum: { price: number }) => Number(datum.price) + acc, 0),
							currency: user?.currency,
							locale: user?.locale,
						})}
					/>
				</div>
			)}
		</>
	);
}
