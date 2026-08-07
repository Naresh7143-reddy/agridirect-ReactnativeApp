import client from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api';
import type {
  Product,
  ProductCategory,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
} from '../types/product';

export const productsApi = {
  // ── Public / Buyer ──────────────────────────────────────────────────────────

  /** All available products with optional filters & pagination */
  getAll: (
    params: ProductFilters & PaginationParams = {},
  ): Promise<PaginatedResponse<Product>> =>
    client.get('/api/products', { params }),

  /** Single product by ID */
  getById: (id: string): Promise<ApiResponse<Product>> =>
    client.get(`/api/products/${id}`),

  /** Products filtered by category */
  getByCategory: (
    categoryId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Product>> =>
    client.get(`/api/products/category/${categoryId}`, { params }),

  /** Full-text search */
  search: (
    q: string,
    params: ProductFilters & PaginationParams = {},
  ): Promise<PaginatedResponse<Product>> =>
    client.get('/api/products/search', { params: { q, ...params } }),

  // ── Farmer ──────────────────────────────────────────────────────────────────

  /** Farmer's own product listings */
  getMyListings: (
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Product>> =>
    client.get('/api/farmer/products', { params }),

  /** Single product by ID — farmer view (includes stock, isAvailable, full data) */
  getFarmerProductById: (id: string): Promise<ApiResponse<Product>> =>
    client.get(`/api/farmer/products/${id}`),

  /** Create a new product listing */
  create: (data: CreateProductRequest): Promise<ApiResponse<Product>> =>
    client.post('/api/farmer/products', data),

  /** Update an existing listing */
  update: (
    id: string,
    data: UpdateProductRequest,
  ): Promise<ApiResponse<Product>> =>
    client.put(`/api/farmer/products/${id}`, data),

  /** Delete a listing */
  delete: (id: string): Promise<ApiResponse<null>> =>
    client.delete(`/api/farmer/products/${id}`),

  /** Upload product image — returns hosted URL */
  uploadImage: (
    file: FormData,
  ): Promise<ApiResponse<{ imageUrl: string; publicId: string }>> =>
    client.post('/api/farmer/products/upload-image', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** Toggle product availability on/off */
  toggleAvailability: (id: string): Promise<ApiResponse<Product>> =>
    client.patch(`/api/farmer/products/${id}/availability`),
};
