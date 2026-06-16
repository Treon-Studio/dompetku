import { z } from "zod";

export const BudgetSchema = z.object({
	id: z.string().optional(),
	category: z.string().min(1, "Category is required"),
	amount: z.string().min(1, "Amount is required"),
	month: z.string().min(1, "Month is required"),
});
