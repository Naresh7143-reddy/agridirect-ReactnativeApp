/**
 * Global slot for Firebase ConfirmationResult.
 *
 * Firebase's ConfirmationResult is a non-serialisable class instance and cannot
 * be passed through React Navigation params (which are JSON-serialised for
 * deep-linking). We store it here as a module-level ref instead.
 *
 * Lifecycle:
 *  1. PhoneLoginScreen  → setConfirmation(result)
 *  2. OTPVerificationScreen → getConfirmation() → confirmation.confirm(code)
 *  3. After success or error → clearConfirmation()
 */

import type { ConfirmationResult } from './firebase';

let _confirmation: ConfirmationResult | null = null;

export const setConfirmation = (c: ConfirmationResult): void => {
  _confirmation = c;
};

export const getConfirmation = (): ConfirmationResult | null => _confirmation;

export const clearConfirmation = (): void => {
  _confirmation = null;
};
