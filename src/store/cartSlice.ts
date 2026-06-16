import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { Product } from '../types/product';

// ─── CartItem — flat shape (no full Product object in store) ──────────────────

export interface CartItem {
  productId: string;
  name: string;
  price: number;         // price per unit
  unit: string;
  image: string;         // primary image URL
  farmerId: string;
  farmerName?: string;
  quantity: number;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  stock: number;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  /** Derived — kept in state for O(1) reads without recomputing */
  totalItems: number;
  totalAmount: number;
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const recalculate = (items: CartItem[]): Pick<CartState, 'totalItems' | 'totalAmount'> => ({
  totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
  totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
});

/** Map a Product entity to a flat CartItem.
 *  Defensive against backend shape drift: backend may send `stockQuantity`
 *  instead of `stock`, and `imageUrls: string[]` instead of `images:[{url}]`.
 *  Any missing/NaN field falls back to a safe default so the cart never
 *  ends up with NaN quantity or price.
 */
const productToCartItem = (product: Product, quantity: number): CartItem => {
  const anyP = product as any;
  const stock = Number.isFinite(product.stock as number)
    ? (product.stock as number)
    : Number.isFinite(anyP.stockQuantity) ? Number(anyP.stockQuantity) : 999;
  const minOrderQuantity = Number.isFinite(product.minOrderQuantity as number)
    ? (product.minOrderQuantity as number)
    : 1;
  const maxOrderQuantity = Number.isFinite(product.maxOrderQuantity as number)
    ? product.maxOrderQuantity
    : stock;
  const safeQty = Number.isFinite(quantity) && quantity > 0
    ? quantity
    : minOrderQuantity;
  const imgUrls: string[] = Array.isArray(anyP.imageUrls) ? anyP.imageUrls : [];
  const image =
    product.primaryImageUrl ??
    product.images?.find((img) => img.isPrimary)?.url ??
    product.images?.[0]?.url ??
    imgUrls[0] ??
    '';
  return {
    productId: product.id,
    name: product.name,
    price: Number(product.price) || 0,
    unit: product.unit ?? 'kg',
    image,
    farmerId: product.farmerId,
    farmerName: product.farmerName,
    quantity: safeQty,
    minOrderQuantity,
    maxOrderQuantity,
    stock,
  };
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /**
     * addItem — adds product to cart.
     * If the product already exists, increments quantity (capped at maxOrderQuantity).
     */
    addItem(
      state,
      action: PayloadAction<{ product: Product; quantity?: number }>,
    ) {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.productId === product.id);

      if (existing) {
        const max = Number.isFinite(existing.maxOrderQuantity as number)
          ? (existing.maxOrderQuantity as number)
          : Number.isFinite(existing.stock) ? existing.stock : 999;
        const newQty = existing.quantity + (Number.isFinite(quantity) ? quantity : 1);
        existing.quantity = Math.min(Number.isFinite(newQty) ? newQty : 1, max);
      } else {
        const minQ = Number.isFinite(product.minOrderQuantity as number)
          ? (product.minOrderQuantity as number)
          : 1;
        const safeIn = Number.isFinite(quantity) && quantity > 0 ? quantity : minQ;
        const clampedQty = Math.max(safeIn, minQ);
        const cappedQty = Number.isFinite(product.maxOrderQuantity as number)
          ? Math.min(clampedQty, product.maxOrderQuantity as number)
          : clampedQty;
        state.items.push(productToCartItem(product, cappedQty));
      }

      const { totalItems, totalAmount } = recalculate(state.items);
      state.totalItems = totalItems;
      state.totalAmount = totalAmount;
    },

    /** removeItem — remove a product from cart entirely */
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
      const { totalItems, totalAmount } = recalculate(state.items);
      state.totalItems = totalItems;
      state.totalAmount = totalAmount;
    },

    /**
     * updateQuantity — set exact quantity.
     * If quantity ≤ 0, the item is removed.
     * If quantity > maxOrderQuantity, it is capped.
     */
    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.productId === productId);

      if (!item) return;

      if (!Number.isFinite(quantity) || quantity <= 0) {
        state.items = state.items.filter((i) => i.productId !== productId);
      } else {
        const max = Number.isFinite(item.maxOrderQuantity as number)
          ? (item.maxOrderQuantity as number)
          : Number.isFinite(item.stock) ? item.stock : 999;
        item.quantity = Math.min(quantity, max);
      }

      const { totalItems, totalAmount } = recalculate(state.items);
      state.totalItems = totalItems;
      state.totalAmount = totalAmount;
    },

    /** clearCart — empty the cart completely */
    clearCart(state) {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } =
  cartSlice.actions;

/** Alias — lets useAuth dispatch clearCart without a circular import */
export const clearCartAction = clearCart;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCartItems = (state: RootState): CartItem[] =>
  state.cart.items;

export const selectCartTotal = (state: RootState): number =>
  state.cart.totalAmount;

export const selectCartItemCount = (state: RootState): number =>
  state.cart.totalItems;

/** Per-product quantity — returns 0 if the product is not in cart */
export const selectItemQuantity = (productId: string) =>
  createSelector(
    selectCartItems,
    (items) => items.find((i) => i.productId === productId)?.quantity ?? 0,
  );

/** Whether a product is in the cart */
export const selectIsInCart = (productId: string) =>
  createSelector(selectCartItems, (items) =>
    items.some((i) => i.productId === productId),
  );

/** Cart items grouped by farmer (for multi-farmer order splitting) */
export const selectCartByFarmer = createSelector(
  selectCartItems,
  (items) => {
    const map = new Map<string, CartItem[]>();
    items.forEach((item) => {
      const existing = map.get(item.farmerId) ?? [];
      map.set(item.farmerId, [...existing, item]);
    });
    return map;
  },
);

/** True if the cart contains products from more than one farmer */
export const selectIsMultiFarmerCart = createSelector(
  selectCartByFarmer,
  (byFarmer) => byFarmer.size > 1,
);

export default cartSlice.reducer;
