/**
 * AgriDirect API Client
 * Base URL: https://agridirect-backend-80yz.onrender.com
 *
 * Responsibilities:
 *  - Attach JWT Bearer token on every request
 *  - Auto-refresh on 401 using stored refresh token
 *  - Unwrap response.data so callers receive the payload directly
 *  - Broadcast logout event when refresh also fails
 *  - Normalise error shape into ApiError
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { EventEmitter } from 'eventemitter3';
import {
  getCachedToken,
  getCachedRefreshToken,
  setCachedToken,
  clearPersistedTokens,
} from '../utils/tokenCache';
import ENV from '../config/env';

// ─── Constants ────────────────────────────────────────────────────────────────

export const BASE_URL = ENV.API_URL;

// ─── Auth event bus ───────────────────────────────────────────────────────────

export const authEvents = new EventEmitter<{ logout: [] }>();

// ─── Axios instance ───────────────────────────────────────────────────────────

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor — attach token ───────────────────────────────────────

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCachedToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ─────────────────────────────────────────────────────

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

client.interceptors.response.use(
  (response: AxiosResponse) => response.data,

  async (error) => {
    const originalRequest = error.config as RetryableConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getCachedRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${BASE_URL}/api/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } },
          );
          const newToken: string =
            data?.data?.accessToken ?? data?.accessToken;
          if (newToken) {
            setCachedToken(newToken);
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization =
                `Bearer ${newToken}`;
            }
            return client(originalRequest);
          }
        } catch {
          // fall through to logout
        }
      }

      await clearPersistedTokens();
      authEvents.emit('logout');
    }

    return Promise.reject({
      message:
        error.response?.data?.message ??
        error.message ??
        'An unexpected error occurred',
      status: error.response?.status,
      code: error.response?.data?.code,
      data: error.response?.data,
    });
  },
);

export default client;
