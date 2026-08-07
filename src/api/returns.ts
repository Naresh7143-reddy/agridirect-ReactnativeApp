import client from './client';
import type { ApiResponse } from '../types/api';
import type { ReturnRequest, SubmitReturnRequest, ReturnStatus } from '../types/return';

export const returnsApi = {
  /** Submit a return / refund request */
  submit: (data: SubmitReturnRequest): Promise<ApiResponse<ReturnRequest>> =>
    client.post('/api/returns/submit', data),

  /** Buyer get return history */
  getBuyerReturns: (): Promise<ApiResponse<ReturnRequest[]>> =>
    client.get('/api/returns/buyer'),

  /** Farmer get pending return requests */
  getFarmerReturns: (): Promise<ApiResponse<ReturnRequest[]>> =>
    client.get('/api/returns/farmer'),

  /** Farmer approve return */
  approve: (id: string): Promise<ApiResponse<ReturnRequest>> =>
    client.put(`/api/returns/${id}/approve`),

  /** Farmer reject return with reason */
  reject: (id: string, reason: string): Promise<ApiResponse<ReturnRequest>> =>
    client.put(`/api/returns/${id}/reject`, { reason }),
};
