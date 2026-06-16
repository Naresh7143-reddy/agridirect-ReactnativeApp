import React, { useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Product } from '../../types/product';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { Colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useCart } from '../../hooks/useCart';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onProductPress: (product: Product) => void;
  numColumns?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  ListHeaderComponent?: React.ReactElement;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onLoadMore,
  onProductPress,
  numColumns = 2,
  emptyTitle = 'No products found',
  emptySubtitle = 'Try adjusting your filters or check back later.',
  ListHeaderComponent,
}) => {
  const { addToCart, isInCart, getQuantity } = useCart();

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Product>) => (
      <ProductCard
        product={item}
        onPress={onProductPress}
        onAddToCart={addToCart}
        isInCart={isInCart(item.id)}
        cartQuantity={getQuantity(item.id)}
        imagePriority={index < 4 ? 'high' : 'low'}
      />
    ),
    [onProductPress, addToCart, isInCart, getQuantity],
  );

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.skeletonItem}>
            <ProductCardSkeleton />
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlashList
      data={products}
      renderItem={renderItem}
      numColumns={numColumns}
      estimatedItemSize={240}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={<EmptyState title={emptyTitle} subtitle={emptySubtitle} />}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing['3xl'],
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.xs,
  },
  skeletonItem: {
    width: '50%',
    padding: spacing.xs,
  },
});
