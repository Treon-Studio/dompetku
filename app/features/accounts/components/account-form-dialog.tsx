"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/shared/components/ui/dialog";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import type { PaymentAccount } from "~/core/db/schema";

interface AccountFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editing: PaymentAccount | null;
	onSuccess: () => void;
}

const MAX_QRIS_BYTES = 1_000_000;

const fileToDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});

export default function AccountFormDialog({ open, onOpenChange, editing, onSuccess }: AccountFormDialogProps) {
	const [bankName, setBankName] = useState("");
	const [accountNumber, setAccountNumber] = useState("");
	const [accountHolder, setAccountHolder] = useState("");
	const [qrisImage, setQrisImage] = useState<string | undefined>(undefined);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (editing) {
			setBankName(editing.bank_name);
			setAccountNumber(editing.account_number);
			setAccountHolder(editing.account_holder);
			setQrisImage(editing.qris_image ?? undefined);
		} else {
			setBankName("");
			setAccountNumber("");
			setAccountHolder("");
			setQrisImage(undefined);
		}
	}, [editing]);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > MAX_QRIS_BYTES) {
			toast.error("QRIS image must be smaller than 1 MB");
			e.target.value = "";
			return;
		}
		try {
			const dataUrl = await fileToDataUrl(file);
			setQrisImage(dataUrl);
		} catch (_err) {
			toast.error("Failed to read QRIS image");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		const formData = new FormData();
		if (editing) formData.append("id", editing.id);
		formData.append("bank_name", bankName);
		formData.append("account_number", accountNumber);
		formData.append("account_holder", accountHolder);
		if (qrisImage) formData.append("qris_image", qrisImage);

		try {
			const res = await fetch("/api/accounts", {
				method: editing ? "PUT" : "POST",
				body: formData,
			});
			const result = (await res.json()) as { success: boolean; error?: string };

			if (result.success) {
				toast.success(editing ? "Account updated" : "Account added");
				onOpenChange(false);
				onSuccess();
			} else {
				toast.error(result.error || "Failed to save account");
			}
		} catch (_err) {
			toast.error("An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{editing ? "Edit Rekening" : "Tambah Rekening"}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 mt-4">
					<div className="space-y-2">
						<Label htmlFor="bank_name">Bank / E-Wallet</Label>
						<Input
							id="bank_name"
							required
							maxLength={60}
							value={bankName}
							onChange={(e) => setBankName(e.target.value)}
							placeholder="BCA, GoPay, OVO..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="account_number">Nomor Rekening / HP</Label>
						<Input
							id="account_number"
							required
							maxLength={40}
							value={accountNumber}
							onChange={(e) => setAccountNumber(e.target.value)}
							placeholder="1234567890"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="account_holder">Nama Pemilik</Label>
						<Input
							id="account_holder"
							required
							maxLength={80}
							value={accountHolder}
							onChange={(e) => setAccountHolder(e.target.value)}
							placeholder="a.n."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="qris_image">Gambar QRIS (opsional, maks 1 MB)</Label>
						<Input id="qris_image" type="file" accept="image/*" onChange={handleFileChange} />
						{qrisImage && (
							<div className="flex items-center gap-2">
								<img src={qrisImage} alt="QRIS preview" className="h-16 w-16 object-contain border rounded" />
								<Button type="button" variant="ghost" size="sm" onClick={() => setQrisImage(undefined)}>
									Hapus
								</Button>
							</div>
						)}
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
							Batal
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Menyimpan..." : "Simpan"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
