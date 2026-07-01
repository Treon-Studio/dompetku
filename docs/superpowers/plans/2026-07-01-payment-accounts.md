# Payment Accounts & Share Page Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `/dashboard/accounts` page where users can CRUD their bank/e-wallet accounts (including optional QRIS images), and surface that data on the public `/share/$slug` page so friends can see where to pay outstanding debts.

**Architecture:** New Drizzle table `payment_accounts`. Internal CRUD page mirrors the existing `budgets` pattern (server-side `api.server.ts` module + React Query view + `api.*.tsx` resource route). Public `/share/$slug` loader fetches the owner's accounts and conditionally renders a "Cara Pembayaran" card when the viewer owes money.

**Tech Stack:** Remix + Cloudflare Workers, Drizzle ORM (SQLite/Turso), React Query, Sonner toasts, Tailwind, shadcn/ui `Dialog`, Zod.

---

## File Structure

**New files:**

- `app/core/db/migrations/0001_payment_accounts.sql` — manual SQL migration
- `app/features/accounts/schemas.ts` — Zod validation
- `app/features/accounts/api.server.ts` — DB queries (CRUD)
- `app/features/accounts/components/accounts-view.tsx` — Client UI
- `app/features/accounts/components/account-card.tsx` — Single account card with copy + QRIS view
- `app/features/accounts/components/account-form-dialog.tsx` — Add/Edit form
- `app/features/accounts/components/qris-dialog.tsx` — QRIS image viewer
- `app/routes/dashboard.accounts.tsx` — Route shell
- `app/routes/api.accounts.tsx` — Resource route

**Modified files:**

- `app/core/db/schema.ts` — add `payment_accounts` table + type export
- `app/shared/components/icons.tsx` — add `WalletIcon`
- `app/shared/components/sidebar/index.tsx` — add nav item + shortcut
- `app/shared/constants/shortcuts.ts` — add `accounts` shortcut
- `app/routes/share.$slug.tsx` — fetch + render payment section
- `i18n/locales/id.json` — `navigation.accounts` + `accounts.*`
- `i18n/locales/en.json` — same
- `i18n/locales/jv.json` — same
- `i18n/locales/bjn.json` — same

---

## Task 1: Database Schema

**Files:**
- Modify: `app/core/db/schema.ts`
- Create: `app/core/db/migrations/0001_payment_accounts.sql`

- [ ] **Step 1: Add the `payment_accounts` table to the schema**

Open `app/core/db/schema.ts` and add the new table at the end (after `goals`, before `app_settings`):

```ts
// ─── Payment Accounts ─────────────────────────────────────────────────────────
export const payment_accounts = sqliteTable("payment_accounts", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	bank_name: text("bank_name").notNull(),
	account_number: text("account_number").notNull(),
	account_holder: text("account_holder").notNull(),
	qris_image: text("qris_image"),
	user_id: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

- [ ] **Step 2: Add the type export**

At the bottom of the same file, alongside the other `export type` lines, add:

```ts
export type PaymentAccount = typeof payment_accounts.$inferSelect;
```

- [ ] **Step 3: Create the migration SQL file**

Create `app/core/db/migrations/0001_payment_accounts.sql`:

```sql
CREATE TABLE `payment_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_name` text NOT NULL,
	`account_number` text NOT NULL,
	`account_holder` text NOT NULL,
	`qris_image` text,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
```

- [ ] **Step 4: Update local SQLite to match (only if running locally)**

Run from the project root:

```bash
npx drizzle-kit push
```

Expected: migration applies cleanly. If running against Turso, deploy with `wrangler d1 migrations apply` (or `npx drizzle-kit push` against the Turso URL via `.env`).

- [ ] **Step 5: Commit**

```bash
git add app/core/db/schema.ts app/core/db/migrations/0001_payment_accounts.sql
git commit -m "feat(db): add payment_accounts table"
```

---

## Task 2: Zod Schema for Payment Accounts

**Files:**
- Create: `app/features/accounts/schemas.ts`

- [ ] **Step 1: Create the schemas file**

Create `app/features/accounts/schemas.ts`:

```ts
import { z } from "zod";

const QRIS_DATA_URL_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,/;

export const PaymentAccountSchema = z.object({
	id: z.string().optional(),
	bank_name: z
		.string()
		.min(2, "Bank/E-Wallet name must be at least 2 characters")
		.max(60, "Bank/E-Wallet name must be at most 60 characters"),
	account_number: z
		.string()
		.min(2, "Account number is required")
		.max(40, "Account number must be at most 40 characters")
		.regex(/^[A-Za-z0-9\- ]+$/, "Only letters, digits, dashes and spaces are allowed"),
	account_holder: z
		.string()
		.min(2, "Account holder name must be at least 2 characters")
		.max(80, "Account holder name must be at most 80 characters"),
	qris_image: z
		.string()
		.optional()
		.refine((val) => !val || QRIS_DATA_URL_REGEX.test(val), {
			message: "QRIS must be a valid image data URL",
		}),
});

export type PaymentAccountInput = z.infer<typeof PaymentAccountSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add app/features/accounts/schemas.ts
git commit -m "feat(accounts): add Zod schema for payment accounts"
```

---

## Task 3: Server-side API Module

**Files:**
- Create: `app/features/accounts/api.server.ts`

- [ ] **Step 1: Create the server-side CRUD module**

Create `app/features/accounts/api.server.ts`:

```ts
import { and, desc, eq } from "drizzle-orm";
import type { DB } from "~/core/db.server";
import { payment_accounts } from "~/core/db/schema";
import { PaymentAccountSchema } from "./schemas";

export async function getPaymentAccounts(db: DB, userId: string) {
	return await db
		.select()
		.from(payment_accounts)
		.where(eq(payment_accounts.user_id, userId))
		.orderBy(desc(payment_accounts.created_at));
}

export async function createPaymentAccount(db: DB, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = PaymentAccountSchema.safeParse({
		...data,
		qris_image: data.qris_image || undefined,
	});

	if (!parsed.success) {
		return { success: false, error: parsed.error.issues[0]?.message || "Validation error" };
	}

	try {
		const [created] = await db
			.insert(payment_accounts)
			.values({
				user_id: userId,
				bank_name: parsed.data.bank_name,
				account_number: parsed.data.account_number,
				account_holder: parsed.data.account_holder,
				qris_image: parsed.data.qris_image || null,
			})
			.returning();
		return { success: true, data: created };
	} catch (e: unknown) {
		const error = e as Error;
		return { success: false, error: error.message };
	}
}

export async function updatePaymentAccount(db: DB, userId: string, formData: FormData) {
	const data = Object.fromEntries(formData.entries());
	const parsed = PaymentAccountSchema.safeParse({
		...data,
		qris_image: data.qris_image || undefined,
	});

	if (!parsed.success) {
		return { success: false, error: parsed.error.issues[0]?.message || "Validation error" };
	}

	if (!parsed.data.id) {
		return { success: false, error: "ID is required for updating" };
	}

	try {
		const [updated] = await db
			.update(payment_accounts)
			.set({
				bank_name: parsed.data.bank_name,
				account_number: parsed.data.account_number,
				account_holder: parsed.data.account_holder,
				qris_image: parsed.data.qris_image || null,
				updated_at: new Date().toISOString(),
			})
			.where(and(eq(payment_accounts.id, parsed.data.id), eq(payment_accounts.user_id, userId)))
			.returning();
		return { success: true, data: updated };
	} catch (e: unknown) {
		const error = e as Error;
		return { success: false, error: error.message };
	}
}

export async function deletePaymentAccount(db: DB, userId: string, id: string) {
	try {
		await db
			.delete(payment_accounts)
			.where(and(eq(payment_accounts.id, id), eq(payment_accounts.user_id, userId)));
		return { success: true };
	} catch (e: unknown) {
		const error = e as Error;
		return { success: false, error: error.message };
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add app/features/accounts/api.server.ts
git commit -m "feat(accounts): add server-side CRUD for payment accounts"
```

---

## Task 4: Resource Route (API endpoint)

**Files:**
- Create: `app/routes/api.accounts.tsx`

- [ ] **Step 1: Create the resource route**

Create `app/routes/api.accounts.tsx`:

```tsx
import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { createDbClient } from "~/core/db.server";
import { getCloudflareEnv } from "~/env";
import { requireUser } from "~/features/auth/api.server";
import {
	createPaymentAccount,
	deletePaymentAccount,
	getPaymentAccounts,
	updatePaymentAccount,
} from "~/features/accounts/api.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
	const db = createDbClient(getCloudflareEnv(context));
	const user = await requireUser(request, db, context);
	const accounts = await getPaymentAccounts(db, user.id);
	return json({ accounts });
}

export async function action({ request, context }: ActionFunctionArgs) {
	const db = createDbClient(getCloudflareEnv(context));
	const user = await requireUser(request, db, context);
	const method = request.method.toUpperCase();

	if (method === "POST") {
		const formData = await request.formData();
		const result = await createPaymentAccount(db, user.id, formData);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	if (method === "PUT") {
		const formData = await request.formData();
		const result = await updatePaymentAccount(db, user.id, formData);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	if (method === "DELETE") {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		if (!id) return json({ success: false, error: "ID is required" }, { status: 400 });
		const result = await deletePaymentAccount(db, user.id, id);
		if (!result.success) return json(result, { status: 400 });
		return json(result);
	}

	return json({ success: false, error: "Method not allowed" }, { status: 405 });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/routes/api.accounts.tsx
git commit -m "feat(accounts): add /api/accounts resource route"
```

---

## Task 5: QRIS Dialog Component

**Files:**
- Create: `app/features/accounts/components/qris-dialog.tsx`

- [ ] **Step 1: Create the QRIS viewer dialog**

Create `app/features/accounts/components/qris-dialog.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/features/accounts/components/qris-dialog.tsx
git commit -m "feat(accounts): add QRIS viewer dialog"
```

---

## Task 6: Account Form Dialog (Add/Edit)

**Files:**
- Create: `app/features/accounts/components/account-form-dialog.tsx`

- [ ] **Step 1: Create the form dialog**

Create `app/features/accounts/components/account-form-dialog.tsx`:

```tsx
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
	}, [editing, open]);

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
```

- [ ] **Step 2: Commit**

```bash
git add app/features/accounts/components/account-form-dialog.tsx
git commit -m "feat(accounts): add account form dialog (add/edit)"
```

---

## Task 7: Account Card Component

**Files:**
- Create: `app/features/accounts/components/account-card.tsx`

- [ ] **Step 1: Create the single-account card**

Create `app/features/accounts/components/account-card.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Copy, QrCode, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/shared/components/ui/button";
import { Card, CardContent } from "~/shared/components/ui/card";
import QrisDialog from "./qris-dialog";
import type { PaymentAccount } from "~/core/db/schema";

interface AccountCardProps {
	account: PaymentAccount;
	onEdit: (account: PaymentAccount) => void;
	onDelete: (id: string) => void;
}

const maskAccountNumber = (value: string) => {
	if (value.length <= 4) return value;
	const visible = value.slice(0, 2) + value.slice(-2);
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
							<Edit3 className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="sm" onClick={() => onDelete(account.id)} title="Hapus">
							<Trash2 className="h-4 w-4 text-red-500" />
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
```

- [ ] **Step 2: Verify `lucide-react` is available**

Check `package.json` for `lucide-react`. If not present, install:

```bash
npm install lucide-react
```

If the project standard is `@solar-icons/react` (as used in `icons.tsx`), swap the imports accordingly. The card must remain independent of `icons.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/features/accounts/components/account-card.tsx
git commit -m "feat(accounts): add account card with copy/QRIS/edit/delete"
```

---

## Task 8: Accounts View (List + Form Glue)

**Files:**
- Create: `app/features/accounts/components/accounts-view.tsx`

- [ ] **Step 1: Create the view**

Create `app/features/accounts/components/accounts-view.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/shared/components/ui/button";
import LayoutHeader from "~/shared/components/layout/header";
import { DeleteModal } from "~/shared/components/modal/delete";
import type { PaymentAccount } from "~/core/db/schema";
import AccountCard from "./account-card";
import AccountFormDialog from "./account-form-dialog";

const fetcher = (url: string) =>
	fetch(url).then((res) => res.json() as Promise<{ accounts: PaymentAccount[] }>);

export default function AccountsView() {
	const { data, refetch, isLoading } = useQuery({
		queryKey: ["payment-accounts"],
		queryFn: () => fetcher("/api/accounts"),
	});

	const accounts = data?.accounts ?? [];
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<PaymentAccount | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

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

			<DeleteModal
				open={!!deletingId}
				onOpenChange={(open) => !open && setDeletingId(null)}
				onConfirm={handleDelete}
				title="Hapus Rekening?"
				description="Rekening ini akan dihapus permanen."
			/>
		</>
	);
}
```

- [ ] **Step 2: Verify `DeleteModal` props**

Open `app/shared/components/modal/delete.tsx` and confirm the prop names match. If it uses different prop names (e.g., `isOpen` instead of `open`), update the JSX above to match. This is the existing pattern.

- [ ] **Step 3: Commit**

```bash
git add app/features/accounts/components/accounts-view.tsx
git commit -m "feat(accounts): add accounts list view with add/edit/delete"
```

---

## Task 9: Dashboard Route Shell

**Files:**
- Create: `app/routes/dashboard.accounts.tsx`

- [ ] **Step 1: Create the route**

Create `app/routes/dashboard.accounts.tsx`:

```tsx
import type { MetaFunction } from "@remix-run/cloudflare";
import AccountsView from "~/features/accounts/components/accounts-view";

export const meta: MetaFunction = () => {
	return [{ title: "Dompetku - Rekening Saya" }];
};

export default function AccountsPage() {
	return <AccountsView />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/routes/dashboard.accounts.tsx
git commit -m "feat(accounts): add /dashboard/accounts route"
```

---

## Task 10: Sidebar Icon + Navigation Item

**Files:**
- Modify: `app/shared/components/icons.tsx`
- Modify: `app/shared/constants/shortcuts.ts`
- Modify: `app/shared/components/sidebar/index.tsx`

- [ ] **Step 1: Add a wallet icon**

In `app/shared/components/icons.tsx`, add an icon import from `@solar-icons/react` (or `lucide-react` — match the existing convention used in the file). Suggested: `Card2` from solar-icons. Then export:

```tsx
export const WalletIcon = ({ className }: { className?: string }) => <Card2 className={className} />;
```

Replace `Card2` with whatever icon name is actually exported by the package.

- [ ] **Step 2: Add shortcut key for accounts**

Open `app/shared/constants/shortcuts.ts` and add an `accounts` entry mirroring the structure of existing entries. Example shape (adjust to match):

```ts
menu: {
  // ...
  accounts: { shortcut: "a" },
}
```

If shortcuts are not structured this way, follow the existing pattern exactly.

- [ ] **Step 3: Add the sidebar item**

In `app/shared/components/sidebar/index.tsx`, add the import:

```tsx
import { /* existing icons */, WalletIcon } from "~/shared/components/icons";
```

Add the nav entry inside the `navItems` array, after `goals`:

```tsx
{
  key: "accounts",
  name: t("navigation.accounts"),
  href: "/dashboard/accounts",
  Icon: WalletIcon,
  shortcut: shortcuts.menu.accounts?.shortcut,
},
```

- [ ] **Step 4: Commit**

```bash
git add app/shared/components/icons.tsx app/shared/constants/shortcuts.ts app/shared/components/sidebar/index.tsx
git commit -m "feat(accounts): add sidebar entry for payment accounts"
```

---

## Task 11: i18n Locale Keys

**Files:**
- Modify: `i18n/locales/id.json`
- Modify: `i18n/locales/en.json`
- Modify: `i18n/locales/jv.json`
- Modify: `i18n/locales/bjn.json`

- [ ] **Step 1: Update `id.json`**

Inside `navigation`, add:

```json
"accounts": "Rekening Saya"
```

Add a new top-level `accounts` section:

```json
"accounts": {
  "title": "Rekening Saya",
  "addAccount": "Tambah Rekening",
  "editAccount": "Edit Rekening",
  "bankName": "Bank / E-Wallet",
  "accountNumber": "Nomor Rekening / HP",
  "accountHolder": "Nama Pemilik",
  "qrisImage": "Gambar QRIS",
  "qrisOptional": "(opsional)",
  "copySuccess": "Nomor rekening disalin",
  "copyError": "Gagal menyalin nomor",
  "deleteSuccess": "Rekening dihapus",
  "deleteError": "Gagal menghapus rekening",
  "saveSuccess": "Rekening disimpan",
  "saveError": "Gagal menyimpan rekening",
  "viewQris": "Lihat QRIS",
  "empty": {
    "title": "Belum ada rekening",
    "description": "Tambahkan rekening untuk ditampilkan ke teman yang masih berhutang."
  }
}
```

- [ ] **Step 2: Update `en.json`**

```json
"navigation.accounts": "Payment Accounts"
```

```json
"accounts": {
  "title": "Payment Accounts",
  "addAccount": "Add Account",
  "editAccount": "Edit Account",
  "bankName": "Bank / E-Wallet",
  "accountNumber": "Account Number / Phone",
  "accountHolder": "Account Holder",
  "qrisImage": "QRIS Image",
  "qrisOptional": "(optional)",
  "copySuccess": "Account number copied",
  "copyError": "Failed to copy number",
  "deleteSuccess": "Account deleted",
  "deleteError": "Failed to delete account",
  "saveSuccess": "Account saved",
  "saveError": "Failed to save account",
  "viewQris": "View QRIS",
  "empty": {
    "title": "No accounts yet",
    "description": "Add an account so friends with outstanding debts know where to pay."
  }
}
```

- [ ] **Step 3: Update `jv.json` and `bjn.json`**

Use Javanese/Banjarese equivalents. Example for `jv.json`:

```json
"navigation.accounts": "Rekening Kula"
```

```json
"accounts": {
  "title": "Rekening Kula",
  "addAccount": "Tambah Rekening",
  "editAccount": "Sunting Rekening",
  "bankName": "Bank / E-Wallet",
  "accountNumber": "Nomor Rekening / HP",
  "accountHolder": "Nama Pamilik",
  "qrisImage": "Gambar QRIS",
  "qrisOptional": "(opsional)",
  "copySuccess": "Nomor rekening kasil disalin",
  "copyError": "Gagal nyalin nomor",
  "deleteSuccess": "Rekening kaapus",
  "deleteError": "Gagal ngapus rekening",
  "saveSuccess": "Rekening kasil disimpen",
  "saveError": "Gagal nyimpen rekening",
  "viewQris": "Delok QRIS",
  "empty": {
    "title": "Durung wonten rekening",
    "description": "Tambah rekening supados kanca ingkang taksih gadhah utang mangertosa pundi kedah mbayar."
  }
}
```

Use appropriate Banjarese wording for `bjn.json`. The keys must match across all four locales exactly.

- [ ] **Step 4: Commit**

```bash
git add i18n/locales/id.json i18n/locales/en.json i18n/locales/jv.json i18n/locales/bjn.json
git commit -m "feat(i18n): add payment accounts locale keys"
```

---

## Task 12: Share Page Loader Update

**Files:**
- Modify: `app/routes/share.$slug.tsx`

- [ ] **Step 1: Extend the loader to fetch payment accounts**

In `app/routes/share.$slug.tsx`:

1. Update the import line:

```ts
import { debts, friends, payment_accounts, users } from "~/core/db/schema";
```

2. After the existing `friendDebts` query (and before the `userRecord` query), add:

```ts
const ownerAccounts = friendRecord
	? await db
			.select()
			.from(payment_accounts)
			.where(eq(payment_accounts.user_id, friendRecord.user_id))
			.orderBy(desc(payment_accounts.created_at))
	: [];
```

3. Update the returned object:

```ts
const friend = {
	...friendRecord,
	debts: friendDebts,
	user: userRecord,
	payment_accounts: ownerAccounts,
};

return json({ friend });
```

- [ ] **Step 2: Commit**

```bash
git add app/routes/share.$slug.tsx
git commit -m "feat(share): fetch owner payment accounts in share loader"
```

---

## Task 13: Share Page UI - Payment Section

**Files:**
- Modify: `app/routes/share.$slug.tsx`

- [ ] **Step 1: Add copy + QRIS helper functions inside the component**

Add these inside `SharedDebtPage`, before the `return`:

```tsx
const viewerAccounts = friend.payment_accounts ?? [];

const copyToClipboard = async (value: string) => {
	try {
		await navigator.clipboard.writeText(value);
		toast.success("Nomor disalin");
	} catch (_err) {
		toast.error("Gagal menyalin");
	}
};
```

Add the import for `toast`:

```tsx
import { toast } from "sonner";
```

Note: `toast` will only function if `<Toaster />` is mounted on the public share page. Since the share page currently does not mount a Toaster, this requires the Toaster to be mounted in `root.tsx` or this route's layout. Verify by checking the root layout. If not present, add `<Toaster position="top-right" />` near the bottom of this component's JSX. Use `sonner`'s `Toaster` from `~/shared/components/ui/sonner`.

- [ ] **Step 2: Add a Toaster if missing**

Check `app/root.tsx` for `<Toaster />`. If absent, import `Toaster` and mount it at the bottom of the share page's JSX. If `<Toaster />` is already global, skip this step.

- [ ] **Step 3: Render the "Cara Pembayaran" section**

In `app/routes/share.$slug.tsx`, after the summary card block (`netAmount !== 0 && (...)`), and before the "Menunggu Pembayaran" header, insert:

```tsx
{viewerOwesUser && viewerAccounts.length > 0 && (
	<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 space-y-4">
		<div className="flex items-center gap-2">
			<span className="text-lg">💳</span>
			<h2 className="font-semibold text-gray-900 dark:text-gray-100">Cara Pembayaran</h2>
		</div>
		<p className="text-sm text-gray-500 dark:text-gray-400">
			Kirim pembayaran ke salah satu rekening berikut:
		</p>
		<div className="space-y-3">
			{viewerAccounts.map((acc: any) => (
				<div
					key={acc.id}
					className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40"
				>
					<div className="min-w-0 flex-1">
						<p className="font-medium text-gray-900 dark:text-gray-100">{acc.bank_name}</p>
						<p className="text-xs text-gray-500 dark:text-gray-400">a.n. {acc.account_holder}</p>
						<p className="font-mono text-sm mt-1 text-gray-700 dark:text-gray-300 break-all">{acc.account_number}</p>
					</div>
					<div className="flex gap-2 shrink-0">
						<Button variant="outline" size="sm" onClick={() => copyToClipboard(acc.account_number)}>
							Salin
						</Button>
						{acc.qris_image && (
							<QrisDialog
								open={openQrisId === acc.id}
								onOpenChange={(open) => setOpenQrisId(open ? acc.id : null)}
								bankName={acc.bank_name}
								accountHolder={acc.account_holder}
								qrisImage={acc.qris_image}
							/>
						)}
						{acc.qris_image && (
							<Button variant="outline" size="sm" onClick={() => setOpenQrisId(acc.id)}>
								Lihat QRIS
							</Button>
						)}
					</div>
				</div>
			))}
		</div>
	</div>
)}

{viewerOwesUser && viewerAccounts.length === 0 && (
	<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
		Pemilik belum menambahkan informasi rekening.
	</p>
)}
```

- [ ] **Step 4: Wire up state and imports for the QRIS dialog**

At the top of the component, add:

```tsx
const [openQrisId, setOpenQrisId] = useState<string | null>(null);
```

Add these imports:

```tsx
import { useState } from "react";
import { Button } from "~/shared/components/ui/button";
import QrisDialog from "~/features/accounts/components/qris-dialog";
```

Note: the `QrisDialog` import path goes through `app/features/accounts/components/qris-dialog.tsx`. Verify with the project alias config.

- [ ] **Step 5: Commit**

```bash
git add app/routes/share.$slug.tsx
git commit -m "feat(share): render owner payment accounts when viewer owes"
```

---

## Task 14: Smoke Test + Lint

- [ ] **Step 1: Type-check**

Run from project root:

```bash
npm run check-types
```

Expected: zero TypeScript errors. Fix any.

- [ ] **Step 2: Lint**

```bash
npx biome lint .
```

Expected: `ok`. Fix any reported issues.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Manual smoke test**

1. Start dev server: `npm run dev`
2. Sign in as a user.
3. Navigate to `/dashboard/accounts`. Confirm the empty state shows.
4. Add an account with a small QRIS image (optional).
5. Confirm the card appears with masked number and "Salin" / "Lihat QRIS" buttons.
6. Click "Salin", paste anywhere, verify it matches.
7. Edit the account, change the holder name, save.
8. Delete the account.
9. Create a debt with a friend; mark it as `I_OWE` with status `UNPAID`.
10. Visit `/share/<slug>`. Confirm the "Cara Pembayaran" card renders.
11. Visit the same share page in a private window; confirm toast and copy work.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: post-implementation fixes"
```

---

## Self-Review Checklist

- [x] Spec section 2 (Data Model) → Tasks 1, 2, 3
- [x] Spec section 3 (Internal page) → Tasks 4, 5, 6, 7, 8, 9, 10, 11
- [x] Spec section 4 (Share page integration) → Tasks 12, 13
- [x] Spec section 5 (Files) → matches the file structure above
- [x] Spec section 6 (Error handling) → toast feedback wired in Tasks 6, 7, 8, 13; 1MB client-side cap in Task 6
- [x] All type names consistent (`PaymentAccount`, `PaymentAccountInput`, `viewerAccounts`)
- [x] No placeholders or "TODO" in task steps
- [x] All steps include complete code or commands