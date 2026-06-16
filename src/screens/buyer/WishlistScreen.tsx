// FILE: src/screens/buyer/WishlistScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';
import { buyerApi } from '../../api/buyer';
import { productImageUrl } from '../../utils/productImage';
import { useAppDispatch } from '../../store';
import { addItem } from '../../store/cartSlice';
import type { Wishlist } from '../../types/buyer';
import type { Product } from '../../types/product';

// ─── WishlistCard ─────────────────────────────────────────────────────────────

interface CardProps {
  item: Wishlist;
  onRemove: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onPress: (productId: string) => void;
}

const WishlistCard: React.FC<CardProps> = ({ item, onRemove, onAddToCart, onPress }) => {
  const heartScale = useRef(new Animated.Value(1)).current;
  const product = item.product;

  const handleRemove = useCallback(() => {
    Animated.spring(heartScale, {
      toValue: 0,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start(() => {
      onRemove(product.id);
    });
  }, [heartScale, product.id, onRemove]);

  const primaryImage = productImageUrl(product);

  return (
    <TouchableOpacity
      style={[styles.card, shadow.sm]}
      onPress={() => onPress(product.id)}
      activeOpacity={0.9}
    >
      {/* Image area */}
      <View style={styles.imageContainer}>
        {primaryImage ? (
          <Animated.Image source={{ uri: primaryImage }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="image-outline" size={32} color={Colors.border} />
          </View>
        )}

        {/* Heart button */}
        <TouchableOpacity style={styles.heartBtn} onPress={handleRemove}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Icon name="heart" size={20} color={Colors.error} />
          </Animated.View>
        </TouchableOpacity>

        {product.isOrganic && (
          <View style={styles.organicBadge}>
            <Text style={styles.organicText}>Organic</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.farmerName} numberOfLines={1}>
          {product.farmerName ?? 'Local Farm'}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.unit}>/{product.unit}</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onAddToCart(product)}
          activeOpacity={0.8}
        >
          <Icon name="cart-outline" size={14} color={Colors.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const WishlistScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useAppDispatch();
  const [wishlist, setWishlist] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await buyerApi.getWishlist({ page: 1, limit: 50 });
      setWishlist(res.data?.items ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load wishlist' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = useCallback(async (productId: string) => {
    try {
      await buyerApi.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((w) => w.product.id !== productId));
      Toast.show({ type: 'success', text1: 'Removed from wishlist' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to remove item' });
    }
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      dispatch(addItem({ product, quantity: product.minOrderQuantity ?? 1 }));
      Toast.show({ type: 'success', text1: `${product.name} added to cart!` });
    },
    [dispatch],
  );

  const handleAddAll = useCallback(() => {
    wishlist.forEach((w) => {
      dispatch(addItem({ product: w.product, quantity: w.product.minOrderQuantity ?? 1 }));
    });
    Toast.show({ type: 'success', text1: 'All items added to cart!', text2: `${wishlist.length} items` });
  }, [wishlist, dispatch]);

  const renderItem = useCallback(
    ({ item }: { item: Wishlist }) => (
      <WishlistCard
        item={item}
        onRemove={handleRemove}
        onAddToCart={handleAddToCart}
        onPress={(pid) => navigation.navigate('ProductDetail', { productId: pid })}
      />
    ),
    [handleRemove, handleAddToCart, navigation],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist ({wishlist.length})</Text>
        <View style={{ width: 32 }} />
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="heart-outline" size={80} color={Colors.border} />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyText}>Save products you love for later</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreBtnText}>Start Exploring</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlashList
            data={wishlist}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            estimatedItemSize={280}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchWishlist(true)}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />

          {/* Add all FAB */}
          <TouchableOpacity style={[styles.fab, shadow.lg]} onPress={handleAddAll} activeOpacity={0.85}>
            <Icon name="cart" size={20} color={Colors.white} />
            <Text style={styles.fabText}>Add All to Cart</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  listContent: { padding: 8, paddingBottom: 100 },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    margin: 6,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    backgroundColor: Colors.surfaceSecondary,
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  organicBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  organicText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  cardInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, lineHeight: 18 },
  farmerName: { fontSize: 11, color: Colors.textHint, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  price: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  unit: { fontSize: 11, color: Colors.textHint, marginLeft: 2 },
  addBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
  },
  fabText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: Colors.textHint },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  exploreBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  exploreBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});

export default WishlistScreen;
