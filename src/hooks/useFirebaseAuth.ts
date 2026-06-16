/**
 * useFirebaseAuth — Firebase Phone Authentication hook
 *
 * Flow:
 *   1. sendOTP(phone)           → Firebase sends SMS, returns ConfirmationResult
 *   2. verifyOTP(result, code)  → Confirms code, gets Firebase ID token
 *   3. Pass idToken to useAuth().login(idToken) → exchanges for backend JWT
 *
 * Error codes:
 *   auth/invalid-phone-number   — bad format
 *   auth/too-many-requests      — rate limited
 *   auth/invalid-verification-code — wrong OTP
 *   auth/session-expired        — OTP expired (60s)
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  firebaseAuth,
  firebaseSignOut,
  formatIndianPhone,
  type ConfirmationResult,
  type FirebaseUser,
} from '../utils/firebase';

// ─── Error messages ───────────────────────────────────────────────────────────

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-phone-number':
    'Invalid phone number. Please enter a valid 10-digit number.',
  'auth/too-many-requests':
    'Too many attempts. Please wait a moment and try again.',
  'auth/invalid-verification-code':
    'Incorrect OTP. Please check and try again.',
  'auth/code-expired':
    'OTP has expired. Please request a new one.',
  'auth/session-expired':
    'Session expired. Please request a new OTP.',
  'auth/missing-verification-code':
    'Please enter the OTP.',
  'auth/quota-exceeded':
    'SMS quota exceeded. Please try again later.',
  'auth/network-request-failed':
    'Network error. Please check your connection.',
  'auth/app-not-authorized':
    'App not authorized. Please contact support.',
  'auth/captcha-check-failed':
    'Verification check failed. Please try again.',
  'auth/missing-app-credential':
    'App credential missing. Please try again.',
  'auth/invalid-app-credential':
    'Invalid app credential. Please try again.',
  'auth/web-internal-error':
    'Firebase internal error. Please try again.',
};

const getFirebaseErrorMessage = (code: string): string =>
  FIREBASE_ERRORS[code] ?? 'An error occurred. Please try again.';

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseFirebaseAuthReturn {
  isSending: boolean;
  isVerifying: boolean;
  sendOTP: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyOTP: (
    confirmation: ConfirmationResult,
    code: string,
  ) => Promise<string>;
  signOut: () => Promise<void>;
  currentFirebaseUser: FirebaseUser | null;
}

export const useFirebaseAuth = (): UseFirebaseAuthReturn => {
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // ── sendOTP ───────────────────────────────────────────────────────────────

  const sendOTP = useCallback(
    async (phoneNumber: string): Promise<ConfirmationResult> => {
      setIsSending(true);
      try {
        // Always format to +91XXXXXXXXXX before sending to Firebase
        const formatted = formatIndianPhone(phoneNumber);

        // Validate length after formatting
        if (!/^\+91\d{10}$/.test(formatted)) {
          throw new Error(
            'Invalid phone number. Please enter a valid 10-digit number.',
          );
        }

        const confirmation =
          await firebaseAuth.signInWithPhoneNumber(formatted);
        return confirmation;
      } catch (error: any) {
        const message = error?.code
          ? getFirebaseErrorMessage(error.code)
          : error?.message ?? 'Failed to send OTP';
        throw new Error(message);
      } finally {
        setIsSending(false);
      }
    },
    [],
  );

  // ── verifyOTP ──────────────────────────────────────────────────────────────

  const verifyOTP = useCallback(
    async (
      confirmation: ConfirmationResult,
      code: string,
    ): Promise<string> => {
      setIsVerifying(true);
      try {
        if (!code || code.trim().length !== 6) {
          throw new Error('Please enter the complete 6-digit OTP.');
        }

        // Confirm OTP with Firebase — throws on wrong/expired code
        const userCredential = await confirmation.confirm(code.trim());

        if (!userCredential?.user) {
          throw new Error('Verification failed. Please try again.');
        }

        // Get Firebase ID token to exchange for AgriDirect JWT
        const idToken = await userCredential.user.getIdToken();
        return idToken;
      } catch (error: any) {
        const message = error?.code
          ? getFirebaseErrorMessage(error.code)
          : error?.message ?? 'OTP verification failed';
        throw new Error(message);
      } finally {
        setIsVerifying(false);
      }
    },
    [],
  );

  // ── signOut ────────────────────────────────────────────────────────────────

  const signOut = useCallback(async (): Promise<void> => {
    await firebaseSignOut();
  }, []);

  return {
    isSending,
    isVerifying,
    sendOTP,
    verifyOTP,
    signOut,
    currentFirebaseUser: firebaseAuth.currentUser,
  };
};
