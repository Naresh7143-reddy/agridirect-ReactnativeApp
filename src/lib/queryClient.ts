/**
 * AgriDirect — TanStack Query client
 *
 * Stale times:
 *   Categories / public products  →  5 minutes  (rarely changes)
 *   Farmer / buyer orders         →  30 seconds (near-real-time)
 *   User profile                  →  2 minutes
 *   Notifications                 →  1 minute
 *
 * When the device has no network the cache is returned as-is (stale-while-
 * offline). Mutations trigger refetch of affected query keys on success.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,       // 2 minutes default
      gcTime: 10 * 60 * 1000,          // keep in GC cache for 10 min
      retry: 2,                         // retry twice on network errors
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,      // mobile apps don't have "window focus"
      refetchOnReconnect: true,         // re-fetch stale data when network comes back
    },
    mutations: {
      retry: 1,
    },
  },
});

// ─── Query key factory ────────────────────────────────────────────────────────

export const queryKeys = {
  categories:    ['categories']                       as const,
  products:      (filters?: object) => ['products', filters ?? {}] as const,
  product:       (id: string)       => ['product', id]             as const,
  farmerOrders:  (params?: object)  => ['farmer-orders', params ?? {}] as const,
  buyerOrders:   (params?: object)  => ['buyer-orders', params ?? {}]  as const,
  order:         (id: string)       => ['order', id]               as const,
  farmerProfile: ['farmer-profile']                  as const,
  buyerProfile:  ['buyer-profile']                   as const,
  addresses:     ['addresses']                       as const,
  wishlist:      ['wishlist']                        as const,
  earnings:      (period?: string)  => ['earnings', period ?? 'month'] as const,
  notifications: ['notifications']                   as const,
} as const;

// ─── Stale time overrides (use in individual useQuery calls) ──────────────────

export const STALE = {
  REALTIME:   30 * 1000,       // 30 s — orders, notifications
  SHORT:      2 * 60 * 1000,   // 2 min — profiles
  MEDIUM:     5 * 60 * 1000,   // 5 min — products, wishlist
  LONG:       24 * 60 * 60 * 1000, // 24 h — categories, static content
} as const;
