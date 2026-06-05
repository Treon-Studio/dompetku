import { useState } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import LayoutHeader from '~/shared/components/layout/header';
import { Button } from '~/shared/components/ui/button';
import { Input } from '~/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/shared/components/ui/table';

export const meta: MetaFunction = () => {
	return [{ title: 'Dompetku - Manage Users' }];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminUsersPage() {
	const [search, setSearch] = useState('');
	const apiUrl = `/api/admin/users?q=${search}`;
	const {
		data: users = [],
		refetch: mutate,
		isLoading,
	} = useQuery({ queryKey: ['admin-users', apiUrl], queryFn: () => fetcher(apiUrl) });

	const handleAction = async (id: string, action: 'UPGRADE' | 'DOWNGRADE' | 'DELETE') => {
		if (action === 'DELETE') {
			if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
		}

		const res = await fetch('/api/admin/users', {
			method: 'POST',
			body: JSON.stringify({ id, action }),
			headers: { 'Content-Type': 'application/json' },
		});

		if (res.ok) {
			const data = (await res.json()) as { message?: string };
			toast.success(data.message);
			mutate();
		} else {
			toast.error('Action failed');
		}
	};

	return (
		<>
			<LayoutHeader title="Kelola Pengguna (Manage Users)" />
			<div className="p-6 space-y-6">
				<div className="flex justify-between items-center">
					<Input
						placeholder="Cari berdasarkan Email/Phone..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="max-w-md"
					/>
				</div>

				<div className="bg-card border rounded-lg overflow-hidden shadow-sm">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Email / Phone</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Plan</TableHead>
								<TableHead>Terdaftar</TableHead>
								<TableHead className="text-right">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading && (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-4 text-gray-500">
										Memuat data...
									</TableCell>
								</TableRow>
							)}
							{!isLoading &&
								((users as any[]) || []).map(
									(u: {
										id: string;
										email: string;
										phone: string;
										name: string;
										role: string;
										plan_status: string;
										created_at: string;
										subscription_id: string;
										order_status: string;
									}) => {
										const isPremium = u.plan_status === 'premium' && u.order_status === 'paid';
										return (
											<TableRow key={u.id}>
												<TableCell className="font-medium">{u.email || u.phone}</TableCell>
												<TableCell>
													<span
														className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}
													>
														{u.role}
													</span>
												</TableCell>
												<TableCell>
													<span
														className={`px-2 py-1 rounded-full text-xs font-semibold ${isPremium ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
													>
														{isPremium ? 'PREMIUM' : 'BASIC'}
													</span>
												</TableCell>
												<TableCell suppressHydrationWarning>{new Date(u.created_at).toLocaleDateString()}</TableCell>
												<TableCell className="text-right space-x-2">
													{isPremium ? (
														<Button variant="secondary" size="sm" onClick={() => handleAction(u.id, 'DOWNGRADE')}>
															Demote to Basic
														</Button>
													) : (
														<Button variant="outline" size="sm" onClick={() => handleAction(u.id, 'UPGRADE')}>
															Upgrade Premium
														</Button>
													)}
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleAction(u.id, 'DELETE')}
														disabled={u.role === 'ADMIN'}
													>
														Hapus
													</Button>
												</TableCell>
											</TableRow>
										);
									}
								)}
							{!isLoading && ((users as any[]) || []).length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-4 text-gray-500">
										Tidak ada pengguna ditemukan.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</>
	);
}
