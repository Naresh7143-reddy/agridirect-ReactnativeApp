/**
 * useCart — shopping cart hook
 *
 * Thin wrapper over cartSlice that provides a clean API surface.
 * All methods are memoised with useCallback so they're safe to pass as props.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addItem,
  removeItem,
  updateQuantity,
  clearCart as clearCartAction,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  selectItemQuantity,
  selectIsInCart,
  selectCartByFarmer,
  selectIsMultiFarmerCart,
  type CartItem,
} from '../store/cartSlice';
import type { Product } from '../types/product';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCart = () => {
  const dispatch = useAppDispatch();

  // ── Selectors (re-renders only when relevant slice changes) ─────────────────

  const cartItems = useAppSelector(selectCartItems);
  const totalAmount = useAppSelector(selectCartTotal);
  const totalItems = useAppSelector(selectCartItemCount);
  const cartByFarmer = useAppSelector(selectCartByFarmer);
  const isMultiFarmerCart = useAppSelector(selectIsMultiFarmerCart);

  // ── Actions ─────────────────────────────────────────────────────────────────

  /** Add a product to the cart. Increments quantity if already present. */
  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      dispatch(addItem({ product, quantity }));
    },
    [dispatch],
  );

  /** Remove a product from the cart entirely */
  const removeFromCart = useCallback(
    (productId: string) => {
      dispatch(removeItem(productId));
    },
    [dispatch],
  );

  /**
   * Set the exact quantity for a cart item.
   * Passing 0 removes the item.
   */
  const updateQty = useCallback(
    (productId: string, qty: number) => {
      dispatch(updateQuantity({ productId, quantity: qty }));
    },
    [dispatch],
  );

  /** Increment quantity by 1 (respects maxOrderQuantity) */
  const incrementQty = useCallback(
    (productId: string) => {
      const item = cartItems.find((i) => i.productId === productId);
      if (!item) return;
      const max = item.maxOrderQuantity ?? item.stock;
      if (item.quantity < max) {
        dispatch(updateQuantity({ productId, quantity: item.quantity + 1 }));
      }
    },
    [dispatch, cartItems],
  );

  /** Decrement quantity by 1 — removes item if it reaches minOrderQuantity */
  const decrementQty = useCallback(
    (productId: string) => {
      const item = cartItems.find((i) => i.productId === productId);
      if (!item) return;
      if (item.quantity <= item.minOrderQuantity) {
        dispatch(removeItem(productId));
      } else {
        dispatch(updateQuantity({ productId, quantity: item.quantity - 1 }));
      }
    },
    [dispatch, cartItems],
  );

  /** Empty the entire cart */
  const clearCart = useCallback(() => {
    dispatch(clearCartAction());
  }, [dispatch]);

  // ── Per-item helpers (factory selectors) ────────────────────────────────────

  /** Returns true if productId is currently in the cart */
  const isInCart = useCallback(
    (productId: string): boolean =>
      cartItems.some((i) => i.productId === productId),
    [cartItems],
  );

  /** Returns the current quantity of productId in the cart (0 if absent) */
  const getQuantity = useCallback(
    (productId: string): number =>
      cartItems.find((i) => i.productId === productId)?.quantity ?? 0,
    [cartItems],
  );

  /** Get the full CartItem for a given productId */
  const getCartItem = useCallback(
    (productId: string): CartItem | undefined =>
      cartItems.find((i) => i.productId === productId),
    [cartItems],
  );

  // ── Derived values ────────────────────────────────────────────────────────────

  const isEmpty = cartItems.length === 0;

  /** Subtotal formatted as a rupee string e.g. "₹1,200.00" */
  const formattedTotal = `₹${totalAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return {
    // State
    cartItems,
    totalAmount,
    totalItems,
    cartByFarmer,
    isMultiFarmerCart,
    isEmpty,
    formattedTotal,
    // Actions
    addToCart,
    removeFromCart,
    updateQty,
    incrementQty,
    decrementQty,
    clearCart,
    // Per-item
    isInCart,
    getQuantity,
    getCartItem,
  };
};
