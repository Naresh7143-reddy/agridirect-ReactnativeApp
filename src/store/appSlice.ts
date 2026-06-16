import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import { setLanguage as persistLanguage, setFcmToken as persistFcmToken } from '../utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppTheme = 'light' | 'dark' | 'system';

export type SupportedLanguage =
  | 'en'   // English
  | 'hi'   // Hindi
  | 'kn'   // Kannada
  | 'te'   // Telugu
  | 'ta'   // Tamil
  | 'mr';  // Marathi

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  /** Whether the device has a live network connection */
  isOnline: boolean;
  /** Currently active UI language */
  selectedLanguage: SupportedLanguage;
  /** Firebase Cloud Messaging device token */
  fcmToken: string | null;
  /** Whether the app has been granted location permission */
  locationPermission: boolean;
  /** Visual theme preference */
  theme: AppTheme;
  /** Whether the app has completed initial bootstrapping */
  isAppReady: boolean;
  /** In-app toast queue (not persisted) */
  toasts: Toast[];
}

const initialState: AppState = {
  isOnline: true,
  selectedLanguage: 'en',
  fcmToken: null,
  locationPermission: false,
  theme: 'light',
  isAppReady: false,
  toasts: [],
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    /** Set network connectivity status */
    setOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },

    /** Change app language and persist to MMKV */
    setSelectedLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.selectedLanguage = action.payload;
      persistLanguage(action.payload);
    },

    /** Store FCM token after Firebase registers the device */
    setFcmToken(state, action: PayloadAction<string | null>) {
      state.fcmToken = action.payload;
      if (action.payload) persistFcmToken(action.payload);
    },

    /** Update location permission state */
    setLocationPermission(state, action: PayloadAction<boolean>) {
      state.locationPermission = action.payload;
    },

    /** Set visual theme */
    setTheme(state, action: PayloadAction<AppTheme>) {
      state.theme = action.payload;
    },

    /** Signal that the app bootstrap (token rehydration, etc.) is complete */
    setAppReady(state, action: PayloadAction<boolean>) {
      state.isAppReady = action.payload;
    },

    /** Push a toast to the queue */
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      state.toasts.push({
        id: Date.now().toString(),
        ...action.payload,
      });
    },

    /** Remove a toast by ID */
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    /** Clear all toasts */
    clearToasts(state) {
      state.toasts = [];
    },
  },
});

export const {
  setOnline,
  setSelectedLanguage,
  setFcmToken,
  setLocationPermission,
  setTheme,
  setAppReady,
  addToast,
  removeToast,
  clearToasts,
} = appSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectIsOnline = (state: RootState) => state.app.isOnline;
export const selectSelectedLanguage = (state: RootState) =>
  state.app.selectedLanguage;
export const selectFcmToken = (state: RootState) => state.app.fcmToken;
export const selectLocationPermission = (state: RootState) =>
  state.app.locationPermission;
export const selectTheme = (state: RootState) => state.app.theme;
export const selectIsAppReady = (state: RootState) => state.app.isAppReady;
export const selectToasts = (state: RootState) => state.app.toasts;

export default appSlice.reducer;
