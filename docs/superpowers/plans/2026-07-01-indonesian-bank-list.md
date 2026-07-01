# Indonesian Bank List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text `bank_name` Input in the Add/Edit Account dialog with a grouped Select dropdown of Indonesian banks, e-wallets, and digital banks. Backend, schema, and API remain unchanged.

**Architecture:** New `app/shared/constants/indonesian-banks.ts` constant following the existing `groupedExpenses` shape. Modify `account-form-dialog.tsx` to render a `<Select>` from `~/shared/components/ui/select` populated by iterating the constant. The selected display name is the value (string), preserving compatibility with existing stored data.

**Tech Stack:** React, Radix UI Select (via `~/shared/components/ui/select`), Tailwind. No backend changes.

---

## File Structure

**New files:**

- `app/shared/constants/indonesian-banks.ts` — exports `groupedIndonesianBanks` constant.

**Modified files:**

- `app/features/accounts/components/account-form-dialog.tsx` — replace `<Input id="bank_name">` with `<Select>` block.

No DB, API, route, or i18n changes.

---

## Task 1: Create the Indonesian Banks Constant

**Files:**
- Create: `app/shared/constants/indonesian-banks.ts`

- [ ] **Step 1: Create the constant file**

Create `app/shared/constants/indonesian-banks.ts`:

```ts
export const groupedIndonesianBanks = {
	bank: {
		name: "Bank",
		icon: "🏦",
		list: {
			bca: { name: "BCA" },
			bri: { name: "BRI" },
			bni: { name: "BNI" },
			mandiri: { name: "Mandiri" },
			bsi: { name: "BSI" },
			cimb: { name: "CIMB Niaga" },
			danamon: { name: "Danamon" },
			permata: { name: "Permata" },
			ocbc: { name: "OCBC" },
			maybank: { name: "Maybank" },
			panin: { name: "Panin" },
			btn: { name: "BTN" },
			bjb: { name: "Bank BJB" },
		},
	},
	digital: {
		name: "Bank Digital",
		icon: "📱",
		list: {
			jenius: { name: "Jenius (BTPN)" },
			jago: { name: "Bank Jago" },
			blu: { name: "blu by BCA Digital" },
			seabank: { name: "SeaBank" },
			linebank: { name: "LINE Bank" },
			worlio: { name: "Worli (Bank Saqu)" },
			allo: { name: "Allo Bank" },
		},
	},
	ewallet: {
		name: "E-Wallet",
		icon: "💳",
		list: {
			gopay: { name: "GoPay" },
			ovo: { name: "OVO" },
			dana: { name: "DANA" },
			shopeepay: { name: "ShopeePay" },
			linkaja: { name: "LinkAja" },
			isaku: { name: "i.Saku" },
		},
	},
};
```

- [ ] **Step 2: Commit**

```bash
git add app/shared/constants/indonesian-banks.ts
git commit -m "feat(accounts): add Indonesian bank list constant"
```

---

## Task 2: Replace Bank Name Input with Select

**Files:**
- Modify: `app/features/accounts/components/account-form-dialog.tsx`

- [ ] **Step 1: Add new imports**

In the import block at the top of the file, add these new imports alongside the existing `~/shared/components/ui/button`, `~/shared/components/ui/dialog`, `~/shared/components/ui/input`, `~/shared/components/ui/label` imports:

```ts
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/shared/components/ui/select";
import { groupedIndonesianBanks } from "~/shared/constants/indonesian-banks";
```

- [ ] **Step 2: Replace the `bank_name` field block**

Find the existing `<div className="space-y-2">` block containing `<Label htmlFor="bank_name">Bank / E-Wallet</Label>` and `<Input id="bank_name" ...>`. Replace that entire block with:

```tsx
<div className="space-y-2">
	<Label htmlFor="bank_name">Bank / E-Wallet</Label>
	<Select value={bankName} onValueChange={setBankName}>
		<SelectTrigger id="bank_name">
			<SelectValue placeholder="Pilih bank atau e-wallet" />
		</SelectTrigger>
		<SelectContent>
			{Object.entries(groupedIndonesianBanks).map(([groupKey, group]) => (
				<SelectGroup key={groupKey}>
					<SelectLabel>
						{group.icon} {group.name}
					</SelectLabel>
					{Object.entries(group.list).map(([itemKey, item]) => (
						<SelectItem key={itemKey} value={item.name}>
							{item.name}
						</SelectItem>
					))}
				</SelectGroup>
			))}
		</SelectContent>
	</Select>
</div>
```

- [ ] **Step 3: Verify TS**

Run from project root:

```bash
npx tsc --pretty --noEmit
```

Expected: zero NEW errors in `account-form-dialog.tsx`. Pre-existing errors in unrelated files may remain — leave them alone.

- [ ] **Step 4: Verify lint + format**

```bash
npx biome lint app/features/accounts/components/account-form-dialog.tsx
npx biome format app/features/accounts/components/account-form-dialog.tsx
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add app/features/accounts/components/account-form-dialog.tsx
git commit -m "feat(accounts): use bank dropdown in account form"
```

---

## Task 3: Manual Smoke Test

- [ ] **Step 1: Build check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 2: Manual flow**

1. Start dev server: `npm run dev`
2. Sign in.
3. Navigate to `/dashboard/accounts`.
4. Click **Tambah Rekening**. Verify the form opens.
5. Click the **Bank / E-Wallet** select trigger. Verify three groups render: 🏦 Bank, 📱 Bank Digital, 💳 E-Wallet.
6. Select a bank (e.g., BCA). Verify it appears as the selected value.
7. Fill in the other fields and save. Verify the account is created with the bank name "BCA".
8. Open the edit dialog for that account. Verify "BCA" is shown as the selected value.
9. (Optional) Manually insert a record in the DB with a bank name NOT in the list (e.g., "Bank Kustom XYZ"). Open its edit dialog. Verify the Select shows the placeholder but the form is still submittable (existing value preserved).
10. Visit `/share/<slug>` (the share page). Verify the bank name displays correctly.

- [ ] **Step 3: Commit any fixups**

If any issues were found and fixed:

```bash
git add -A
git commit -m "chore: post-implementation fixes for bank dropdown"
```

---

## Self-Review Checklist

- [x] Spec section 3 (new constant file) → Task 1
- [x] Spec section 4 (form changes) → Task 2
- [x] Spec section 5 (files touched) → matches file structure above
- [x] No placeholders or "TODO" in any step
- [x] All type names consistent (`groupedIndonesianBanks`, `bankName`, `setBankName`)
- [x] No backend changes (spec section 2 / 7)