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
  getAuthToken,
  getRefreshToken,
  setAuthToken,
  clearAuthStorage,
} from '../utils/storage';
import ENV from '../config/env';

// ─── Constants ────────────────────────────────────────────────────────────────

export const BASE_URL = ENV.API_URL;

// ─── Auth event bus ───────────────────────────────────────────────────────────
// Allows navigation layer to listen for forced-logout without circular imports

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
    const token = getAuthToken();
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
  // Success: unwrap so callers receive ApiResponse<T> directly (no .then(r=>r.data))
  (response: AxiosResponse) => response.data,

  async (error) => {
    const originalRequest = error.config as RetryableConfig;

    // 401 — attempt silent token refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
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
            setAuthToken(newToken);
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

      // Clear stored creds and broadcast logout
      clearAuthStorage();
      authEvents.emit('logout');
    }

    // Normalise error
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
