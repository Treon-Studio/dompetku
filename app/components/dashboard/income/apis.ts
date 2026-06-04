import { createResourceApi } from '~/lib/api-client';

const api = createResourceApi('/api/income');

export const addIncome = api.add;
export const editIncome = api.edit;
export const deleteIncome = api.delete;
