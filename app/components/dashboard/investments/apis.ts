import { createResourceApi } from '~/lib/api-client';

const api = createResourceApi('/api/investments');

export const addInvestment = api.add;
export const editInvestment = api.edit;
export const deleteInvestment = api.delete;
