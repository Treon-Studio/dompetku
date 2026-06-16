"use client";

import { useTranslation } from "@i18n/client";
import { ArrowRightDown, ArrowRightUp, Case, Chart, MoneyBag, PlayCircle, Wallet } from "@solar-icons/react";
import { useUser } from "~/features/auth/components/auth-provider";
import { useOverview } from "~/shared/components/context/overview-provider";
import CardLoader from "~/shared/components/loader/card";
import { Badge } from "~/shared/components/ui/badge";

import { formatCurrency } from "~/shared/lib/formatter";
import { cn } from "~/shared/lib/utils";

import SummaryCard from "../../components/card/summary-card";

const _Info = ({ value }: { value: number }) => {
	const isUp = value > 0;
	const Icon = isUp ? ArrowRightUp : ArrowRightDown;
	return (
		<Badge
			variant="secondary"
			className={`absolute bg-transparent tabular-nums font-semibold bottom-[5px] right-[5px] h-[18px] px-1 text-[10px] text-muted-foreground ${cn(
				{
					"text-green-600": isUp,
					"text-red-600": !isUp,
				},
			)}`}
		>
			<Icon className="mr-[0.5] h-[0.65rem] w-[0.65rem]" />
			{value}%
		</Badge>
	);
};

export default function Summary() {
	const { t } = useTranslation();
	const user = useUser();
	const { data, loading } = useOverview();

	const totalExpenses = data.expenses.reduce((acc: any, { price }: any) => Number(price) + acc, 0);
	const totalIncome = data.income.reduce((acc: any, { price }: any) => Number(price) + acc, 0);
	const totalInvesments = data.investments.reduce(
		(acc: any, { price, units }: any) => Number(price) * Number(units) + acc,
		0,
	);
	const totalSubscriptions = data.subscriptions.reduce(
		(acc: any, { price, paid_dates }: any) => Number(price) * paid_dates.length + acc,
		0,
	);
	const totalSpent = totalExpenses + totalInvesments + totalSubscriptions;
	const totalBalance = totalIncome - totalSpent;

	return (
		<>
			<h2 className="mb-4 font-semibold text-primary dark:text-white">{t("common.summary")}</h2>
			{loading ? (
				<CardLoader cards={5} />
			) : (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
					<SummaryCard
						icon={Case}
						title={t("dashboard.totalIncome")}
						data={formatCurrency({ value: totalIncome, currency: user?.currency, locale: user?.locale })}
					/>
					<SummaryCard
						icon={Wallet}
						title={t("dashboard.availableBalance")}
						data={formatCurrency({ value: totalBalance, currency: user?.currency, locale: user?.locale })}
					/>
					<SummaryCard
						icon={MoneyBag}
						title={t("dashboard.totalSpent")}
						tooltip={t("messages.totalSpentTooltip")}
						data={formatCurrency({ value: totalSpent, currency: user?.currency, locale: user?.locale })}
					/>
					<SummaryCard
						icon={Chart}
						title={t("dashboard.totalInvestment")}
						data={formatCurrency({ value: totalInvesments, currency: user?.currency, locale: user?.locale })}
					/>
					<SummaryCard
						icon={PlayCircle}
						title={t("dashboard.totalSubscription")}
						data={formatCurrency({ value: totalSubscriptions, currency: user?.currency, locale: user?.locale })}
					/>
				</div>
			)}
		</>
	);
}
