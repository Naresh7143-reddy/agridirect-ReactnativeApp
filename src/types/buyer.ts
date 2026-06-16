import type { Product } from './product';

// ─── Address ──────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  label: string;           // "Home", "Office", "Other"
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export type AddAddressRequest = Omit<Address, 'id' | 'isDefault'> & {
  setAsDefault?: boolean;
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface BuyerProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  defaultAddress?: Address;
  addresses: Address[];
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBuyerProfileRequest {
  name?: string;
  email?: string;
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface Wishlist {
  id: string;
  buyerId: string;
  product: Product;
  addedAt: string;
}
