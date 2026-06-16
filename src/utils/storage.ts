/**
 * AgriDirect — MMKV Storage Utility
 *
 * Single source of truth for all persistent key-value operations.
 * Uses react-native-mmkv for synchronous, encrypted, fast storage.
 */

import { MMKV } from 'react-native-mmkv';

// ─── MMKV instances ───────────────────────────────────────────────────────────

/** Primary app storage — auth, prefs, misc */
export const storage = new MMKV({ id: 'agridirect-app' });

/** Alias used by some screens */
export const appStorage = storage;

/** Separate instance for redux-persist so it never conflicts with raw reads */
export const reduxStorage = new MMKV({ id: 'agridirect-redux' });

// ─── Key constants ────────────────────────────────────────────────────────────

export const StorageKeys = {
  JWT_TOKEN: 'JWT_TOKEN',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  USER_DATA: 'USER_DATA',
  LANGUAGE: 'LANGUAGE',
  CART: 'CART',
  ONBOARDING_DONE: 'ONBOARDING_DONE',
  FCM_TOKEN: 'FCM_TOKEN',
  THEME: 'THEME',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

// ─── Primitives ───────────────────────────────────────────────────────────────

export const getString = (key: string): string | undefined =>
  storage.getString(key);

export const setString = (key: string, value: string): void =>
  storage.set(key, value);

/** Alias kept for backwards compatibility */
export const storageGet = getString;
export const storageSet = setString;

export const getBoolean = (key: string): boolean | undefined =>
  storage.getBoolean(key);

export const setBoolean = (key: string, value: boolean): void =>
  storage.set(key, value);

export const getNumber = (key: string): number | undefined =>
  storage.getNumber(key);

export const setNumber = (key: string, value: number): void =>
  storage.set(key, value);

/** Delete a single key */
export const deleteKey = (key: string): void => storage.delete(key);

/** Alias used in some interceptors */
export const storageRemove = deleteKey;

/** Wipe everything in the primary storage instance */
export const clear = (): void => storage.clearAll();

// ─── JSON helpers ─────────────────────────────────────────────────────────────

export const getObject = <T>(key: string): T | null => {
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setObject = <T>(key: string, value: T): void =>
  storage.set(key, JSON.stringify(value));

/** Aliases for callers that use storageGetJSON / storageSetJSON */
export const storageGetJSON = getObject;
export const storageSetJSON = setObject;

// ─── Typed auth helpers ───────────────────────────────────────────────────────

export const getAuthToken = (): string | undefined =>
  getString(StorageKeys.JWT_TOKEN);

export const setAuthToken = (token: string): void =>
  setString(StorageKeys.JWT_TOKEN, token);

export const removeAuthToken = (): void =>
  deleteKey(StorageKeys.JWT_TOKEN);

export const getRefreshToken = (): string | undefined =>
  getString(StorageKeys.REFRESH_TOKEN);

export const setRefreshToken = (token: string): void =>
  setString(StorageKeys.REFRESH_TOKEN, token);

export const removeRefreshToken = (): void =>
  deleteKey(StorageKeys.REFRESH_TOKEN);

// ─── User data ────────────────────────────────────────────────────────────────

export const getUserData = <T>(): T | null =>
  getObject<T>(StorageKeys.USER_DATA);

export const setUserData = <T>(user: T): void =>
  setObject(StorageKeys.USER_DATA, user);

export const removeUserData = (): void =>
  deleteKey(StorageKeys.USER_DATA);

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const isOnboardingDone = (): boolean =>
  getBoolean(StorageKeys.ONBOARDING_DONE) ?? false;

export const setOnboardingDone = (): void =>
  setBoolean(StorageKeys.ONBOARDING_DONE, true);

// ─── Language ─────────────────────────────────────────────────────────────────

export const getLanguage = (): string =>
  getString(StorageKeys.LANGUAGE) ?? 'en';

export const setLanguage = (lang: string): void =>
  setString(StorageKeys.LANGUAGE, lang);

// ─── FCM token ────────────────────────────────────────────────────────────────

export const getFcmToken = (): string | undefined =>
  getString(StorageKeys.FCM_TOKEN);

export const setFcmToken = (token: string): void =>
  setString(StorageKeys.FCM_TOKEN, token);

// ─── Full auth clear (logout) ─────────────────────────────────────────────────

export const clearAuthStorage = (): void => {
  removeAuthToken();
  removeRefreshToken();
  removeUserData();
};
