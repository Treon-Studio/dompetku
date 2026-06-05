import { z } from 'zod';
import { INPUT_MAX_LENGTH, NOTES_MAX_LENGTH, PRICE_MAX_VALUE } from '~/shared/constants/validation';

export const baseRecordSchema = z.object({
	id: z.string().optional(), // For PUT requests
	name: z
		.string()
		.min(1, 'Name is required')
		.max(INPUT_MAX_LENGTH, `Name must be at most ${INPUT_MAX_LENGTH} characters`),
	notes: z.string().max(NOTES_MAX_LENGTH, `Notes must be at most ${NOTES_MAX_LENGTH} characters`).optional().nullable(),
	category: z.string().min(1, 'Category is required'),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required (YYYY-MM-DD)'),
	price: z
		.string()
		.min(1, 'Valid price is required')
		.refine((val) => {
			const num = parseFloat(val);
			return !isNaN(num) && isFinite(num) && num >= 0 && num <= PRICE_MAX_VALUE;
		}, 'Valid price is required'),
});

export const ExpenseSchema = baseRecordSchema.extend({
	paid_via: z.string().optional(),
});
