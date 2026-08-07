// ─── Category ─────────────────────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
  parentId?: string;
  createdAt: string;
}

// ─── Product images ───────────────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  url: string;
  publicId: string; // Cloudinary / S3 key for deletion
  isPrimary: boolean;
  order: number;
}

// ─── Core product entity ──────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;          // price per unit, in paise (₹ × 100) OR rupees — match backend
  unit: string;           // e.g. "kg", "dozen", "piece"
  stock: number;
  stockQuantity?: number; // backend alias — use stock ?? stockQuantity
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  categoryId: string;
  category?: ProductCategory;
  farmerId: string;
  farmerName?: string;
  farmerLocation?: string;
  images: ProductImage[];
  primaryImageUrl?: string; // convenience — first primary image URL
  isAvailable: boolean;
  isApproved: boolean;
  isOrganic?: boolean;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  harvestDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ProductFilters {
  categoryId?: string;
  farmerId?: string;
  minPrice?: number;
  maxPrice?: number;
  unit?: string;
  isOrganic?: boolean;
  isAvailable?: boolean;
  search?: string;
  sortBy?: 'price' | 'rating' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  categoryId: string;
  isOrganic?: boolean;
  harvestDate?: string;
  expiryDate?: string;
  tags?: string[];
}

export type UpdateProductRequest = Partial<CreateProductRequest> & {
  isAvailable?: boolean;
};

export interface UploadImageResponse {
  imageUrl: string;
  publicId: string;
}
