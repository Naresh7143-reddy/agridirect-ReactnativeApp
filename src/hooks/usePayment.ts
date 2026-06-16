/**
 * usePayment — Razorpay payment hook
 *
 * Wraps the full payment lifecycle:
 *   1. Create Razorpay order on AgriDirect backend
 *   2. Open Razorpay checkout sheet (react-native-razorpay)
 *   3. Verify payment signature on backend
 *   4. Return verified transaction ID
 *
 * react-native-razorpay is not installed; the checkout step is guarded
 * with a try/require so the app compiles. In production, install the
 * package and the flow works end-to-end.
 *
 * Test card (Razorpay sandbox):
 *   Card: 4111 1111 1111 1111  |  Expiry: 12/26  |  CVV: 123  |  OTP: 1234
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { paymentApi } from '../api/payment';
import { useAuth } from './useAuth';
import ENV from '../config/env';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export const usePayment = () => {
  const { user } = useAuth();

  /**
   * initiatePayment
   *
   * @param orderId   AgriDirect internal order ID
   * @param amount    Total in rupees (NOT paise)
   * @returns PaymentResult
   */
  const initiatePayment = useCallback(
    async (orderId: string, amount: number): Promise<PaymentResult> => {
      try {
        // ── Step 1: Create Razorpay order on backend ───────────────────────
        const { data: rpOrder } = await paymentApi.createOrder(orderId, amount);

        // ── Step 2: Open Razorpay checkout ─────────────────────────────────
        let RazorpayCheckout: any;
        try {
          RazorpayCheckout = require('react-native-razorpay').default;
        } catch {
          // Package not installed — show dev stub
          Alert.alert(
            'Razorpay not linked',
            'Install react-native-razorpay and rebuild to enable payments.\n\nTest card: 4111 1111 1111 1111',
          );
          return { success: false, error: 'razorpay_not_installed' };
        }

        const options = {
          key:         ENV.RAZORPAY_KEY,
          amount:      rpOrder.amount * 100,          // Razorpay expects paise
          currency:    rpOrder.currency ?? 'INR',
          name:        'AgriDirect',
          description: 'Farm fresh order',
          order_id:    rpOrder.razorpayOrderId,
          prefill: {
            name:    user?.name    ?? '',
            contact: user?.phone   ?? '',
            email:   user?.email   ?? '',
          },
          notes: { agridirect_order_id: orderId },
          theme: { color: '#1B5E20' },
        };

        const paymentData = await RazorpayCheckout.open(options);
        // paymentData: { razorpay_payment_id, razorpay_order_id, razorpay_signature }

        // ── Step 3: Verify signature on backend ────────────────────────────
        const { data: verification } = await paymentApi.verifyPayment({
          razorpayOrderId:    paymentData.razorpay_order_id,
          razorpayPaymentId:  paymentData.razorpay_payment_id,
          razorpaySignature:  paymentData.razorpay_signature,
          orderId:            paymentData.razorpay_order_id,
        });

        if (verification.success) {
          return { success: true, transactionId: verification.transactionId };
        }
        return { success: false, error: 'verification_failed' };

      } catch (error: any) {
        // User cancelled (Razorpay returns code 0) — treat as non-error
        if (error?.code === 0 || error?.description === 'Payment cancelled by user.') {
          return { success: false, error: 'cancelled' };
        }
        return { success: false, error: error?.message ?? 'payment_error' };
      }
    },
    [user],
  );

  return { initiatePayment };
};
