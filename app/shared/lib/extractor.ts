import { expensesCategory } from "~/shared/constants/categories";

import { formatDate } from "./formatter";

const dateStyle = { day: "2-digit", year: "2-digit", month: "short" } as const;

interface BaseRecord {
	id: string;
	name: string;
	price: string;
	category: string;
	date: string;
	updated_at: string;
}

interface SubscriptionRecord extends BaseRecord {
	paid_dates: string[];
}

export const sortByKey = <T extends Record<string, unknown>>(arr: T[], key: keyof T) => {
	return [...arr].sort((a, b) => (a[key] < b[key] ? 1 : -1));
};

export const extractExpenses = (data: BaseRecord[], locale: string) => {
	const groupByDate = data.reduce<Record<string, Record<string, number>>>((acc, datum) => {
		const date = formatDate({ date: datum.date, locale, dateStyle });
		acc[date] = acc[date]
			? {
					...acc[date],
					[datum.category]: acc[date][datum.category]
						? acc[date][datum.category] + Number(datum.price)
						: Number(datum.price),
				}
			: { date, [datum.category]: Number(datum.price) };

		return acc;
	}, {});

	return Object.values(groupByDate).reverse();
};

export const extractExpensesCategory = (data: BaseRecord[]) => {
	return Object.keys(
		data.reduce<Record<string, boolean>>((acc, datum) => {
			acc[datum.category] = true;
			return acc;
		}, {}),
	);
};

export const extractChartAxis = <T>(data: T[]) =>
	[...data].sort((a: unknown, b: unknown) => (b as number) - (a as number));

export const extractSubscriptions = (data: SubscriptionRecord[]) => {
	return data.reduce<{ name: string; price: number }[]>((acc, c) => {
		acc.push({ name: c.name, price: Number(c.price) * Number(c.paid_dates.length) });
		return acc;
	}, []);
};

export const extractSubscriptionsCategories = (data: SubscriptionRecord[]) => {
	return data.reduce<string[]>((acc, datum) => {
		acc.push(datum.name);
		return acc;
	}, []);
};

export const extractRecentData = (
	expenses: BaseRecord[],
	subscriptions: SubscriptionRecord[],
	investments: BaseRecord[],
	income: BaseRecord[],
) => {
	if (expenses.length || investments.length || income.length || subscriptions.length) {
		const allData = [
			...subscriptions.map((datum) => ({ ...datum, from: "subcriptions", category: "subcriptions" })),
			...expenses.map((datum) => ({ ...datum, from: "expenses" })),
			...investments.map((datum) => ({ ...datum, from: "investments" })),
			...income.map((datum) => ({ ...datum, from: "income" })),
		];
		return sortByKey(allData, "updated_at").filter((_, index) => index <= 4);
	}
	return [];
};

const sortValueByAsc = (a: { value: number }, b: { value: number }) => (a.value > b.value ? -1 : 1);

type DatumReturn = {
	[key: string]: {
		name: string;
		value: number;
	};
};

export const extractTopExpenseCategories = (data: BaseRecord[]) => {
	const dataMap = data.reduce<DatumReturn>((acc, datum) => {
		acc[datum.category] = {
			name: `${expensesCategory[datum.category]?.emoji}  ${datum.category}`,
			value: acc[datum.category] ? Number(acc[datum.category].value) + Number(datum.price) : Number(datum.price),
		};

		return acc;
	}, {});

	return Object.values(dataMap)
		.sort(sortValueByAsc)
		.filter((_, index) => index <= 5);
};
