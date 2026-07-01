"use client";

import { useState } from "react";
import { Copy, Pen2, QrCode, TrashBinMinimalistic } from "@solar-icons/react";
import { toast } from "sonner";
import { Button } from "~/shared/components/ui/button";
import { Card, CardContent } from "~/shared/components/ui/card";
import type { PaymentAccount } from "~/core/db/schema";
import QrisDialog from "./qris-dialog";

interface AccountCardProps {
	account: PaymentAccount;
	onEdit: (account: PaymentAccount) => void;
	onDelete: (id: string) => void;
}

const maskAccountNumber = (value: string) => {
	if (value.length <= 4) return value;
	const middle = "•".repeat(Math.max(4, value.length - 4));
	return `${value.slice(0, 2)}${middle}${value.slice(-2)}`;
};

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
	const [qrisOpen, setQrisOpen] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(account.account_number);
			toast.success("Nomor rekening disalin");
		} catch (_err) {
			toast.error("Gagal menyalin nomor");
		}
	};

	return (
		<>
			<Card>
				<CardContent className="p-4 flex items-start justify-between gap-4">
					<div className="min-w-0 flex-1 space-y-1">
						<h3 className="font-semibold text-base truncate">{account.bank_name}</h3>
						<p className="text-sm text-muted-foreground">a.n. {account.account_holder}</p>
						<p className="font-mono text-sm tracking-wide">{maskAccountNumber(account.account_number)}</p>
					</div>
					<div className="flex flex-col sm:flex-row gap-2 shrink-0">
						<Button variant="outline" size="sm" onClick={handleCopy} title="Salin nomor">
							<Copy className="h-4 w-4" />
							<span className="sr-only">Salin</span>
						</Button>
						{account.qris_image && (
							<Button variant="outline" size="sm" onClick={() => setQrisOpen(true)} title="Lihat QRIS">
								<QrCode className="h-4 w-4" />
								<span className="sr-only">QRIS</span>
							</Button>
						)}
						<Button variant="ghost" size="sm" onClick={() => onEdit(account)} title="Edit">
							<Pen2 className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="sm" onClick={() => onDelete(account.id)} title="Hapus">
							<TrashBinMinimalistic className="h-4 w-4 text-red-500" />
						</Button>
					</div>
				</CardContent>
			</Card>

			{account.qris_image && (
				<QrisDialog
					open={qrisOpen}
					onOpenChange={setQrisOpen}
					bankName={account.bank_name}
					accountHolder={account.account_holder}
					qrisImage={account.qris_image}
				/>
			)}
		</>
	);
}
