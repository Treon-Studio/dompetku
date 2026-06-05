'use client';

import { createContext, useContext } from 'react';

import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import { apiUrls } from '~/shared/lib/apiUrls';
import fetcher from '~/shared/lib/fetcher';

import { dateFormat } from '~/shared/constants/date';

import { useDateRange } from '~/shared/stores/date/date.store';

const OverviewContext = createContext(null);

interface Data {
	expenses: Array<any>;
	income: Array<any>;
	subscriptions: Array<any>;
	investments: Array<any>;
}

export const OverviewContextProvider = (props: any) => {
	const date = useDateRange();
	const from = format(date.from || date.to, dateFormat);
	const to = format(date.to || date.from, dateFormat);
	const { children, ...others } = props;
	const expensesUrl = apiUrls.expenses.getExpenses({ from, to });
	const {
		data: expensesData = [],
		isLoading: isExpenseLoading,
		refetch: mutateExpenses,
	} = useQuery({ queryKey: ['overview-expenses', expensesUrl], queryFn: () => fetcher(expensesUrl) });

	const investmentsUrl = apiUrls.investments.getInvestments({ from, to });
	const { data: investmentsData = [], isLoading: isInvestmentsLoading } = useQuery({
		queryKey: ['overview-investments', investmentsUrl],
		queryFn: () => fetcher(investmentsUrl),
	});

	const incomeUrl = apiUrls.income.getIncome({ from, to });
	const { data: incomeData = [], isLoading: isIncomeLoading } = useQuery({
		queryKey: ['overview-income', incomeUrl],
		queryFn: () => fetcher(incomeUrl),
	});

	const subscriptionsUrl = apiUrls.subscriptions.getSubscriptions({ from, to });
	const { data: subscriptionsData = [], isLoading: isSubscriptionsLoading } = useQuery({
		queryKey: ['overview-subscriptions', subscriptionsUrl],
		queryFn: () => fetcher(subscriptionsUrl),
	});

	const data = {
		expenses: expensesData,
		investments: investmentsData,
		income: incomeData,
		subscriptions: subscriptionsData,
		mutate: {
			mutateExpenses,
		},
	};
	const loading = isExpenseLoading || isInvestmentsLoading || isIncomeLoading || isSubscriptionsLoading;

	return (
		<OverviewContext.Provider value={{ loading, data }} {...others}>
			{children}
		</OverviewContext.Provider>
	);
};

export const useOverview = () => {
	const context = useContext<any>(OverviewContext);
	if (context === undefined) {
		throw new Error(`useUser must be used within a OverviewContext.`);
	}
	return context;
};
