/**
 * productImageUrl — single source of truth for resolving a product's primary
 * image URL, handling all three response shapes the backend has produced:
 *   - imageUrls: string[]          (current Spring shape)
 *   - images: { url, isPrimary }[] (frontend type)
 *   - primaryImageUrl: string      (convenience field)
 *
 * Use this everywhere instead of inlining the fallback chain so we never have
 * "image works in cart but not in browse" mismatches again.
 */
export function productImageUrl(product: any): string {
  const raw = resolveRaw(product);
  return optimizeCloudinary(raw);
}

function resolveRaw(product: any): string {
  if (!product) return '';
  const direct = product.primaryImageUrl;
  if (direct) return direct;

  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find((i: any) => i?.isPrimary);
    if (primary?.url) return primary.url;
    if (product.images[0]?.url) return product.images[0].url;
  }

  if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
    return product.imageUrls[0];
  }

  return '';
}

/**
 * Inserts Cloudinary on-the-fly transforms (auto format, auto quality, width
 * cap) into the delivery URL. Cuts payload ~70% for list thumbnails. Safe
 * no-op for non-Cloudinary URLs.
 *
 * @param url  full Cloudinary secure_url
 * @param width  target width in px (default 600 — good for cards & detail)
 */
export function optimizeCloudinary(url: string, width = 600): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  // Avoid double-transforming if a transform is already present.
  if (/\/upload\/[^/]*[wqf]_/.test(url)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
}
