"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import type { PaymentAccount } from "~/core/db/schema";
import LayoutHeader from "~/shared/components/layout/header";
import { Button } from "~/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/shared/components/ui/dialog";
import AccountCard from "./account-card";
import AccountFormDialog from "./account-form-dialog";

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<{ accounts: PaymentAccount[] }>);

export default function AccountsView() {
	const { data, refetch, isLoading } = useQuery({
		queryKey: ["payment-accounts"],
		queryFn: () => fetcher("/api/accounts"),
	});

	const accounts = data?.accounts ?? [];
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<PaymentAccount | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleEdit = (account: PaymentAccount) => {
		setEditing(account);
		setFormOpen(true);
	};

	const handleAdd = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		setIsDeleting(true);
		const formData = new FormData();
		formData.append("id", deletingId);
		try {
			const res = await fetch("/api/accounts", { method: "DELETE", body: formData });
			const result = (await res.json()) as { success: boolean; error?: string };
			if (result.success) {
				toast.success("Rekening dihapus");
				setDeletingId(null);
				refetch();
			} else {
				toast.error(result.error || "Gagal menghapus rekening");
			}
		} catch (_err) {
			toast.error("Terjadi kesalahan");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<>
			<LayoutHeader title="Rekening Saya" />
			<div className="p-4 md:p-6 space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-2xl font-semibold tracking-tight text-primary">Rekening Saya</h2>
						<p className="text-sm text-muted-foreground">
							Simpan daftar rekening & QRIS untuk ditampilkan ke teman yang masih berhutang.
						</p>
					</div>
					<Button onClick={handleAdd}>Tambah Rekening</Button>
				</div>

				{isLoading ? (
					<p>Memuat...</p>
				) : accounts.length === 0 ? (
					<div className="text-center py-12 border border-dashed rounded-lg space-y-3">
						<p className="text-muted-foreground">Belum ada rekening yang disimpan.</p>
						<Button variant="outline" onClick={handleAdd}>
							Tambah Rekening Pertama
						</Button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{accounts.map((acc) => (
							<AccountCard key={acc.id} account={acc} onEdit={handleEdit} onDelete={(id) => setDeletingId(id)} />
						))}
					</div>
				)}
			</div>

			<AccountFormDialog
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) setEditing(null);
				}}
				editing={editing}
				onSuccess={() => refetch()}
			/>

			<Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Hapus Rekening?</DialogTitle>
						<DialogDescription>Rekening ini akan dihapus permanen.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeletingId(null)} disabled={isDeleting}>
							Batal
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
							{isDeleting ? "Menghapus..." : "Hapus"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
