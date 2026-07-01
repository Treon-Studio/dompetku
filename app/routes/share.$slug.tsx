import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { desc, eq } from "drizzle-orm";
import { debts, friends, payment_accounts, users } from "~/core/db/schema";
import { createDbClient } from "~/core/db.server";
import { getCloudflareEnv } from "~/env";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/shared/components/ui/table";

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
		.format(value)
		.replace(/\s+/g, " ")
		.replace(/\u00A0/g, " ");
};

export const meta: MetaFunction = () => {
	return [
		{ title: "Catatan Hutang Piutang (Shared)" },
		{ name: "description", content: "Rincian transaksi yang dibagikan." },
	];
};

export async function loader({ params, context }: LoaderFunctionArgs) {
	const slug = params.slug;
	if (!slug) {
		throw new Response("Not Found", { status: 404 });
	}

	const db = createDbClient(getCloudflareEnv(context));
	const [friendRecord] = await db.select().from(friends).where(eq(friends.slug, slug)).limit(1);

	if (!friendRecord?.is_public) {
		throw new Response("Halaman ini bersifat privat atau tidak ditemukan.", { status: 404 });
	}

	const friendDebts = await db
		.select()
		.from(debts)
		.where(eq(debts.friend_id, friendRecord.id))
		.orderBy(desc(debts.date), desc(debts.created_at));
	const ownerAccounts = friendRecord
		? await db
				.select()
				.from(payment_accounts)
				.where(eq(payment_accounts.user_id, friendRecord.user_id))
				.orderBy(desc(payment_accounts.created_at))
		: [];
	const [userRecord] = await db.select().from(users).where(eq(users.id, friendRecord.user_id)).limit(1);

	const friend = {
		...friendRecord,
		debts: friendDebts,
		user: userRecord,
		payment_accounts: ownerAccounts,
	};

	return json({ friend });
}

export default function SharedDebtPage() {
	const { friend } = useLoaderData<typeof loader>();
	const unpaidDebts = friend.debts.filter((debt: any) => debt.status === "UNPAID");
	const paidDebts = friend.debts.filter((debt: any) => debt.status === "PAID");

	let netAmount = 0;

	friend.debts.forEach((debt: any) => {
		if (debt.status === "UNPAID") {
			if (debt.type === "I_OWE") netAmount -= parseFloat(debt.amount);
			if (debt.type === "OWES_ME") netAmount += parseFloat(debt.amount);
		}
	});

	const viewerOwesUser = netAmount > 0;
	const userOwesViewer = netAmount < 0;

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-8 flex justify-center relative">
			<div className="max-w-3xl w-full space-y-6 p-4 md:p-0 mt-4 md:mt-8">
				<div className="text-center space-y-2 mb-8">
					<h1 className="text-3xl font-bold">Halo, {friend.name}!</h1>
					<p className="text-gray-500">Berikut adalah rekap catatan transaksi (hutang/piutang).</p>
				</div>

				<div
					className={`p-6 rounded-xl border text-center space-y-2 shadow-sm ${
						netAmount === 0
							? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
							: viewerOwesUser
								? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
								: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
					}`}
				>
					<h2 className="text-xl font-semibold">
						{netAmount === 0 && "Semua tagihan sudah lunas. 🎉"}
						{viewerOwesUser && "Sisa hutangmu:"}
						{userOwesViewer && "Sisa uangmu yang dipinjam:"}
					</h2>
					{netAmount !== 0 && (
						<p
							className={`text-4xl font-bold ${viewerOwesUser ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
						>
							{formatCurrency(Math.abs(netAmount))}
						</p>
					)}
				</div>

				<div className="px-2 mb-2">
					<span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Menunggu Pembayaran</span>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
					<Table>
						<TableHeader className="bg-gray-50 dark:bg-gray-900">
							<TableRow>
								<TableHead>Tanggal</TableHead>
								<TableHead>Deskripsi</TableHead>
								<TableHead className="text-right">Nominal</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{unpaidDebts.map((debt: any) => (
								<TableRow key={debt.id} className="bg-red-50/40 dark:bg-red-900/10">
									<TableCell suppressHydrationWarning className="whitespace-nowrap">
										{new Date(debt.date).toLocaleDateString("id-ID", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</TableCell>
									<TableCell>{debt.name.replace(/^(Pembayaran:\s*|Sisa:\s*)/i, "").split(" - ")[0]}</TableCell>
									<TableCell className="text-right">
										<div className="font-medium">{formatCurrency(parseFloat(debt.amount))}</div>
										{debt.name.startsWith("Sisa: ") && (
											<span className="text-[10px] sm:text-xs text-gray-500">Sisa Tagihan</span>
										)}
									</TableCell>
								</TableRow>
							))}
							{unpaidDebts.length === 0 && (
								<TableRow>
									<TableCell colSpan={3} className="text-center py-6 text-gray-500">
										Semua transaksi sudah lunas 🎉
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{paidDebts.length > 0 && (
					<details className="group mt-6">
						<summary className="cursor-pointer flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium px-2 py-1 outline-none select-none list-none [&::-webkit-details-marker]:hidden">
							<svg
								className="w-4 h-4 transition-transform group-open:rotate-90"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Toggle details</title>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
							<span>Riwayat Lunas ({paidDebts.length})</span>
						</summary>
						<div className="mt-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden opacity-75">
							<Table>
								<TableBody>
									{paidDebts.map((debt: any) => (
										<TableRow key={debt.id} className="bg-gray-50/50 dark:bg-gray-900/50">
											<TableCell
												suppressHydrationWarning
												className="whitespace-nowrap text-gray-400 dark:text-gray-500 text-xs sm:text-sm"
											>
												{new Date(debt.date).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "short",
													year: "numeric",
												})}
											</TableCell>
											<TableCell className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
												<s className="opacity-80">
													{debt.name.replace(/^(Pembayaran:\s*|Sisa:\s*)/i, "").split(" - ")[0]}
												</s>
											</TableCell>
											<TableCell className="text-right text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
												<s className="opacity-80">{formatCurrency(parseFloat(debt.amount))}</s>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</details>
				)}

				<div className="mt-12 pt-8 text-center space-y-4">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-sm mx-auto">
						<h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Capek inget-inget hutang?</h3>
						<p className="text-sm text-gray-500 mb-4">Coba Dompetku — gratis.</p>
						<a
							href="https://dompetku.treonstudio.com"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
						>
							Daftar Sekarang →
						</a>
					</div>
					<p className="text-xs text-gray-400">Dipakai 10.000+ orang untuk catat hutang bareng teman</p>
				</div>
			</div>

			{/* Smart Banner Mobile */}
			<div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] md:hidden flex items-center justify-between z-50">
				<div className="flex flex-col">
					<span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Buka di app Dompetku</span>
					<span className="text-xs text-gray-500">Pengalaman lebih baik</span>
				</div>
				<a
					href="https://dompetku.treonstudio.com"
					target="_blank"
					rel="noopener noreferrer"
					className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
				>
					Install →
				</a>
			</div>
		</div>
	);
}
