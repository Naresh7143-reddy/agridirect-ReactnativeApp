// FILE: src/screens/buyer/BuyerHomeScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  addItem,
  updateQuantity,
  selectCartItemCount,
  selectItemQuantity,
} from '../../store/cartSlice';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import { productImageUrl } from '../../utils/productImage';
import type { Product } from '../../types/product';
import type { Category } from '../../types/category';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BANNERS = [
  { id: '1', title: 'Fresh from the Farm', subtitle: 'Order by 10 AM, delivered today', color1: Colors.primary, color2: Colors.primaryLight },
  { id: '2', title: 'Organic Goodness', subtitle: 'Certified organic produce', color1: '#2E7D32', color2: '#43A047' },
  { id: '3', title: 'Support Local Farmers', subtitle: 'Buy direct, save more', color1: '#1B5E20', color2: '#388E3C' },
];

// ── HomeProductCard sub-component (not in map) ───────────────────────────────
interface HomeProductCardProps {
  product: Product;
  onPress: () => void;
}

const HomeProductCard: React.FC<HomeProductCardProps> = ({ product, onPress }) => {
  const dispatch = useAppDispatch();
  const qty = useAppSelector(selectItemQuantity(product.id));

  const handleAdd = useCallback(() => {
    dispatch(addItem({ product, quantity: 1 }));
  }, [dispatch, product]);

  const handleInc = useCallback(() => {
    dispatch(updateQuantity({ productId: product.id, quantity: qty + 1 }));
  }, [dispatch, product.id, qty]);

  const handleDec = useCallback(() => {
    dispatch(updateQuantity({ productId: product.id, quantity: qty - 1 }));
  }, [dispatch, product.id, qty]);

  const imageUri = productImageUrl(product);

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.productImageWrap}>
        <FastImage
          source={{ uri: imageUri, priority: FastImage.priority.normal }}
          style={styles.productImage}
          resizeMode={FastImage.resizeMode.cover}
        />
        {product.stock < 10 && product.stock > 0 && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>Only {product.stock} left</Text>
          </View>
        )}
        {product.stock === 0 && (
          <View style={[styles.stockBadge, { backgroundColor: Colors.error }]}>
            <Text style={styles.stockBadgeText}>Out of stock</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productFarmer} numberOfLines={1}>{product.farmerName}</Text>
        <View style={styles.productRow}>
          <Text style={styles.productPrice}>₹{product.price}/{product.unit}</Text>
          {(product.rating ?? 0) > 0 && (
            <Text style={styles.productRating}>⭐ {(product.rating ?? 0).toFixed(1)}</Text>
          )}
        </View>
        {qty === 0 ? (
          <TouchableOpacity
            style={[styles.addBtn, product.stock === 0 && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={product.stock === 0}
          >
            <Text style={styles.addBtnText}>{product.stock === 0 ? 'Unavailable' : '+ Add'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stepper}>
            <TouchableOpacity onPress={handleDec} style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperQty}>{qty}</Text>
            <TouchableOpacity onPress={handleInc} style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── CategoryPill sub-component ───────────────────────────────────────────────
interface CategoryPillProps {
  category: Category & { icon?: string };
  isSelected: boolean;
  onPress: () => void;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ category, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.categoryEmoji}>{(category as any).icon || '🌿'}</Text>
    <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
      {category.name}
    </Text>
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export const BuyerHomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const cartCount = useAppSelector(selectCartItemCount);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  const bannerRef = useRef<FlatList<typeof BANNERS[0]>>(null);
  const cartBounce = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount !== prevCount.current) {
      Animated.sequence([
        Animated.spring(cartBounce, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
        Animated.spring(cartBounce, { toValue: 1, useNativeDriver: true, speed: 50 }),
      ]).start();
      prevCount.current = cartCount;
    }
  }, [cartCount, cartBounce]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % BANNERS.length;
        try { bannerRef.current?.scrollToIndex({ index: next, animated: true }); } catch {}
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        categoriesApi.getAll(),
        productsApi.getAll({ categoryId: selectedCategory || undefined, limit: 20 } as any),
      ]);
      setCategories((catRes as any).data || []);
      setProducts((prodRes as any).data || []);
    } catch {
      // silent
    } finally {
      setLoadingProducts(false);
      setLoadingCategories(false);
    }
  }, [selectedCategory]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const allCategory = { id: '', name: 'All', icon: '🌾' } as any;

  const renderBanner = ({ item }: { item: typeof BANNERS[0] }) => (
    <LinearGradient
      colors={[item.color1, item.color2, Colors.accent]}
      style={styles.banner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.bannerTitle}>{item.title}</Text>
      <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
      <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('BuyerTabs', { screen: 'SearchTab' } as any)}>
        <Text style={styles.bannerBtnText}>Shop Now →</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <HomeProductCard
      product={item}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    />
  );

  const renderCategory = ({ item }: { item: Category & { icon?: string } }) => (
    <CategoryPill
      category={item}
      isSelected={selectedCategory === (item.id || null)}
      onPress={() => setSelectedCategory(item.id || null)}
    />
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <LinearGradient colors={Colors.gradientGreen} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => navigation.navigate('SavedAddresses')}
          >
            <Text style={styles.locationText}>📍 Chennai, TN</Text>
            <Text style={styles.locationChevron}>▾</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartBtn}>
            <Animated.View style={{ transform: [{ scale: cartBounce }] }}>
              <Text style={styles.cartIcon}>🛒</Text>
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : String(cartCount)}</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('BuyerTabs', { screen: 'SearchTab' } as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search vegetables, fruits...</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Hero Banner */}
      <FlatList
        ref={bannerRef}
        data={BANNERS}
        renderItem={renderBanner}
        keyExtractor={(b) => b.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setBannerIndex(idx);
        }}
        scrollEventThrottle={16}
      />
      <View style={styles.dotsRow}>
        {BANNERS.map((_, i) => (
          <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {loadingCategories ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shimmerRow}>
            {[1, 2, 3, 4, 5].map((k) => (
              <View key={k} style={styles.shimmerPill} />
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={[allCategory, ...categories]}
            renderItem={renderCategory}
            keyExtractor={(c: any) => c.id || 'all'}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          />
        )}
      </View>

      {/* Fresh Today */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌿 Fresh Today</Text>
        {loadingProducts ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🥬</Text>
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        ) : (
          <FlashList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(p) => p.id}
            numColumns={2}
            estimatedItemSize={240}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default BuyerHomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  locationPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 6 },
  locationText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  locationChevron: { color: Colors.white, marginLeft: 4, fontSize: 12 },
  cartBtn: { position: 'relative', padding: 8 },
  cartIcon: { fontSize: 24 },
  cartBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: Colors.secondary, borderRadius: borderRadius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: borderRadius.lg, paddingHorizontal: 14, paddingVertical: 10, ...shadow.sm },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchPlaceholder: { color: Colors.textHint, fontSize: 14, flex: 1 },
  banner: { width: SCREEN_WIDTH, height: 160, justifyContent: 'center', paddingHorizontal: 24 },
  bannerTitle: { color: Colors.white, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 12 },
  bannerBtn: { backgroundColor: Colors.white, borderRadius: borderRadius.full, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  bannerBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border, marginHorizontal: 3 },
  dotActive: { width: 18, backgroundColor: Colors.primary },
  section: { marginTop: 20, paddingHorizontal: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  shimmerRow: { flexDirection: 'row', gap: 10 },
  shimmerPill: { width: 80, height: 36, borderRadius: borderRadius.full, backgroundColor: Colors.divider, marginRight: 8 },
  categoryRow: { paddingRight: 16 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: borderRadius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, marginRight: 8, ...shadow.sm },
  categoryPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryEmoji: { fontSize: 16, marginRight: 6 },
  categoryPillText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  categoryPillTextActive: { color: Colors.white },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textHint, fontSize: 16, marginTop: 12 },
  productCard: { flex: 1, margin: 6, backgroundColor: Colors.white, borderRadius: borderRadius.lg, overflow: 'hidden', ...shadow.sm },
  productImageWrap: { position: 'relative' },
  productImage: { width: '100%', height: 120 },
  stockBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: Colors.warning, borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  stockBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '700' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  productFarmer: { fontSize: 11, color: Colors.textHint, marginBottom: 6 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  productRating: { fontSize: 11, color: Colors.textSecondary },
  addBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.sm, paddingVertical: 7, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: Colors.border },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.successLight, borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  stepperBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: borderRadius.xs },
  stepperBtnText: { color: Colors.white, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  stepperQty: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
