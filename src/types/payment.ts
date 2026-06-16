// ─── Razorpay ─────────────────────────────────────────────────────────────────

/** Returned by /api/payment/create-order — passed directly to Razorpay SDK */
export interface RazorpayOrderResponse {
  razorpayOrderId: string;   // rp_ prefixed order ID
  amount: number;            // in paise
  currency: string;          // "INR"
  receipt: string;
  key: string;               // Razorpay publishable key
  name: string;              // merchant name
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

/** Sent to /api/payment/verify after Razorpay checkout success */
export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderId: string;            // our internal order ID
}

// ─── Payment record ────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type PaymentMethod = 'RAZORPAY' | 'COD' | 'UPI' | 'WALLET';

export interface PaymentRecord {
  id: string;
  orderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;            // in paise
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  failureReason?: string;
  refundId?: string;
  refundedAmount?: number;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export interface RefundResponse {
  refundId: string;
  status: 'pending' | 'processed' | 'failed';
  amount: number;
  currency: string;
  estimatedArrival?: string;  // ISO date
}
