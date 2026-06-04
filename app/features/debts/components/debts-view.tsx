import { useState } from 'react';
import { formatInputPrice, parseInputPrice } from '~/shared/lib/formatter';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';


import LayoutHeader from '~/shared/components/layout/header';
import { Button } from '~/shared/components/ui/button';
import { Input } from '~/shared/components/ui/input';
import { Label } from '~/shared/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/shared/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/shared/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/shared/components/ui/select';
import { Switch } from '~/shared/components/ui/switch';

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value).replace(/\s+/g, ' ').replace(/\u00A0/g, ' ');
};
import url from '~/shared/constants/url';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DebtsView() {
	const { data: friends = [], refetch: mutate } = useQuery({ queryKey: ['debts'], queryFn: () => fetcher('/api/debts') });
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Form state
	const [friendName, setFriendName] = useState('');
	const [name, setName] = useState('');
	const [type, setType] = useState('I_OWE'); // I_OWE or OWES_ME
	const [amount, setAmount] = useState('');
	const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

	// Settings state
	const [editingFriend, setEditingFriend] = useState<any>(null);
	const [editSlug, setEditSlug] = useState('');
	const [editIsPublic, setEditIsPublic] = useState(true);

	const handleAddDebt = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		
		const res = await fetch('/api/debts', {
			method: 'POST',
			body: JSON.stringify({ friend_name: friendName, name, type, amount, date }),
			headers: { 'Content-Type': 'application/json' },
		});
		
		setIsLoading(false);
		if (res.ok) {
			toast.success('Debt added successfully');
			setIsOpen(false);
			setFriendName('');
			setName('');
			setAmount('');
			mutate();
		} else {
			toast.error('Failed to add debt');
		}
	};

	const handleDeleteDebt = async (id: string) => {
		const res = await fetch('/api/debts', {
			method: 'DELETE',
			body: JSON.stringify({ id }),
			headers: { 'Content-Type': 'application/json' },
		});
		if (res.ok) {
			toast.success('Debt deleted');
			mutate();
		}
	};
	
	const handleMarkPaid = async (id: string, currentStatus: string) => {
		const newStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
		const res = await fetch('/api/debts', {
			method: 'PUT',
			body: JSON.stringify({ id, status: newStatus }),
			headers: { 'Content-Type': 'application/json' },
		});
		if (res.ok) {
			toast.success(`Marked as ${newStatus}`);
			mutate();
		}
	};

	const copyLink = (slug: string) => {
		const shareUrl = `${window.location.origin}/share/${slug}`;
		navigator.clipboard.writeText(shareUrl);
		toast.success('Public link copied to clipboard!');
	};

	const handleUpdateSettings = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingFriend) return;
		setIsLoading(true);
		const res = await fetch('/api/friends', {
			method: 'PUT',
			body: JSON.stringify({ id: editingFriend.id, slug: editSlug, is_public: editIsPublic }),
			headers: { 'Content-Type': 'application/json' },
		});
		setIsLoading(false);
		if (res.ok) {
			toast.success('Link settings updated');
			setEditingFriend(null);
			mutate();
		} else {
			const data = await res.json();
			toast.error(data.message || 'Failed to update settings');
		}
	};

	let totalIOwe = 0;
	let totalOwesMe = 0;

	friends.forEach((friend: any) => {
		friend.debts.forEach((debt: any) => {
			if (debt.status === 'UNPAID') {
				if (debt.type === 'I_OWE') totalIOwe += parseFloat(debt.amount);
				if (debt.type === 'OWES_ME') totalOwesMe += parseFloat(debt.amount);
			}
		});
	});

	return (
		<>
			<LayoutHeader title="Hutang & Piutang (Debts)" />
			<div className="w-full p-4 pt-3 space-y-6">
				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
						<h3 className="text-sm font-medium text-red-600 dark:text-red-400">Total Saya Berhutang (I Owe)</h3>
						<p className="text-2xl font-bold mt-2">{formatCurrency(totalIOwe)}</p>
					</div>
					<div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
						<h3 className="text-sm font-medium text-green-600 dark:text-green-400">Total Teman Berhutang (Owes Me)</h3>
						<p className="text-2xl font-bold mt-2">{formatCurrency(totalOwesMe)}</p>
					</div>
				</div>

				{/* Add Debt Button & Dialog */}
				<div className="flex justify-between items-center">
					<h2 className="text-lg font-semibold">Daftar Teman & Transaksi</h2>
					<Dialog open={isOpen} onOpenChange={setIsOpen}>
						<DialogTrigger asChild>
							<Button>+ Tambah Catatan (Add Debt)</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Tambah Catatan Hutang/Piutang</DialogTitle>
							</DialogHeader>
							<form onSubmit={handleAddDebt} className="space-y-4">
								<div className="space-y-2">
									<Label>Nama Teman (Friend's Name)</Label>
									<Input required value={friendName} onChange={(e) => setFriendName(e.target.value)} placeholder="Misal: Budi" maxLength={30} />
								</div>
								<div className="space-y-2">
									<Label>Deskripsi / Judul (Description)</Label>
									<Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Misal: Makan Siang" maxLength={30} />
								</div>
								<div className="space-y-2">
									<Label>Tipe Transaksi (Type)</Label>
									<Select value={type} onValueChange={setType}>
										<SelectTrigger>
											<SelectValue placeholder="Pilih tipe" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="I_OWE">Saya berhutang (I Owe)</SelectItem>
											<SelectItem value="OWES_ME">Teman berhutang (Owes Me)</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Nominal (Amount)</Label>
									<Input required type="text" inputMode="decimal" value={formatInputPrice(amount)} onChange={(e) => setAmount(parseInputPrice(e.target.value))} placeholder="50000" />
								</div>
								<div className="space-y-2">
									<Label>Tanggal (Date)</Label>
									<Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
								</div>
								<Button type="submit" disabled={isLoading} className="w-full">
									{isLoading ? 'Menyimpan...' : 'Simpan'}
								</Button>
							</form>
						</DialogContent>
					</Dialog>
				</div>

				{/* Edit Link Settings Dialog */}
				<Dialog open={!!editingFriend} onOpenChange={(open) => !open && setEditingFriend(null)}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Pengaturan Tautan Publik</DialogTitle>
						</DialogHeader>
						{editingFriend && (
							<form onSubmit={handleUpdateSettings} className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label>Tautan Aktif (Public)</Label>
										<p className="text-sm text-gray-500">Izinkan siapapun yang memiliki link untuk melihat riwayat.</p>
									</div>
									<Switch checked={editIsPublic} onCheckedChange={setEditIsPublic} />
								</div>
								<div className="space-y-2">
									<Label>Custom Slug (URL Belakang)</Label>
									<Input required value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
									<p suppressHydrationWarning className="text-sm text-gray-500">Preview: {typeof window !== 'undefined' ? window.location.origin : ''}/share/{editSlug}</p>
								</div>
								<Button type="submit" disabled={isLoading} className="w-full">
									{isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
								</Button>
							</form>
						)}
					</DialogContent>
				</Dialog>

				{/* List Friends & Debts */}
				{friends.length === 0 ? (
					<div className="text-center text-gray-500 py-10">Belum ada catatan hutang/piutang.</div>
				) : (
					<div className="space-y-8">
						{friends.map((friend: any) => {
							let friendTotal = 0;
							friend.debts.forEach((debt: any) => {
								if (debt.status === 'UNPAID') {
									if (debt.type === 'I_OWE') friendTotal -= parseFloat(debt.amount);
									if (debt.type === 'OWES_ME') friendTotal += parseFloat(debt.amount);
								}
							});
							
							const isOwesYou = friendTotal > 0;
							const isYouOwe = friendTotal < 0;

							return (
								<div key={friend.id} className="border rounded-lg p-4 bg-card">
									<div className="flex justify-between items-center mb-4">
										<div>
											<h3 className="text-xl font-bold">{friend.name}</h3>
											<p className="text-sm text-gray-500">
												{isOwesYou ? `${friend.name} berhutang ${formatCurrency(Math.abs(friendTotal))} kepadamu` : ''}
												{isYouOwe ? `Kamu berhutang ${formatCurrency(Math.abs(friendTotal))} kepada ${friend.name}` : ''}
												{friendTotal === 0 ? 'Tidak ada hutang aktif.' : ''}
											</p>
										</div>
										<div className="space-x-2">
											<Button variant="outline" size="sm" onClick={() => {
												setEditingFriend(friend);
												setEditSlug(friend.slug);
												setEditIsPublic(friend.is_public);
											}}>
												⚙️ Pengaturan
											</Button>
											<Button variant="outline" size="sm" onClick={() => copyLink(friend.slug)}>
												🔗 Share Link
											</Button>
										</div>
									</div>

									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Tanggal</TableHead>
												<TableHead>Deskripsi</TableHead>
												<TableHead>Tipe</TableHead>
												<TableHead>Nominal</TableHead>
												<TableHead>Status</TableHead>
												<TableHead className="text-right">Aksi</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{friend.debts.map((debt: any) => (
												<TableRow key={debt.id} className={debt.status === 'PAID' ? 'opacity-50' : ''}>
													<TableCell suppressHydrationWarning>{new Date(debt.date).toLocaleDateString()}</TableCell>
													<TableCell>{debt.name}</TableCell>
													<TableCell>
														<span className={debt.type === 'I_OWE' ? 'text-red-500' : 'text-green-500'}>
															{debt.type === 'I_OWE' ? 'Saya Hutang' : 'Dihutangi'}
														</span>
													</TableCell>
													<TableCell>{formatCurrency(parseFloat(debt.amount))}</TableCell>
													<TableCell>
														<span className={debt.status === 'PAID' ? 'text-gray-500 font-bold' : 'text-orange-500 font-bold'}>
															{debt.status}
														</span>
													</TableCell>
													<TableCell className="text-right space-x-2">
														<Button size="sm" variant="secondary" onClick={() => handleMarkPaid(debt.id, debt.status)}>
															{debt.status === 'PAID' ? 'Unmark' : 'Lunas'}
														</Button>
														<Button size="sm" variant="destructive" onClick={() => handleDeleteDebt(debt.id)}>
															Hapus
														</Button>
													</TableCell>
												</TableRow>
											))}
											{friend.debts.length === 0 && (
												<TableRow>
													<TableCell colSpan={6} className="text-center py-4 text-gray-500">Tidak ada riwayat.</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</>
	);
}
