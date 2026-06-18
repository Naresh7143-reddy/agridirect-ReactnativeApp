import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { User, UserRole } from '../types/auth';
import {
  setAuthToken,
  setRefreshToken,
  clearAuthStorage,
  setUserData,
} from '../utils/storage';

// ─── State shape ──────────────────────────────────────────────────────────────

export interface AuthSliceState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Prevents AuthNavigator from remounting during active OTP/register flows */
  isAuthInProgress: boolean;
  /** Raw Firebase user object (nullable — only present when using Firebase auth) */
  firebaseUser: Record<string, unknown> | null;
}

const initialState: AuthSliceState = {
  user: null,
  token: null,
  refreshToken: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  isAuthInProgress: false,
  firebaseUser: null,
};

// ─── Payload types ────────────────────────────────────────────────────────────

export interface SetCredentialsPayload {
  user: User;
  token: string;
  refreshToken?: string;
  role: UserRole;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * setCredentials — one-shot action to populate auth state after login/register/OTP.
     * Also persists tokens to MMKV so the API client can read them synchronously.
     */
    setCredentials(state, action: PayloadAction<SetCredentialsPayload>) {
      const { user, token, refreshToken, role } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken ?? null;
      state.role = role;
      state.isAuthenticated = true;
      state.isLoading = false;
      // Side-effects: persist to MMKV (synchronous, safe inside immer)
      setAuthToken(token);
      if (refreshToken) setRefreshToken(refreshToken);
      setUserData(user);
    },

    /**
     * logout — wipes all auth state and clears MMKV auth keys.
     * Triggered by the user or by the API client on 401 refresh failure.
     */
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.firebaseUser = null;
      clearAuthStorage();
    },

    /** Partial update — use after profile edits */
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        setUserData(state.user);
      }
    },

    /** Toggle loading indicator for async auth operations */
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    /** Set true when OTP verified — prevents AuthNavigator remounting mid-flow */
    setAuthInProgress(state, action: PayloadAction<boolean>) {
      state.isAuthInProgress = action.payload;
    },

    /** Store the raw Firebase user object (e.g. after firebase.auth() sign-in) */
    setFirebaseUser(
      state,
      action: PayloadAction<Record<string, unknown> | null>,
    ) {
      state.firebaseUser = action.payload;
    },

    /** Update only the stored access token (e.g. after silent refresh) */
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      setAuthToken(action.payload);
    },

    /** Update refresh token separately */
    setRefreshToken(state, action: PayloadAction<string>) {
      state.refreshToken = action.payload;
      setRefreshToken(action.payload);
    },
  },
});

export const {
  setCredentials,
  logout,
  updateUser,
  setLoading,
  setAuthInProgress,
  setFirebaseUser,
  setToken,
  setRefreshToken: setRefreshTokenAction,
} = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
export const selectRole = (state: RootState) => state.auth.role;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectIsAuthInProgress = (state: RootState) => state.auth.isAuthInProgress;
export const selectFirebaseUser = (state: RootState) =>
  state.auth.firebaseUser;

export default authSlice.reducer;
