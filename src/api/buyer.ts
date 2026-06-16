import client from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api';
import type {
  BuyerProfile,
  UpdateBuyerProfileRequest,
  Address,
  AddAddressRequest,
  Wishlist,
} from '../types/buyer';
import type { Product } from '../types/product';

export const buyerApi = {
  // ── Profile ─────────────────────────────────────────────────────────────────

  /** Get authenticated buyer's profile */
  getProfile: (): Promise<ApiResponse<BuyerProfile>> =>
    client.get('/api/buyer/profile'),

  /** Update profile (name, phone, avatar, etc.) */
  updateProfile: (
    data: UpdateBuyerProfileRequest,
  ): Promise<ApiResponse<BuyerProfile>> =>
    client.put('/api/buyer/profile', data),

  /** Upload profile photo */
  uploadPhoto: (
    file: FormData,
  ): Promise<ApiResponse<{ photoUrl: string }>> =>
    client.post('/api/buyer/profile/photo', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ── Addresses ───────────────────────────────────────────────────────────────

  /** All saved delivery addresses */
  getAddresses: (): Promise<ApiResponse<Address[]>> =>
    client.get('/api/buyer/addresses'),

  /** Add a new delivery address */
  addAddress: (data: AddAddressRequest): Promise<ApiResponse<Address>> =>
    client.post('/api/buyer/addresses', data),

  /** Update an existing address */
  updateAddress: (
    addressId: string,
    data: Partial<AddAddressRequest>,
  ): Promise<ApiResponse<Address>> =>
    client.put(`/api/buyer/addresses/${addressId}`, data),

  /** Delete a saved address */
  deleteAddress: (addressId: string): Promise<ApiResponse<null>> =>
    client.delete(`/api/buyer/addresses/${addressId}`),

  /** Set an address as the default delivery address */
  setDefaultAddress: (addressId: string): Promise<ApiResponse<null>> =>
    client.patch(`/api/buyer/addresses/${addressId}/default`),

  // ── Wishlist ─────────────────────────────────────────────────────────────────

  /** Paginated wishlist */
  getWishlist: (
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Wishlist>> =>
    client.get('/api/buyer/wishlist', { params }),

  /** Add product to wishlist */
  addToWishlist: (productId: string): Promise<ApiResponse<null>> =>
    client.post('/api/buyer/wishlist', { productId }),

  /** Remove product from wishlist */
  removeFromWishlist: (productId: string): Promise<ApiResponse<null>> =>
    client.delete(`/api/buyer/wishlist/${productId}`),

  /** Check if a product is in the wishlist */
  isInWishlist: (productId: string): Promise<ApiResponse<{ inWishlist: boolean }>> =>
    client.get(`/api/buyer/wishlist/${productId}/check`),
};
