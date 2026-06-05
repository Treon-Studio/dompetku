import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';

import { createDbClient } from '~/core/db.server';
import { friends, debts, users } from '~/core/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/shared/components/ui/table';

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value).replace(/\s+/g, ' ').replace(/\u00A0/g, ' ');
};

export const meta: MetaFunction = () => {
	return [
		{ title: 'Catatan Hutang Piutang (Shared)' },
		{ name: 'description', content: 'Rincian transaksi yang dibagikan.' },
	];
};

export async function loader({ params, context }: LoaderFunctionArgs) {
	const slug = params.slug;
	if (!slug) {
		throw new Response('Not Found', { status: 404 });
	}

	const db = createDbClient(context.cloudflare.env);
	const [friendRecord] = await db.select().from(friends).where(eq(friends.slug, slug)).limit(1);
	
	if (!friendRecord || !friendRecord.is_public) {
		throw new Response('Halaman ini bersifat privat atau tidak ditemukan.', { status: 404 });
	}

	const friendDebts = await db.select().from(debts).where(eq(debts.friend_id, friendRecord.id)).orderBy(desc(debts.date), desc(debts.created_at));
	const [userRecord] = await db.select().from(users).where(eq(users.id, friendRecord.user_id)).limit(1);

	const friend = {
		...friendRecord,
		debts: friendDebts,
		user: userRecord,
	};

	return json({ friend });
}

export default function SharedDebtPage() {
	const { friend } = useLoaderData<typeof loader>();
	
	let netAmount = 0; 
	
	friend.debts.forEach((debt: any) => {
		if (debt.status === 'UNPAID') {
			if (debt.type === 'I_OWE') netAmount -= parseFloat(debt.amount);
			if (debt.type === 'OWES_ME') netAmount += parseFloat(debt.amount);
		}
	});

	const viewerOwesUser = netAmount > 0;
	const userOwesViewer = netAmount < 0;

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 flex justify-center">
			<div className="max-w-3xl w-full space-y-6">
				<div className="text-center space-y-2 mb-8">
					<h1 className="text-3xl font-bold">Halo, {friend.name}!</h1>
					<p className="text-gray-500">Berikut adalah rekap catatan transaksi (hutang/piutang).</p>
				</div>
				
				<div className={`p-6 rounded-xl border text-center space-y-2 shadow-sm ${
					netAmount === 0 
						? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
						: viewerOwesUser 
							? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' 
							: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
				}`}>
					<h2 className="text-xl font-semibold">
						{netAmount === 0 && 'Semua hutang/piutang sudah lunas. 🎉'}
						{viewerOwesUser && 'Total yang harus kamu bayar (You Owe):'}
						{userOwesViewer && 'Total yang harus dibayar kepadamu (Owes You):'}
					</h2>
					{netAmount !== 0 && (
						<p className={`text-4xl font-bold ${viewerOwesUser ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
							{formatCurrency(Math.abs(netAmount))}
						</p>
					)}
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
					<Table>
						<TableHeader className="bg-gray-50 dark:bg-gray-900">
							<TableRow>
								<TableHead>Tanggal</TableHead>
								<TableHead>Deskripsi</TableHead>
								<TableHead>Tipe</TableHead>
								<TableHead className="text-right">Nominal</TableHead>
								<TableHead className="text-center">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{friend.debts.map((debt: any) => (
								<TableRow key={debt.id} className={debt.status === 'PAID' ? 'opacity-50' : ''}>
									<TableCell suppressHydrationWarning>{new Date(debt.date).toLocaleDateString('id-ID')}</TableCell>
									<TableCell>{debt.name}</TableCell>
									<TableCell>
										<span className={debt.type === 'I_OWE' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
											{debt.type === 'I_OWE' ? 'Temanmu Berhutang' : 'Kamu Berhutang'}
										</span>
									</TableCell>
									<TableCell className="text-right">{formatCurrency(parseFloat(debt.amount))}</TableCell>
									<TableCell className="text-center">
										{debt.status === 'PAID' && (
											<span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
												LUNAS
											</span>
										)}
									</TableCell>
								</TableRow>
							))}
							{friend.debts.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-6 text-gray-500">Tidak ada riwayat transaksi.</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="text-center text-sm text-gray-400">
					Dibuat menggunakan Dompetku
				</div>
			</div>
		</div>
	);
}
