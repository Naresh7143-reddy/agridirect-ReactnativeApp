import client from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/category';
import type { Product } from '../types/product';

export const categoriesApi = {
  // ── Public ──────────────────────────────────────────────────────────────────

  /** All active categories */
  getAll: (): Promise<ApiResponse<Category[]>> =>
    client.get('/api/categories'),

  /** Single category by ID */
  getById: (id: string): Promise<ApiResponse<Category>> =>
    client.get(`/api/categories/${id}`),

  /** Paginated products within a category */
  getProducts: (
    id: string,
    params: PaginationParams & { sort?: string } = {},
  ): Promise<PaginatedResponse<Product>> =>
    client.get(`/api/categories/${id}/products`, { params }),

  // ── Admin ───────────────────────────────────────────────────────────────────

  /** Create a new category */
  create: (data: CreateCategoryRequest): Promise<ApiResponse<Category>> =>
    client.post('/api/admin/categories', data),

  /** Update category name / image */
  update: (
    id: string,
    data: UpdateCategoryRequest,
  ): Promise<ApiResponse<Category>> =>
    client.put(`/api/admin/categories/${id}`, data),

  /**
   * Toggle a category's active/inactive state.
   * Inactive categories are hidden from buyers.
   */
  toggle: (id: string): Promise<ApiResponse<Category>> =>
    client.put(`/api/admin/categories/${id}/toggle`),

  /** Delete a category (only if no active products are linked) */
  delete: (id: string): Promise<ApiResponse<null>> =>
    client.delete(`/api/admin/categories/${id}`),

  /** Upload category icon/banner image */
  uploadImage: (
    id: string,
    file: FormData,
  ): Promise<ApiResponse<{ imageUrl: string }>> =>
    client.post(`/api/admin/categories/${id}/image`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
