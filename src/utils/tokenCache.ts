/**
 * tokenCache — simple in-process token store
 *
 * The API client (Axios) needs tokens synchronously in its request interceptor.
 * AsyncStorage is async-only, so we keep a runtime cache here.
 *
 * Flow:
 *  1. App starts → AppBootstrap calls loadTokensFromStorage()
 *  2. Redux-persist rehydrates auth slice → also calls setTokenCache()
 *  3. Login/logout → update both AsyncStorage and this cache
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_JWT = 'agridirect_jwt';
const KEY_REFRESH = 'agridirect_refresh';

let _token: string | null = null;
let _refreshToken: string | null = null;

// ── Read ──────────────────────────────────────────────────────────────────────

export const getCachedToken = (): string | null => _token;
export const getCachedRefreshToken = (): string | null => _refreshToken;

// ── Write ─────────────────────────────────────────────────────────────────────

export const setCachedToken = (token: string | null): void => {
  _token = token;
};

export const setCachedRefreshToken = (rt: string | null): void => {
  _refreshToken = rt;
};

// ── Persist ───────────────────────────────────────────────────────────────────

export const persistToken = async (token: string): Promise<void> => {
  _token = token;
  await AsyncStorage.setItem(KEY_JWT, token);
};

export const persistRefreshToken = async (rt: string): Promise<void> => {
  _refreshToken = rt;
  await AsyncStorage.setItem(KEY_REFRESH, rt);
};

export const clearPersistedTokens = async (): Promise<void> => {
  _token = null;
  _refreshToken = null;
  await AsyncStorage.multiRemove([KEY_JWT, KEY_REFRESH]);
};

// ── Load on startup ───────────────────────────────────────────────────────────

export const loadTokensFromStorage = async (): Promise<void> => {
  try {
    const [jwt, rt] = await AsyncStorage.multiGet([KEY_JWT, KEY_REFRESH]);
    _token = jwt[1] ?? null;
    _refreshToken = rt[1] ?? null;
  } catch {
    // silently ignore
  }
};
