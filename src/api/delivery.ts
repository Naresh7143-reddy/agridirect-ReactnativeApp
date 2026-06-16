import client from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api';
import type {
  DeliveryProfile,
  UpdateDeliveryProfileRequest,
  DeliveryOrder,
  DeliveryStatus,
  LocationUpdate,
  DeliveryEarnings,
} from '../types/delivery';

export const deliveryApi = {
  // ── Profile ─────────────────────────────────────────────────────────────────

  /** Get delivery agent's own profile */
  getProfile: (): Promise<ApiResponse<DeliveryProfile>> =>
    client.get('/api/delivery/profile'),

  /** Update profile (name, vehicle info, etc.) */
  updateProfile: (
    data: UpdateDeliveryProfileRequest,
  ): Promise<ApiResponse<DeliveryProfile>> =>
    client.put('/api/delivery/profile', data),

  /** Upload profile photo */
  uploadPhoto: (
    file: FormData,
  ): Promise<ApiResponse<{ photoUrl: string }>> =>
    client.post('/api/delivery/profile/photo', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ── Availability ─────────────────────────────────────────────────────────────

  /** Toggle online / offline availability for receiving deliveries */
  updateAvailability: (available: boolean): Promise<ApiResponse<null>> =>
    client.put('/api/delivery/availability', { available }),

  // ── Orders ───────────────────────────────────────────────────────────────────

  /** All orders assigned to the authenticated delivery agent */
  getAssignedOrders: (
    params: PaginationParams & { status?: DeliveryStatus } = {},
  ): Promise<PaginatedResponse<DeliveryOrder>> =>
    client.get('/api/delivery/orders', { params }),

  /** Open marketplace: packed orders no agent has claimed yet (Swiggy-style) */
  getAvailableOrders: (): Promise<ApiResponse<DeliveryOrder[]>> =>
    client.get('/api/delivery/orders/available'),

  /** Self-claim an available order from the open pool */
  claimOrder: (id: string): Promise<ApiResponse<DeliveryOrder>> =>
    client.post(`/api/delivery/orders/${id}/claim`),

  /** Single assigned order details */
  getOrderById: (id: string): Promise<ApiResponse<DeliveryOrder>> =>
    client.get(`/api/delivery/orders/${id}`),

  /** Update delivery status (picked_up → in_transit → delivered / failed) */
  updateOrderStatus: (
    id: string,
    status: DeliveryStatus,
    note?: string,
  ): Promise<ApiResponse<DeliveryOrder>> =>
    client.put(`/api/delivery/orders/${id}/status`, { status, note }),

  /**
   * Confirm delivery with proof of delivery image.
   * Sends as base64 encoded string.
   */
  confirmDelivery: (
    id: string,
    proofBase64: string,
  ): Promise<ApiResponse<DeliveryOrder>> =>
    client.post(`/api/delivery/orders/${id}/confirm`, { proof: proofBase64 }),

  // ── Location ─────────────────────────────────────────────────────────────────

  /**
   * Push real-time GPS location to the backend.
   * Call this every ~10s while on an active delivery.
   */
  updateLocation: (location: LocationUpdate): Promise<ApiResponse<null>> =>
    client.put('/api/delivery/location', location),

  // ── Earnings ─────────────────────────────────────────────────────────────────

  /** Earnings summary with daily/weekly/monthly breakdown */
  getEarnings: (params?: {
    from?: string;
    to?: string;
  }): Promise<ApiResponse<DeliveryEarnings>> =>
    client.get('/api/delivery/earnings', { params }),
};
