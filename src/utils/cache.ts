/**
 * AgriDirect — MMKV-backed HTTP cache
 *
 * TTLs:
 *   categories   24 hours
 *   products      5 minutes
 *   user profile  1 hour
 *
 * Invalidated automatically on any POST / PUT / DELETE.
 */

import { storage } from './storage';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_PREFIX = 'http_cache:';

const TTL = {
  CATEGORIES: 24 * 60 * 60 * 1000,
  PRODUCTS:    5 * 60 * 1000,
  PROFILE:     60 * 60 * 1000,
} as const;

export const CacheKeys = {
  CATEGORIES:   'categories',
  PRODUCTS:     (params?: string) => `products:${params ?? ''}`,
  USER_PROFILE: (role: string)    => `profile:${role}`,
} as const;

// ─── Core helpers ─────────────────────────────────────────────────────────────

function cacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
  storage.set(cacheKey(key), JSON.stringify(entry));
}

export function cacheGet<T>(key: string): T | null {
  const raw = storage.getString(cacheKey(key));
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      storage.delete(cacheKey(key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheDelete(key: string): void {
  storage.delete(cacheKey(key));
}

/** Remove all HTTP cache entries (e.g. after mutations). */
export function cacheInvalidateAll(): void {
  const allKeys = storage.getAllKeys();
  allKeys
    .filter((k) => k.startsWith(CACHE_PREFIX))
    .forEach((k) => storage.delete(k));
}

/** Invalidate a specific pattern (prefix match). */
export function cacheInvalidatePattern(pattern: string): void {
  const allKeys = storage.getAllKeys();
  allKeys
    .filter((k) => k.startsWith(`${CACHE_PREFIX}${pattern}`))
    .forEach((k) => storage.delete(k));
}

// ─── Typed shortcuts ──────────────────────────────────────────────────────────

export function setCategoriesCache<T>(data: T): void {
  cacheSet(CacheKeys.CATEGORIES, data, TTL.CATEGORIES);
}

export function getCategoriesCache<T>(): T | null {
  return cacheGet<T>(CacheKeys.CATEGORIES);
}

export function setProductsCache<T>(data: T, params?: string): void {
  cacheSet(CacheKeys.PRODUCTS(params), data, TTL.PRODUCTS);
}

export function getProductsCache<T>(params?: string): T | null {
  return cacheGet<T>(CacheKeys.PRODUCTS(params));
}

export function setProfileCache<T>(role: string, data: T): void {
  cacheSet(CacheKeys.USER_PROFILE(role), data, TTL.PROFILE);
}

export function getProfileCache<T>(role: string): T | null {
  return cacheGet<T>(CacheKeys.USER_PROFILE(role));
}

export { TTL as CACHE_TTL };
