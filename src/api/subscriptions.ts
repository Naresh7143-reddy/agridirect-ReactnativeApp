import client from './client';
import type { ApiResponse } from '../types/api';
import type { Subscription, CreateSubscriptionRequest, SubscriptionStatus } from '../types/subscription';

export const subscriptionsApi = {
  /** Get all recurring subscriptions for the buyer */
  getMySubscriptions: (): Promise<ApiResponse<Subscription[]>> =>
    client.get('/api/subscriptions/buyer'),

  /** Create a new recurring subscription */
  create: (data: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>> =>
    client.post('/api/subscriptions', data),

  /** Pause, Resume, or Cancel subscription */
  updateStatus: (id: string, status: SubscriptionStatus): Promise<ApiResponse<Subscription>> =>
    client.put(`/api/subscriptions/${id}/status`, { status }),

  /** Delete/Cancel subscription */
  cancel: (id: string): Promise<ApiResponse<null>> =>
    client.delete(`/api/subscriptions/${id}`),
};
