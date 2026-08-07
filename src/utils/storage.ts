/**
 * AgriDirect — Storage Utility
 *
 * Uses a pure-JS MMKV stub (no native C++ modules required).
 * Fully compatible with React Native new architecture build.
 */

import { MMKV } from './mmkvStub';

const mmkvApp = new MMKV({ id: 'agridirect-app' });
const mmkvRedux = new MMKV({ id: 'agridirect-redux' });

// ─── Primary app storage ──────────────────────────────────────────────────────

export const storage: any = {
  getString: (key: string): string | undefined => mmkvApp.getString(key),
  set: (key: string, value: any): void => mmkvApp.set(key, value),
  getBoolean: (key: string): boolean | undefined => mmkvApp.getBoolean(key),
  getNumber: (key: string): number | undefined => mmkvApp.getNumber(key),
  delete: (key: string): void => mmkvApp.delete(key),
  clearAll: (): void => mmkvApp.clearAll(),
  getAllKeys: (): string[] => mmkvApp.getAllKeys(),
};

export const appStorage = storage;

// ─── Redux-persist storage adapter ───────────────────────────────────────────

export const reduxStorage: any = {
  getItem: (key: string): Promise<string | null> =>
    Promise.resolve(mmkvRedux.getString(key) ?? null),
  setItem: (key: string, value: string): Promise<void> => {
    mmkvRedux.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    mmkvRedux.delete(key);
    return Promise.resolve();
  },
};

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

export const getString = (key: string): string | undefined => storage.getString(key);
export const setString = (key: string, value: string): void => storage.set(key, value);

export const storageGet = getString;
export const storageSet = setString;

export const getBoolean = (key: string): boolean | undefined => storage.getBoolean(key);
export const setBoolean = (key: string, value: boolean): void => storage.set(key, value);

export const getNumber = (key: string): number | undefined => storage.getNumber(key);
export const setNumber = (key: string, value: number): void => storage.set(key, value);

export const deleteKey = (key: string): void => storage.delete(key);
export const storageRemove = deleteKey;

export const clear = (): void => storage.clearAll();

// ─── JSON helpers ─────────────────────────────────────────────────────────────

export const getObject = <T>(key: string): T | null => {
  const raw = storage.getString(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
};

export const setObject = <T>(key: string, value: T): void =>
  storage.set(key, JSON.stringify(value));

export const storageGetJSON = getObject;
export const storageSetJSON = setObject;

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const getAuthToken = (): string | undefined => getString(StorageKeys.JWT_TOKEN);
export const setAuthToken = (token: string): void => setString(StorageKeys.JWT_TOKEN, token);
export const removeAuthToken = (): void => deleteKey(StorageKeys.JWT_TOKEN);

export const getRefreshToken = (): string | undefined => getString(StorageKeys.REFRESH_TOKEN);
export const setRefreshToken = (token: string): void => setString(StorageKeys.REFRESH_TOKEN, token);
export const removeRefreshToken = (): void => deleteKey(StorageKeys.REFRESH_TOKEN);

// ─── User data ────────────────────────────────────────────────────────────────

export const getUserData = <T>(): T | null => getObject<T>(StorageKeys.USER_DATA);
export const setUserData = <T>(user: T): void => setObject(StorageKeys.USER_DATA, user);
export const removeUserData = (): void => deleteKey(StorageKeys.USER_DATA);

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const isOnboardingDone = (): boolean => getBoolean(StorageKeys.ONBOARDING_DONE) ?? false;
export const setOnboardingDone = (): void => setBoolean(StorageKeys.ONBOARDING_DONE, true);

// ─── Language ─────────────────────────────────────────────────────────────────

export const getLanguage = (): string => getString(StorageKeys.LANGUAGE) ?? 'en';
export const setLanguage = (lang: string): void => setString(StorageKeys.LANGUAGE, lang);

// ─── FCM token ────────────────────────────────────────────────────────────────

export const getFcmToken = (): string | undefined => getString(StorageKeys.FCM_TOKEN);
export const setFcmToken = (token: string): void => setString(StorageKeys.FCM_TOKEN, token);

// ─── Logout ───────────────────────────────────────────────────────────────────

export const clearAuthStorage = (): void => {
  removeAuthToken();
  removeRefreshToken();
  removeUserData();
};
