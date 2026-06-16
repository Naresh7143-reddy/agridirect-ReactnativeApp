import client from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api';
import type {
  RazorpayOrderResponse,
  VerifyPaymentRequest,
  PaymentRecord,
  RefundResponse,
} from '../types/payment';

export const paymentApi = {
  /**
   * Create a Razorpay order on the backend.
   * Returns the Razorpay order ID + key needed to open the SDK checkout.
   */
  createOrder: (
    orderId: string,
    amount: number,
  ): Promise<ApiResponse<RazorpayOrderResponse>> =>
    client.post('/api/payment/create-order', { orderId, amount }),

  /**
   * Verify Razorpay payment signature after the SDK checkout completes.
   * Backend validates the signature and marks the order as paid.
   */
  verifyPayment: (
    data: VerifyPaymentRequest,
  ): Promise<ApiResponse<{ success: boolean; transactionId: string }>> =>
    client.post('/api/payment/verify', data),

  /** Fetch payment record linked to an order */
  getPaymentByOrder: (orderId: string): Promise<ApiResponse<PaymentRecord>> =>
    client.get(`/api/payment/order/${orderId}`),

  /** Fetch single payment record by payment ID */
  getPaymentById: (paymentId: string): Promise<ApiResponse<PaymentRecord>> =>
    client.get(`/api/payment/${paymentId}`),

  /** Paginated payment history for the authenticated user */
  getHistory: (
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<PaymentRecord>> =>
    client.get('/api/payment/history', { params }),

  /**
   * Initiate a refund (admin / system use).
   * @param amount Partial refund amount in paise; omit for full refund.
   */
  refund: (
    paymentId: string,
    amount?: number,
    reason?: string,
  ): Promise<ApiResponse<RefundResponse>> =>
    client.post(`/api/payment/${paymentId}/refund`, { amount, reason }),

  /** Check status of an already-initiated refund */
  getRefundStatus: (
    refundId: string,
  ): Promise<ApiResponse<{ refundId: string; status: string; amount: number }>> =>
    client.get(`/api/payment/refunds/${refundId}`),
};
