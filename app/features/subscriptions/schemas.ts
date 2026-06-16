import { z } from "zod";
import { INPUT_MAX_LENGTH, NOTES_MAX_LENGTH, PRICE_MAX_VALUE, URL_MAX_LENGTH } from "~/shared/constants/validation";

export const SubscriptionSchema = z.object({
	id: z.string().optional(),
	name: z
		.string()
		.min(1, "Name is required")
		.max(INPUT_MAX_LENGTH, `Name must be at most ${INPUT_MAX_LENGTH} characters`),
	notes: z.string().max(NOTES_MAX_LENGTH, `Notes must be at most ${NOTES_MAX_LENGTH} characters`).optional().nullable(),
	url: z.string().url("Valid URL is required").max(URL_MAX_LENGTH, `URL must be at most ${URL_MAX_LENGTH} characters`),
	paid: z.string().min(1, "Billing cycle is required"),
	notify: z.boolean().optional(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid date is required (YYYY-MM-DD)"),
	price: z
		.string()
		.min(1, "Valid price is required")
		.refine((val) => {
			const num = parseFloat(val);
			return !Number.isNaN(num) && Number.isFinite(num) && num >= 0 && num <= PRICE_MAX_VALUE;
		}, "Valid price is required"),
});
