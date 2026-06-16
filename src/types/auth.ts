// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  DELIVERY = 'DELIVERY',
  ADMIN = 'ADMIN',
}

// ─── Core entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  isVerified: boolean;
  isBlocked: boolean;
  fcmToken?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth state (Redux slice shape) ──────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export type MeResponse = User;

// ─── Request types ────────────────────────────────────────────────────────────

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  idToken: string;
  role: UserRole;
  email?: string;
  // Farmer fields
  farmName?: string;
  location?: string;
  landAcres?: number;
  // Buyer fields
  buyerType?: string;
  address?: string;
  gstNumber?: string;
  // Delivery fields
  vehicleType?: string;
  licenseNo?: string;
}

export interface OTPRequest {
  phone: string;
  otp: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateFcmTokenRequest {
  fcmToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
