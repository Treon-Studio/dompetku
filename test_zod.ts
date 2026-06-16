import { DebtSchema } from "./app/features/debts/schemas";

const body = { id: "123", status: "PAID" };
const result = DebtSchema.partial().safeParse(body);
console.log(JSON.stringify(result, null, 2));
