// ─── Core entity ──────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  isActive: boolean;
  productCount: number;
  displayOrder?: number;
  parentId?: string;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  displayOrder?: number;
  parentId?: string;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;
