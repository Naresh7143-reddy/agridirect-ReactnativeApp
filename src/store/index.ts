/**
 * AgriDirect Redux Store
 *
 * Persistence strategy:
 *  - auth    → persisted, but `isLoading` and `firebaseUser` are blacklisted
 *  - cart    → fully persisted (flat CartItem[], no Product objects)
 *  - app     → persisted, but `isAppReady`, `isOnline`, and `toasts` are blacklisted
 *
 * Storage: MMKV via a custom redux-persist Storage adapter (synchronous r/w,
 * wrapped in Promises to satisfy the Storage interface).
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import type { Storage } from 'redux-persist';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { reduxStorage } from '../utils/storage';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import appReducer from './appSlice';

// ─── MMKV → redux-persist Storage adapter ────────────────────────────────────

const mmkvStorage: Storage = {
  setItem: (key, value) => {
    reduxStorage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key) => {
    const value = reduxStorage.getString(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: (key) => {
    reduxStorage.delete(key);
    return Promise.resolve();
  },
};

// ─── Per-slice persist configs ────────────────────────────────────────────────

const authPersistConfig = {
  key: 'auth',
  version: 1,
  storage: mmkvStorage,
  // Never persist loading/firebase state — those are runtime-only
  blacklist: ['isLoading', 'firebaseUser'],
};

const cartPersistConfig = {
  key: 'cart',
  version: 1,
  storage: mmkvStorage,
  // Persist everything — cart items are flat (no Product refs)
};

const appPersistConfig = {
  key: 'app',
  version: 1,
  storage: mmkvStorage,
  // selectedLanguage and theme persist; runtime flags do not
  whitelist: ['selectedLanguage', 'theme', 'fcmToken'],
};

// ─── Root reducer ─────────────────────────────────────────────────────────────

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  cart: persistReducer(cartPersistConfig, cartReducer),
  app: persistReducer(appPersistConfig, appReducer),
});

// ─── Store ────────────────────────────────────────────────────────────────────

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist dispatches non-serializable actions internally
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the entire Redux state tree */
export type RootState = ReturnType<typeof rootReducer>;

/** Typed dispatch — use instead of plain `useDispatch` */
export type AppDispatch = typeof store.dispatch;

// ─── Pre-typed hooks ──────────────────────────────────────────────────────────
// Import these in components instead of raw useDispatch / useSelector

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
