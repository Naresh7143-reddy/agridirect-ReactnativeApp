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
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Storage } from 'redux-persist';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from './authSlice';
import cartReducer from './cartSlice';
import appReducer from './appSlice';

// ─── AsyncStorage → redux-persist Storage adapter ────────────────────────────
// Uses real on-disk AsyncStorage so auth/cart/settings survive app restarts.

const asyncStorage: Storage = {
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  getItem: (key) => AsyncStorage.getItem(key),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

// ─── Per-slice persist configs ────────────────────────────────────────────────

const authPersistConfig = {
  key: 'auth',
  version: 1,
  storage: asyncStorage,
  blacklist: ['isLoading', 'firebaseUser'],
};

const cartPersistConfig = {
  key: 'cart',
  version: 1,
  storage: asyncStorage,
};

const appPersistConfig = {
  key: 'app',
  version: 1,
  storage: asyncStorage,
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
