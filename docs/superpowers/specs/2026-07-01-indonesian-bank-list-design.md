# Indonesian Bank List Design Spec

**Date:** 2026-07-01
**Status:** Draft → Approved
**Scope:** Replace free-text `bank_name` Input with a grouped Select dropdown of Indonesian banks and e-wallets in the Add/Edit Account form. Backend and database unchanged.

---

## 1. Goals

Make adding a payment account faster and more consistent for Indonesian users by surfacing common banks and e-wallets in a structured dropdown rather than requiring free-text typing.

**Explicitly out of scope (YAGNI):**

- Free-text fallback / "Other" option
- Bank logos (only emoji icons on group labels)
- I18n for bank names (Indonesian-only labels)
- Server-side validation of bank_name against the list

The dropdown is a UI affordance only — `bank_name` is still stored as a free string, so any value (including historical data, future additions, or non-listed banks) continues to work.

---

## 2. Data Model

No schema changes. The `payment_accounts.bank_name` column already exists (Task 1) and stores a `text` value.

---

## 3. New File: `app/shared/constants/indonesian-banks.ts`

Exports a single constant `groupedIndonesianBanks` matching the shape already established by `app/shared/constants/categories.ts` (`groupedExpenses`):

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

26 items total across 3 groups.

---

## 4. Form Component Changes

**File:** `app/features/accounts/components/account-form-dialog.tsx`

### 4.1 Replace `<Input>` with `<Select>`

The current `<Input id="bank_name" required maxLength={60} value={bankName} onChange={...} />` is replaced with a `<Select>` from `~/shared/components/ui/select`.

Imports added:

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

Replace the bank_name field block:

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

### 4.2 Why `value={item.name}` (not the key)

`bankName` state holds the **display name** the user picks. This matches the value that gets sent to the server and stored in `payment_accounts.bank_name`. Existing records (and any free-text values) keep working because:

- Edit form initializes `bankName` from `editing.bank_name`
- If the stored value matches a list item's `name`, the Select shows that item as selected
- If it does not match (e.g., legacy "Bank Lainnya"), the Select shows the placeholder — the form is still submittable, server stores the value unchanged

### 4.3 Validation still applies

Zod `PaymentAccountSchema.bank_name` rules (`min(2)`, `max(INPUT_MAX_LENGTH)`) are unchanged. Selecting a value from the list always satisfies them.

---

## 5. Files Touched

**New:**

- `app/shared/constants/indonesian-banks.ts`

**Modified:**

- `app/features/accounts/components/account-form-dialog.tsx`

No DB migration. No API changes. No i18n changes.

---

## 6. Error Handling

No new failure modes introduced. The Select component is purely client-side; the existing API validation handles any edge cases at submit time.

---

## 7. Out of Scope (Confirmed)

- No "Other / Input Manual" fallback option.
- No bank logos (only the emoji icons on group labels).
- No i18n for bank names — Indonesian only.
- No backend validation of `bank_name` against the list.
- No searchable combobox — Select primitive only.