/**
 * useAuth — authentication hook
 *
 * Provides the full auth surface area:
 *  - State:   user, token, role, isAuthenticated, isLoading, firebaseUser
 *  - Actions: login (Firebase idToken exchange), loginWithCredentials,
 *             register, verifyOTP, logout, updateFcmToken, updateProfile
 *  - Guards:  isFarmer, isBuyer, isDelivery, isAdmin
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCredentials,
  logout as logoutAction,
  updateUser,
  setLoading,
  setFirebaseUser,
  selectUser,
  selectToken,
  selectRole,
  selectIsAuthenticated,
  selectIsLoading,
  selectFirebaseUser,
} from '../store/authSlice';
import { authApi } from '../api/auth';
import { clearCartAction } from '../store/cartSlice';
import { clearAuthStorage } from '../utils/storage';
import type { LoginRequest, RegisterRequest, UserRole } from '../types/auth';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const token = useAppSelector(selectToken);
  const role = useAppSelector(selectRole);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const firebaseUser = useAppSelector(selectFirebaseUser);

  // ── Role guards ─────────────────────────────────────────────────────────────

  const isFarmer = role === 'FARMER';
  const isBuyer = role === 'BUYER';
  const isDelivery = role === 'DELIVERY';
  const isAdmin = role === 'ADMIN';

  // ── login(idToken) ──────────────────────────────────────────────────────────
  // Exchange a Firebase ID token for an AgriDirect JWT.
  // Called after firebase.auth().signInWithPhoneNumber() completes.

  const login = useCallback(
    async (idToken: string): Promise<void> => {
      dispatch(setLoading(true));
      try {
        const res = await authApi.loginWithIdToken(idToken);
        dispatch(
          setCredentials({
            user: res.data.user,
            token: res.data.tokens.accessToken,
            refreshToken: res.data.tokens.refreshToken,
            role: res.data.user.role,
          }),
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // ── loginWithCredentials(phone, password) ───────────────────────────────────
  // Direct phone+password login (non-Firebase flow).

  const loginWithCredentials = useCallback(
    async (payload: LoginRequest): Promise<void> => {
      dispatch(setLoading(true));
      try {
        const res = await authApi.login(payload);
        dispatch(
          setCredentials({
            user: res.data.user,
            token: res.data.tokens.accessToken,
            refreshToken: res.data.tokens.refreshToken,
            role: res.data.user.role,
          }),
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // ── register ─────────────────────────────────────────────────────────────────

  const register = useCallback(
    async (payload: RegisterRequest): Promise<void> => {
      dispatch(setLoading(true));
      try {
        const res = await authApi.register(payload);
        dispatch(
          setCredentials({
            user: res.data.user,
            token: res.data.tokens.accessToken,
            refreshToken: res.data.tokens.refreshToken,
            role: res.data.user.role,
          }),
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // ── verifyOTP ─────────────────────────────────────────────────────────────────

  const verifyOTP = useCallback(
    async (phone: string, otp: string): Promise<void> => {
      dispatch(setLoading(true));
      try {
        const res = await authApi.verifyOTP(phone, otp);
        dispatch(
          setCredentials({
            user: res.data.user,
            token: res.data.tokens.accessToken,
            refreshToken: res.data.tokens.refreshToken,
            role: res.data.user.role,
          }),
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // ── logout ────────────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Best-effort server-side logout (invalidates refresh token)
      await authApi.logout();
    } catch {
      // Ignore network errors — always clear local state
    } finally {
      dispatch(logoutAction());
      // Also wipe the cart on logout
      dispatch({ type: 'cart/clearCart' });
      clearAuthStorage();
    }
  }, [dispatch]);

  // ── updateFcmToken ────────────────────────────────────────────────────────────

  const updateFcmToken = useCallback(
    async (fcmToken: string): Promise<void> => {
      try {
        await authApi.updateFcmToken(fcmToken);
        // Optionally reflect in user object
        dispatch(updateUser({ fcmToken }));
      } catch {
        // Non-critical — swallow silently
      }
    },
    [dispatch],
  );

  // ── updateProfile ─────────────────────────────────────────────────────────────

  const refreshMe = useCallback(async (): Promise<void> => {
    try {
      const res = await authApi.getMe();
      dispatch(updateUser(res.data));
    } catch {
      // silently fail
    }
  }, [dispatch]);

  // ── setFirebaseUser ────────────────────────────────────────────────────────────

  const saveFirebaseUser = useCallback(
    (fbUser: Record<string, unknown> | null) => {
      dispatch(setFirebaseUser(fbUser));
    },
    [dispatch],
  );

  return {
    // State
    user,
    token,
    role,
    isAuthenticated,
    isLoading,
    firebaseUser,
    // Guards
    isFarmer,
    isBuyer,
    isDelivery,
    isAdmin,
    // Actions
    login,
    loginWithCredentials,
    register,
    verifyOTP,
    logout,
    updateFcmToken,
    refreshMe,
    saveFirebaseUser,
  };
};
