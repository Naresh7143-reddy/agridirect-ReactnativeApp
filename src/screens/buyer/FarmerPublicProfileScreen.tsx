// FILE: src/screens/buyer/FarmerPublicProfileScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';
import { farmerApi } from '../../api/farmer';
import { productsApi } from '../../api/products';
import { productImageUrl } from '../../utils/productImage';
import { useAppDispatch } from '../../store';
import { addItem } from '../../store/cartSlice';
import type { FarmerProfile } from '../../types/farmer';
import type { Product } from '../../types/product';

// ─── Route params ─────────────────────────────────────────────────────────────

type BuyerStackParamList = {
  FarmerPublicProfile: { farmerId: string; farmerName?: string };
  ProductDetail: { productId: string };
};

type RouteProps = RouteProp<BuyerStackParamList, 'FarmerPublicProfile'>;

// ─── ProductMiniCard ──────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  onAdd: (p: Product) => void;
  onPress: (id: string) => void;
}

const ProductMiniCard: React.FC<ProductCardProps> = ({ product, onAdd, onPress }) => {
  const primaryImage = productImageUrl(product);

  return (
    <TouchableOpacity
      style={[styles.productCard, shadow.sm]}
      onPress={() => onPress(product.id)}
      activeOpacity={0.9}
    >
      <View style={styles.productImageBox}>
        {primaryImage ? (
          <Animated.Image source={{ uri: primaryImage }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="leaf-outline" size={28} color={Colors.border} />
          </View>
        )}
        {product.isOrganic && (
          <View style={styles.organicBadge}>
            <Text style={styles.organicText}>Org</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productPrice}>₹{product.price}<Text style={styles.productUnit}>/{product.unit}</Text></Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onAdd(product)}
          activeOpacity={0.8}
        >
          <Icon name="cart-outline" size={13} color={Colors.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const FarmerPublicProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const route = useRoute<RouteProps>();
  const { farmerId, farmerName } = route.params;
  const dispatch = useAppDispatch();

  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const followScale = useRef(new Animated.Value(1)).current;
  const followBg = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [profileRes, productsRes] = await Promise.all([
        farmerApi.getPublicProfile(farmerId),
        productsApi.getAll({ farmerId }),
      ]);
      setFarmer(profileRes.data);
      const prods: Product[] = (productsRes as any).data?.items ?? (productsRes as any).data ?? [];
      setProducts(prods);
      setFilteredProducts(prods);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load farmer profile' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [farmerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFollow = useCallback(() => {
    Animated.parallel([
      Animated.spring(followScale, { toValue: 1.15, useNativeDriver: true }),
      Animated.timing(followBg, { toValue: following ? 0 : 1, duration: 250, useNativeDriver: false }),
    ]).start(() => {
      Animated.spring(followScale, { toValue: 1, useNativeDriver: true }).start();
    });
    setFollowing((prev) => !prev);
  }, [following, followScale, followBg]);

  const followBgColor = followBg.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surface, Colors.primary],
  });

  const followTextColor = followBg.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.primary, Colors.white],
  });

  // Category filter
  const categories = React.useMemo(() => {
    const cats = products
      .map((p) => p.category?.name)
      .filter((c): c is string => !!c);
    return ['All', ...Array.from(new Set(cats))];
  }, [products]);

  const handleCategorySelect = useCallback(
    (cat: string) => {
      setSelectedCategory(cat);
      if (cat === 'All') {
        setFilteredProducts(products);
      } else {
        setFilteredProducts(products.filter((p) => p.category?.name === cat));
      }
    },
    [products],
  );

  const handleAddToCart = useCallback(
    (product: Product) => {
      dispatch(addItem({ product, quantity: product.minOrderQuantity ?? 1 }));
      Toast.show({ type: 'success', text1: `${product.name} added!` });
    },
    [dispatch],
  );

  const handleProductPress = useCallback(
    (productId: string) => navigation.navigate('ProductDetail', { productId }),
    [navigation],
  );

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <ProductMiniCard product={item} onAdd={handleAddToCart} onPress={handleProductPress} />
    ),
    [handleAddToCart, handleProductPress],
  );

  const memberYear = farmer ? new Date(farmer.createdAt).getFullYear() : '—';
  const initials = (farmer?.farmName ?? farmerName ?? 'F')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Hero cover */}
        <LinearGradient colors={Colors.gradientGreen} style={styles.heroCover}>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroFarmName} numberOfLines={1}>
              {farmer?.farmName ?? farmerName ?? 'Loading...'}
            </Text>
            {farmer && (
              <Text style={styles.heroLocation}>
                <Icon name="location-outline" size={13} color="rgba(255,255,255,0.85)" />{' '}
                {farmer.location.city}, {farmer.location.state}
              </Text>
            )}
          </View>
        </LinearGradient>

        <View style={styles.profileSection}>
          {/* Avatar overlapping cover */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              {farmer?.photoUrl ? (
                <Animated.Image source={{ uri: farmer.photoUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
          </View>

          {/* Name row */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameLine}>
                <Text style={styles.farmName}>{farmer?.farmName ?? farmerName ?? '—'}</Text>
                {farmer?.isVerified && (
                  <Icon name="shield-checkmark" size={18} color={Colors.info} style={{ marginLeft: 6 }} />
                )}
              </View>
              {farmer && (
                <Text style={styles.locationText}>
                  {farmer.location.city}, {farmer.location.state}
                </Text>
              )}
            </View>

            {/* Follow button */}
            <Animated.View style={{ transform: [{ scale: followScale }] }}>
              <TouchableOpacity onPress={handleFollow} activeOpacity={0.85}>
                <Animated.View
                  style={[
                    styles.followBtn,
                    { backgroundColor: followBgColor as any },
                  ]}
                >
                  <Animated.Text style={[styles.followText, { color: followTextColor as any }]}>
                    {following ? 'Following' : 'Follow'}
                  </Animated.Text>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Rating */}
          {farmer && (
            <View style={styles.ratingRow}>
              <Icon name="star" size={14} color={Colors.secondary} />
              <Text style={styles.ratingText}>
                {farmer.rating.toFixed(1)} ({farmer.reviewCount} reviews)
              </Text>
            </View>
          )}

          {/* Stats */}
          {farmer && (
            <View style={[styles.statsCard, shadow.sm]}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{farmer.totalProducts}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{farmer.totalSales}</Text>
                <Text style={styles.statLabel}>Total Sales</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{memberYear}</Text>
                <Text style={styles.statLabel}>Member since</Text>
              </View>
            </View>
          )}

          {/* Bio */}
          {farmer?.bio && (
            <View style={[styles.bioCard, shadow.sm]}>
              <Text
                style={styles.bioText}
                numberOfLines={bioExpanded ? undefined : 3}
              >
                {farmer.bio}
              </Text>
              <TouchableOpacity onPress={() => setBioExpanded((p) => !p)}>
                <Text style={styles.readMore}>{bioExpanded ? 'Show less' : 'Read more'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Category chips */}
          {categories.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContent}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Products label */}
          <Text style={styles.productsLabel}>
            Products from this farm ({filteredProducts.length})
          </Text>
        </View>

        {/* Products grid via FlashList inside ScrollView — use a fixed wrapper */}
        {loading ? (
          <View style={styles.center}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.center}>
            <Icon name="leaf-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No products in this category</Text>
          </View>
        ) : (
          <View style={{ height: Math.ceil(filteredProducts.length / 2) * 220, paddingHorizontal: 8 }}>
            <FlashList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={renderProduct}
              numColumns={2}
              estimatedItemSize={210}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroCover: { height: 180, justifyContent: 'flex-end' },
  heroOverlay: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  heroFarmName: { fontSize: 24, fontWeight: '800', color: Colors.white },
  heroLocation: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  profileSection: { paddingHorizontal: 16 },
  avatarWrapper: {
    marginTop: -35,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...shadow.md,
    overflow: 'hidden',
  },
  avatarImage: { width: 70, height: 70 },
  avatarInitials: { fontSize: 24, fontWeight: '700', color: Colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  nameLine: { flexDirection: 'row', alignItems: 'center' },
  farmName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  locationText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  followBtn: {
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  followText: { fontSize: 14, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  ratingText: { fontSize: 13, color: Colors.textSecondary },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    paddingVertical: 16,
    marginBottom: 14,
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  bioCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 14,
  },
  bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  readMore: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginTop: 6 },
  chipsScroll: { marginBottom: 12 },
  chipsContent: { paddingRight: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  productsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  productCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    margin: 5,
    overflow: 'hidden',
  },
  productImageBox: {
    height: 110,
    backgroundColor: Colors.surfaceSecondary,
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  organicBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  organicText: { fontSize: 9, fontWeight: '700', color: Colors.white },
  productInfo: { padding: 8 },
  productName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, lineHeight: 16 },
  productPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  productUnit: { fontSize: 10, fontWeight: '400', color: Colors.textHint },
  addBtn: {
    marginTop: 7,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addBtnText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  center: { alignItems: 'center', padding: 40, gap: 8 },
  loadingText: { fontSize: 14, color: Colors.textHint },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});

export default FarmerPublicProfileScreen;
