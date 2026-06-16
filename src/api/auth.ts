import client from './client';
import type { ApiResponse } from '../types/api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthTokens,
  MeResponse,
} from '../types/auth';

const BASE = '/api/auth';

export const authApi = {
  /** Register a new user (farmer / buyer / delivery agent) */
  register: (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> =>
    client.post(`${BASE}/register`, data),

  /** Login with phone + password */
  login: (data: LoginRequest): Promise<ApiResponse<AuthResponse>> =>
    client.post(`${BASE}/login`, data),

  /** Get current authenticated user */
  getMe: (): Promise<ApiResponse<MeResponse>> =>
    client.get(`${BASE}/me`),

  /** Store FCM push-notification token for this device */
  updateFcmToken: (fcmToken: string): Promise<ApiResponse<null>> =>
    client.put(`${BASE}/fcm-token`, { fcmToken }),

  /** Refresh access token */
  refreshToken: (refreshToken: string): Promise<ApiResponse<AuthTokens>> =>
    client.post(`${BASE}/refresh`, { refreshToken }),

  /** Logout — invalidates refresh token server-side */
  logout: (): Promise<ApiResponse<null>> =>
    client.post(`${BASE}/logout`),

  /** Send OTP to phone number */
  sendOTP: (phone: string): Promise<ApiResponse<{ expiresIn: number }>> =>
    client.post(`${BASE}/otp/send`, { phone }),

  /** Verify OTP code */
  verifyOTP: (phone: string, otp: string): Promise<ApiResponse<AuthResponse>> =>
    client.post(`${BASE}/otp/verify`, { phone, otp }),

  /** Initiate forgot-password flow */
  forgotPassword: (phone: string): Promise<ApiResponse<null>> =>
    client.post(`${BASE}/forgot-password`, { phone }),

  /** Complete password reset */
  resetPassword: (
    token: string,
    newPassword: string,
  ): Promise<ApiResponse<null>> =>
    client.post(`${BASE}/reset-password`, { token, newPassword }),

  /**
   * Exchange a Firebase ID token for an AgriDirect JWT.
   * Called after Firebase phone-auth completes on the client.
   */
  loginWithIdToken: (idToken: string): Promise<ApiResponse<AuthResponse>> =>
    client.post(`${BASE}/firebase`, { idToken }),
};
