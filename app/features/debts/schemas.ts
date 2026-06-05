import { z } from 'zod';
import { INPUT_MAX_LENGTH, NOTES_MAX_LENGTH, PRICE_MAX_VALUE } from '~/shared/constants/validation';

export const DebtSchema = z.object({
	id: z.string().optional(),
	friend_name: z.string().min(1, 'Friend name is required').max(INPUT_MAX_LENGTH).optional(),
	name: z.string().min(1, 'Name is required').max(INPUT_MAX_LENGTH),
	notes: z.string().max(NOTES_MAX_LENGTH).optional().nullable(),
	type: z.enum(['I_OWE', 'OWES_ME']).optional(),
	amount: z
		.string()
		.min(1, 'Valid amount is required')
		.refine((val) => {
			const num = parseFloat(val);
			return !isNaN(num) && isFinite(num) && num >= 0 && num <= PRICE_MAX_VALUE;
		}, 'Valid amount is required'),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required (YYYY-MM-DD)'),
	status: z.string().optional(),
	linked_debt_id: z.string().optional(),
});
