import { createResourceApi } from '~/shared/lib/api-client';

const api = createResourceApi('/api/subscriptions');

export const addSubscription = api.add;
export const editSubscription = api.edit;
export const deleteSubscription = api.delete;
export type SubscriptionData = any;
