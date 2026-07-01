"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/shared/components/ui/dialog";

interface QrisDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bankName: string;
	accountHolder: string;
	qrisImage: string;
}

export default function QrisDialog({ open, onOpenChange, bankName, accountHolder, qrisImage }: QrisDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{bankName} QRIS</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col items-center gap-3 py-2">
					<img
						src={qrisImage}
						alt={`QRIS ${bankName} a.n. ${accountHolder}`}
						className="w-64 h-64 object-contain rounded-lg border bg-white p-2"
					/>
					<p className="text-sm text-muted-foreground text-center">a.n. {accountHolder}</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
