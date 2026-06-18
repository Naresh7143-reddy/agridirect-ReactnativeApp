import client from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api';
import type {
  Order,
  OrderStatus,
  PlaceOrderRequest,
  TrackingEvent,
  OrderFilters,
} from '../types/order';

export const ordersApi = {
  // ── Buyer ───────────────────────────────────────────────────────────────────

  /** Place a new order */
  place: (data: PlaceOrderRequest): Promise<ApiResponse<Order>> =>
    client.post('/api/buyer/orders', data),

  /** All orders placed by the authenticated buyer */
  getBuyerOrders: (
    params: OrderFilters & PaginationParams = {},
  ): Promise<PaginatedResponse<Order>> =>
    client.get('/api/buyer/orders', { params }),

  /** Single order details */
  getOrderById: (id: string): Promise<ApiResponse<Order>> =>
    client.get(`/api/buyer/orders/${id}`),

  /** Cancel a buyer order with optional reason */
  cancel: (id: string, reason?: string): Promise<ApiResponse<Order>> =>
    client.post(`/api/buyer/orders/${id}/cancel`, { reason }),

  /** Live tracking events for a buyer order */
  trackOrder: (id: string): Promise<ApiResponse<TrackingEvent[]>> =>
    client.get(`/api/buyer/orders/${id}/track`),

  /** Submit a review/rating after delivery */
  rateOrder: (
    id: string,
    rating: number,
    review?: string,
  ): Promise<ApiResponse<null>> =>
    client.post(`/api/buyer/orders/${id}/rate`, { rating, review }),

  // ── Farmer ──────────────────────────────────────────────────────────────────

  /** All orders received by the authenticated farmer */
  getFarmerOrders: (
    params: OrderFilters & PaginationParams = {},
  ): Promise<PaginatedResponse<Order>> =>
    client.get('/api/farmer/orders', { params }),

  /** Single order detail for farmer (enriched: buyer + agent info) */
  getFarmerOrderById: (id: string): Promise<ApiResponse<Order>> =>
    client.get(`/api/farmer/orders/${id}`),

  /** Accept an incoming order */
  accept: (id: string): Promise<ApiResponse<Order>> =>
    client.put(`/api/farmer/orders/${id}/accept`),

  /** Mark an order as packed and ready for pickup */
  markPacked: (id: string): Promise<ApiResponse<Order>> =>
    client.put(`/api/farmer/orders/${id}/packed`),

  // ── Admin ───────────────────────────────────────────────────────────────────

  /** All orders across the platform (admin) */
  getAllOrders: (
    params: OrderFilters & PaginationParams = {},
  ): Promise<PaginatedResponse<Order>> =>
    client.get('/api/admin/orders', { params }),

  /** Assign a delivery agent to a packed order */
  assignDelivery: (
    id: string,
    agentId: string,
  ): Promise<ApiResponse<Order>> =>
    client.post(`/api/admin/orders/${id}/assign-delivery`, { agentId }),

  /** Override order status (admin only) */
  updateStatus: (
    id: string,
    status: OrderStatus,
    note?: string,
  ): Promise<ApiResponse<Order>> =>
    client.put(`/api/admin/orders/${id}/status`, { status, note }),
};
