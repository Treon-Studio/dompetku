import { z } from "zod";
import { INPUT_MAX_LENGTH } from "~/shared/constants/validation";

const QRIS_DATA_URL_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,/;

export const PaymentAccountSchema = z.object({
	id: z.string().optional(),
	bank_name: z
		.string()
		.min(2, "Bank/E-Wallet name must be at least 2 characters")
		.max(INPUT_MAX_LENGTH, `Bank/E-Wallet name must be at most ${INPUT_MAX_LENGTH} characters`),
	account_number: z
		.string()
		.min(2, "Account number must be at least 2 characters")
		.max(40, "Account number must be at most 40 characters")
		.regex(/^[A-Za-z0-9\- ]+$/, "Only letters, digits, dashes and spaces are allowed"),
	account_holder: z
		.string()
		.min(2, "Account holder name must be at least 2 characters")
		.max(INPUT_MAX_LENGTH, `Account holder name must be at most ${INPUT_MAX_LENGTH} characters`),
	qris_image: z
		.string()
		.optional()
		.refine((val) => !val || QRIS_DATA_URL_REGEX.test(val), {
			message: "QRIS must be a valid image data URL",
		}),
});

export type PaymentAccountInput = z.infer<typeof PaymentAccountSchema>;
