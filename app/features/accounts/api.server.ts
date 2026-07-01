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
