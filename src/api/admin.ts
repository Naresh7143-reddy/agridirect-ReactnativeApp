import client from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api';
import type { User } from '../types/auth';
import type { Product } from '../types/product';
import type {
  AdminAnalytics,
  PendingFarmer,
  NotificationPayload,
  AdminOrderFilters,
  ReportType,
  Report,
} from '../types/admin';
import type { Order } from '../types/order';

export const adminApi = {
  // ── Analytics ───────────────────────────────────────────────────────────────

  /** Platform-wide analytics — revenue, user counts, order stats */
  getAnalytics: (params?: {
    from?: string;
    to?: string;
  }): Promise<ApiResponse<AdminAnalytics>> =>
    client.get('/api/admin/analytics', { params }),

  /** Generate downloadable report */
  getReport: (
    type: ReportType,
    params?: { from?: string; to?: string },
  ): Promise<ApiResponse<Report>> =>
    client.get(`/api/admin/reports/${type}`, { params }),

  // ── User management ──────────────────────────────────────────────────────────

  /** All users with optional role/search filter */
  getUsers: (
    params: PaginationParams & { role?: string; search?: string } = {},
  ): Promise<PaginatedResponse<User>> =>
    client.get('/api/admin/users', { params }),

  /** Users filtered by role */
  getUsersByRole: (
    role: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<User>> =>
    client.get(`/api/admin/users/role/${role}`, { params }),

  /** Single user detail */
  getUserById: (id: string): Promise<ApiResponse<User>> =>
    client.get(`/api/admin/users/${id}`),

  /** Block a user with reason */
  blockUser: (
    id: string,
    reason?: string,
  ): Promise<ApiResponse<null>> =>
    client.put(`/api/admin/users/${id}/block`, { reason }),

  /** Unblock a previously blocked user */
  unblockUser: (id: string): Promise<ApiResponse<null>> =>
    client.put(`/api/admin/users/${id}/unblock`),

  // ── Farmer verification ──────────────────────────────────────────────────────

  /** Farmers awaiting verification */
  getPendingFarmers: (
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<PendingFarmer>> =>
    client.get('/api/admin/farmers/pending', { params }),

  /** Approve a farmer account */
  verifyFarmer: (farmerId: string): Promise<ApiResponse<null>> =>
    client.put(`/api/admin/farmers/${farmerId}/verify`),

  /** Reject a farmer with reason */
  rejectFarmer: (
    farmerId: string,
    reason: string,
  ): Promise<ApiResponse<null>> =>
    client.put(`/api/admin/farmers/${farmerId}/reject`, { reason }),

  // ── Product moderation ───────────────────────────────────────────────────────

  /** Products pending admin approval */
  getPendingProducts: (
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Product>> =>
    client.get('/api/admin/products/pending', { params }),

  /** Approve a product listing */
  approveProduct: (productId: string): Promise<ApiResponse<Product>> =>
    client.put(`/api/admin/products/${productId}/approve`),

  /** Reject a product listing with reason */
  rejectProduct: (
    productId: string,
    reason: string,
  ): Promise<ApiResponse<Product>> =>
    client.put(`/api/admin/products/${productId}/reject`, { reason }),

  // ── Orders ───────────────────────────────────────────────────────────────────

  /** All platform orders */
  getAllOrders: (
    params: AdminOrderFilters & PaginationParams = {},
  ): Promise<PaginatedResponse<Order>> =>
    client.get('/api/admin/orders', { params }),

  /** Assign a delivery agent to an order */
  assignDelivery: (
    orderId: string,
    agentId: string,
  ): Promise<ApiResponse<Order>> =>
    client.post(`/api/admin/orders/${orderId}/assign-delivery`, { agentId }),

  // ── Notifications ─────────────────────────────────────────────────────────────

  /** Broadcast push notification to users or roles */
  sendNotification: (
    payload: NotificationPayload,
  ): Promise<ApiResponse<{ sent: number }>> =>
    client.post('/api/admin/notifications', payload),
};
