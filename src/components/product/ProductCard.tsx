import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { Product } from '../../types/product';
import { Colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { formatPrice } from '../../utils/format';
import { productImageUrl } from '../../utils/productImage';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isInCart?: boolean;
  cartQuantity?: number;
  /** FastImage priority — 'high' for above-fold, 'low' for below-fold */
  imagePriority?: 'high' | 'normal' | 'low';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  isInCart = false,
  cartQuantity = 0,
  imagePriority = 'normal',
}) => {
  // Single source of truth for the Cloudinary URL across all 3 backend shapes.
  const imageUrl = productImageUrl(product);
  const primaryImage = imageUrl ? { url: imageUrl } : undefined;

  return (
    <TouchableOpacity
      onPress={() => onPress(product)}
      activeOpacity={0.9}
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        {primaryImage ? (
          <FastImage
            source={{ uri: primaryImage.url, priority: FastImage.priority[imagePriority] }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Icon name="image-outline" size={32} color={Colors.border} />
          </View>
        )}
        {!product.isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Out of Stock</Text>
          </View>
        )}
        {product.rating !== undefined && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {product.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.farmerName && (
          <Text style={styles.farmerName} numberOfLines={1}>
            by {product.farmerName}
          </Text>
        )}
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.unit}>per {product.unit}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onAddToCart(product)}
            disabled={!product.isAvailable}
            style={[styles.addBtn, isInCart && styles.addBtnActive]}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={[styles.addBtnText, isInCart && styles.addBtnTextActive]}>
              {isInCart ? `${cartQuantity}✓` : '+'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadow.md,
    margin: spacing.xs,
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.surfaceSecondary,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    color: Colors.white,
    ...typography.label.medium,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 11,
  },
  content: {
    padding: spacing.sm,
  },
  name: {
    ...typography.label.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  farmerName: {
    ...typography.caption,
    color: Colors.textHint,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  price: {
    ...typography.body.medium,
    fontWeight: '700',
    color: Colors.primary,
  },
  unit: {
    ...typography.caption,
    color: Colors.textHint,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnActive: {
    backgroundColor: Colors.secondary,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  addBtnTextActive: {
    fontSize: 11,
  },
});
