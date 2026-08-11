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
  { id: '1', title: 'Farm Fresh Harvest', subtitle: 'Directly from local growers to your doorstep', color1: Colors.primaryDark, color2: Colors.primaryLight, tag: '🌾 100% Direct' },
  { id: '2', title: 'Certified Organic', subtitle: 'Pesticide-free & nutrient-packed veggies', color1: '#154A18', color2: '#2E7D32', tag: '✨ Certified' },
  { id: '3', title: 'Express Delivery', subtitle: 'Ordered by 10 AM, delivered by evening', color1: '#E65100', color2: '#F57F17', tag: '⚡ Same Day' },
];

// ── HomeProductCard sub-component ───────────────────────────────────────────────
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
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.productImageWrap}>
        <FastImage
          source={{ uri: imageUri, priority: FastImage.priority.normal }}
          style={styles.productImage}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={styles.organicTag}>
          <Text style={styles.organicTagText}>🌿 Fresh</Text>
        </View>
        {product.stock < 10 && product.stock > 0 && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>{product.stock} left</Text>
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
        <Text style={styles.productFarmer} numberOfLines={1}>👨‍🌾 {product.farmerName || 'Local Farm'}</Text>
        <View style={styles.productRow}>
          <View style={styles.priceWrap}>
            <Text style={styles.productPrice}>₹{product.price}</Text>
            <Text style={styles.productUnit}>/{product.unit}</Text>
          </View>
          {(product.rating ?? 0) > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.productRating}>⭐ {(product.rating ?? 0).toFixed(1)}</Text>
            </View>
          )}
        </View>
        {qty === 0 ? (
          <TouchableOpacity
            style={[styles.addBtn, product.stock === 0 && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={product.stock === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>{product.stock === 0 ? 'Out of Stock' : '+ ADD TO CART'}</Text>
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
    activeOpacity={0.85}
  >
    <Text style={styles.categoryEmoji}>{(category as any).icon || '🌾'}</Text>
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
        Animated.spring(cartBounce, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
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

  const allCategory = { id: '', name: 'All Produce', icon: '🌾' } as any;

  const renderBanner = ({ item }: { item: typeof BANNERS[0] }) => (
    <LinearGradient
      colors={[item.color1, item.color2]}
      style={styles.banner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.bannerBadge}>
        <Text style={styles.bannerBadgeText}>{item.tag}</Text>
      </View>
      <Text style={styles.bannerTitle}>{item.title}</Text>
      <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
      <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('BuyerTabs', { screen: 'SearchTab' } as any)}>
        <Text style={styles.bannerBtnText}>Explore Fresh Produce →</Text>
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
      <LinearGradient colors={Colors.gradientHero} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => navigation.navigate('SavedAddresses')}
            activeOpacity={0.8}
          >
            <Text style={styles.locationText}>📍 Delivery: Chennai Central</Text>
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
          activeOpacity={0.88}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search organic tomatoes, spinach, apples...</Text>
        </TouchableOpacity>

        {/* Trust Highlights */}
        <View style={styles.trustBar}>
          <View style={styles.trustItem}>
            <Text style={styles.trustEmoji}>🌱</Text>
            <Text style={styles.trustText}>100% Farm Fresh</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Text style={styles.trustEmoji}>🏷️</Text>
            <Text style={styles.trustText}>Direct Prices</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Text style={styles.trustEmoji}>⚡</Text>
            <Text style={styles.trustText}>Express Delivery</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Hero Banner */}
      <View style={styles.bannerContainer}>
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
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🌿 Fresh Harvest</Text>
          <Text style={styles.sectionSubtitle}>Directly from local farms</Text>
        </View>
        {loadingProducts ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} size="large" />
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🥬</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Check back soon for fresh stock from local farms</Text>
          </View>
        ) : (
          <FlashList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(p) => p.id}
            numColumns={2}
            estimatedItemSize={270}
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
  header: { paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  locationPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: borderRadius.full, paddingHorizontal: 14, paddingVertical: 7 },
  locationText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  locationChevron: { color: Colors.white, marginLeft: 4, fontSize: 12 },
  cartBtn: { position: 'relative', padding: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: borderRadius.full, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  cartIcon: { fontSize: 20 },
  cartBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: Colors.secondary, borderRadius: borderRadius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: Colors.white },
  cartBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: borderRadius.lg, paddingHorizontal: 14, paddingVertical: 12, ...shadow.sm, marginBottom: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchPlaceholder: { color: Colors.textHint, fontSize: 13, flex: 1, fontWeight: '500' },
  trustBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: borderRadius.md, paddingVertical: 8, paddingHorizontal: 6 },
  trustItem: { flexDirection: 'row', alignItems: 'center' },
  trustEmoji: { fontSize: 12, marginRight: 4 },
  trustText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  trustDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' },
  bannerContainer: { marginTop: 14 },
  banner: { width: SCREEN_WIDTH - 32, marginHorizontal: 16, height: 165, borderRadius: borderRadius.xl, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16, overflow: 'hidden', ...shadow.md },
  bannerBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 6 },
  bannerBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  bannerTitle: { color: Colors.white, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginBottom: 12, fontWeight: '500' },
  bannerBtn: { backgroundColor: Colors.white, borderRadius: borderRadius.full, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start', ...shadow.sm },
  bannerBtnText: { color: Colors.primaryDark, fontWeight: '800', fontSize: 12 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border, marginHorizontal: 3 },
  dotActive: { width: 18, backgroundColor: Colors.primary, borderRadius: 4 },
  section: { marginTop: 20, paddingHorizontal: 16, paddingBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  seeAllText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  shimmerRow: { flexDirection: 'row', gap: 10 },
  shimmerPill: { width: 80, height: 36, borderRadius: borderRadius.full, backgroundColor: Colors.divider, marginRight: 8 },
  categoryRow: { paddingRight: 16 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: borderRadius.full, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: Colors.border, marginRight: 8, ...shadow.sm },
  categoryPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryEmoji: { fontSize: 15, marginRight: 6 },
  categoryPillText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  categoryPillTextActive: { color: Colors.white, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: Colors.white, borderRadius: borderRadius.xl, marginHorizontal: 4, paddingHorizontal: 16, ...shadow.sm },
  emptyEmoji: { fontSize: 44, marginBottom: 8 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  emptyText: { color: Colors.textHint, fontSize: 13, marginTop: 4, textAlign: 'center' },
  productCard: { flex: 1, margin: 6, backgroundColor: Colors.white, borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight, ...shadow.sm },
  productImageWrap: { position: 'relative' },
  productImage: { width: '100%', height: 130 },
  organicTag: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(27, 94, 32, 0.88)', borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  organicTagText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  stockBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: Colors.warning, borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  stockBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  productInfo: { padding: 12 },
  productName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2, lineHeight: 17 },
  productFarmer: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priceWrap: { flexDirection: 'row', alignItems: 'baseline' },
  productPrice: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  productUnit: { fontSize: 11, color: Colors.textSecondary, marginLeft: 2 },
  ratingBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 5, paddingVertical: 2, borderRadius: borderRadius.xs },
  productRating: { fontSize: 11, color: Colors.secondaryDark, fontWeight: '700' },
  addBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.md, paddingVertical: 8, alignItems: 'center', ...shadow.sm },
  addBtnDisabled: { backgroundColor: Colors.border },
  addBtnText: { color: Colors.white, fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primaryMuted, borderRadius: borderRadius.md, paddingHorizontal: 6, paddingVertical: 4 },
  stepperBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: borderRadius.xs },
  stepperBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800', lineHeight: 20 },
  stepperQty: { fontSize: 14, fontWeight: '800', color: Colors.primary },
});

