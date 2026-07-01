# Design Spec: Payment Accounts & Share Page Integration

**Date:** 2026-07-01
**Status:** Draft → Approved
**Scope:** New internal feature (CRUD for user payment accounts) + integration into the public `/share/$slug` page so friends can see how to pay their outstanding debts.

---

## 1. Goals

Let users store reference information for their bank accounts / e-wallets / QRIS, and expose that information on the public share page so friends know where to send payment when a debt is still outstanding.

**Explicitly out of scope (YAGNI):**

- Balance tracking per account
- Linking accounts to transactions to mutate balances
- Multi-currency handling per account

This is a reference list — accounts hold identifiers and (optionally) a QRIS image.

---

## 2. Data Model

Add a single new SQLite table managed via Drizzle ORM. One row per payment account. Each row is owned by exactly one user.

```ts
// app/core/db/schema.ts (addition)
export const payment_accounts = sqliteTable("payment_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bank_name: text("bank_name").notNull(),        // e.g. "BCA", "GoPay", "OVO"
  account_number: text("account_number").notNull(),
  account_holder: text("account_holder").notNull(),
  qris_image: text("qris_image"),                // optional, Base64 data URL
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type PaymentAccount = typeof payment_accounts.$inferSelect;
```

**Storage choice for QRIS:** Base64 data URL stored directly in the `qris_image` column. QRIS images are typically < 50 KB; storing inline avoids external hosting and keeps the share page self-contained.

**Validation rules (Zod):**

- `bank_name`: 2–60 chars, required.
- `account_number`: 2–40 chars, required (alphanumeric / digits / `-` / spaces).
- `account_holder`: 2–80 chars, required.
- `qris_image`: optional; if present, must be a string starting with `data:image/`.

---

## 3. Internal Feature: `/dashboard/accounts`

### 3.1 Navigation

Add a new sidebar item between "Goals" and the settings group. Label: **"Rekening Saya"** (id), **"Payment Accounts"** (en). Uses a `WalletIcon` (new icon, added to `~/shared/components/icons.tsx`).

```tsx
// app/shared/components/sidebar/index.tsx
{ key: "accounts", name: t("navigation.accounts"), href: "/dashboard/accounts", Icon: WalletIcon },
```

### 3.2 Route

`app/routes/dashboard.accounts.tsx` — follows the same patterns as `dashboard.budgets.tsx`:

- **Loader:** fetches all `payment_accounts` rows for the authenticated user, ordered by `created_at DESC`.
- **Default state (read):** Card list of accounts. Each card shows: bank name, masked account number (`1234 •••• 5678`), account holder. Buttons: **Salin Nomor**, **Lihat QRIS** (only if `qris_image` is set), **Edit**, **Hapus**.
- **Add / Edit:** Inline form or `Dialog` (`~/shared/components/ui/dialog.tsx`). Form fields: bank_name, account_number, account_holder, file upload for QRIS (converted to Base64 on the client via `FileReader.readAsDataURL`).
- **Toast feedback:** Reuse `sonner` (already wired into `dashboard.tsx`). Success toast on copy, save, delete; error toast on failure.
- **Empty state:** Friendly message + "Tambah Rekening Pertama" CTA.

### 3.3 Delete

Reuse the existing `DeleteModal` pattern (`~/shared/components/modal/delete.tsx`). POST to a new `api.accounts.tsx` resource route with the account id; on success, revalidate the loader data (Remix `useRevalidator` or `mutate` pattern already used elsewhere in the app).

### 3.4 i18n

Add keys under `navigation.accounts` and a small `accounts.*` section in all four locale files: `id.json`, `en.json`, `jv.json`, `bjn.json`. Keys needed:

- `navigation.accounts`
- `accounts.title`
- `accounts.addAccount`
- `accounts.editAccount`
- `accounts.bankName`
- `accounts.accountNumber`
- `accounts.accountHolder`
- `accounts.qrisImage`
- `accounts.qrisOptional`
- `accounts.copySuccess`
- `accounts.copyError`
- `accounts.deleteSuccess`
- `accounts.deleteError`
- `accounts.saveSuccess`
- `accounts.saveError`
- `accounts.viewQris`
- `accounts.empty.title`
- `accounts.empty.description`

---

## 4. Public Share Page Integration: `/share/$slug`

### 4.1 Behavior

On the existing `app/routes/share.$slug.tsx`:

1. Loader already returns `{ friend }` (which includes `user_id`).
2. Add a query: fetch all `payment_accounts` for that `user_id`.
3. Pass `payment_accounts` in the loader payload.

### 4.2 UI

**Conditionally render** a "Cara Pembayaran" section **only when** `unpaidDebts.length > 0 && payment_accounts.length > 0` and the viewer is the one who owes the owner (`viewerOwesUser === true`, i.e. `netAmount > 0`).

Visual structure (placed directly below the existing "Sisa hutangmu" summary card):

```
┌────────────────────────────────────────────────────┐
│ 💳  Cara Pembayaran                                │
│ Kirim pembayaran ke salah satu rekening berikut:    │
├────────────────────────────────────────────────────┤
│  [Icon] BCA                                        │
│        a.n. John Doe          [📋 Salin]           │
│        1234 •••• 5678                              │
│                              [🖼️ Lihat QRIS]       │
├────────────────────────────────────────────────────┤
│  [Icon] GoPay                                      │
│        a.n. John Doe          [📋 Salin]           │
│        0812••••••90                                │
└────────────────────────────────────────────────────┘
```

- Use the same Tailwind card styling already in use on this page (`bg-white dark:bg-gray-800 rounded-xl border ...`).
- "Salin" calls the same async `navigator.clipboard.writeText` + toast pattern from the internal page.
- "Lihat QRIS" opens a `Dialog` showing the image.
- If no accounts are configured by the owner, fall back to a quiet line: _"Pemilik belum menambahkan informasi rekening."_ — no error, no broken layout.
- If the viewer **does not** owe money (`netAmount <= 0`), do not render the section at all.

### 4.3 Privacy

The share page is already public-by-slug. Payment account data is only fetched when the slug resolves and `is_public` is true — matching the existing access boundary. No additional auth needed.

---

## 5. Files Touched

**New:**

- `app/routes/dashboard.accounts.tsx`
- `app/routes/api.accounts.tsx`

**Modified:**

- `app/core/db/schema.ts` — add `payment_accounts` table + type
- `app/core/db/migrations/` — generated migration
- `app/shared/components/sidebar/index.tsx` — add nav item
- `app/shared/components/icons.tsx` — add `WalletIcon`
- `app/routes/share.$slug.tsx` — query accounts + render "Cara Pembayaran" block
- `i18n/locales/id.json`, `en.json`, `jv.json`, `bjn.json` — add keys

---

## 6. Error Handling

| Failure | Behavior |
|---|---|
| Clipboard write rejected | Toast.error "Gagal menyalin"; do not advance UI state |
| File upload > 1 MB | Client-side reject before base64; show inline error |
| API save fails (network / validation) | Toast.error with server message; form stays open |
| Delete on account owned by other user | 403; UI toast error |
| QRIS image missing on a row | "Lihat QRIS" button is not rendered (not disabled) |

---

## 7. Out of Scope (Confirmed)

- No balance tracking. Accounts are reference data only.
- No account-default selection in expense/income forms (future feature).
- No multi-currency per account.
- No image cropping or QRIS decoding.