import { createResourceApi } from '~/lib/api-client';

const api = createResourceApi('/api/expenses');

export const addExpense = api.add;
export const editExpense = api.edit;
export const deleteExpense = api.delete;
export type ExpenseData = any;
