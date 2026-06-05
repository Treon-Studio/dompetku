import { z } from 'zod';

export const GoalSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Name is required'),
	target_amount: z.string().min(1, 'Target amount is required'),
	current_amount: z.string().optional().default('0'),
	deadline: z.string().optional().nullable(),
	status: z.string().optional().default('IN_PROGRESS'),
});
