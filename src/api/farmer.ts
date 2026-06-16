import client from './client';
import type { ApiResponse } from '../types/api';
import type {
  FarmerProfile,
  UpdateFarmerProfileRequest,
  FarmerDashboard,
  FarmerEarnings,
  BankDetails,
} from '../types/farmer';

export const farmerApi = {
  /** Get the authenticated farmer's profile */
  getProfile: (): Promise<ApiResponse<FarmerProfile>> =>
    client.get('/api/farmer/profile'),

  /** Update profile fields */
  updateProfile: (
    data: UpdateFarmerProfileRequest,
  ): Promise<ApiResponse<FarmerProfile>> =>
    client.put('/api/farmer/profile', data),

  /** Dashboard stats — revenue, order counts, top products, etc. */
  getDashboard: (): Promise<ApiResponse<FarmerDashboard>> =>
    client.get('/api/farmer/dashboard'),

  /** Earnings summary with date-range breakdown */
  getEarnings: (params?: {
    from?: string;
    to?: string;
  }): Promise<ApiResponse<FarmerEarnings>> =>
    client.get('/api/farmer/earnings', { params }),

  /**
   * Upload a profile photo.
   * Expects a FormData with key "photo" containing the image file.
   */
  uploadProfilePhoto: (
    file: FormData,
  ): Promise<ApiResponse<{ photoUrl: string }>> =>
    client.post('/api/farmer/profile/photo', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** Add or update bank account details for payouts */
  saveBankDetails: (
    data: BankDetails,
  ): Promise<ApiResponse<null>> =>
    client.put('/api/farmer/bank-details', data),

  /** Fetch saved bank details */
  getBankDetails: (): Promise<ApiResponse<BankDetails>> =>
    client.get('/api/farmer/bank-details'),

  /** Public farmer profile (for buyers to view) */
  getPublicProfile: (farmerId: string): Promise<ApiResponse<FarmerProfile>> =>
    client.get(`/api/farmer/${farmerId}/public`),
};
