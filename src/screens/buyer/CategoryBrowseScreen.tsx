/**
 * CategoryBrowseScreen
 *
 * Browsable product grid filtered by category.
 * - Parallax-style gradient header with category name + product count
 * - Sticky filter/sort bar on scroll
 * - FlashList 2-col infinite scroll (load more on endReached)
 * - Same HomeProductCard add-to-cart interaction
 * - Filter modal: price range, sort order
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { useAppDispatch, useAppSelector } from '../../store';
import { addItem, updateQuantity, selectItemQuantity } from '../../store/cartSlice';
import { productsApi } from '../../api/products';
import { productImageUrl } from '../../utils/productImage';
import type { Product } from '../../types/product';
import type { BuyerStackParamList } from '../../types/navigation';

type CBRoute = RouteProp<{ CategoryBrowse: { categoryId: string; categoryName?: string } }, 'CategoryBrowse'>;

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { key: 'createdAt_desc', label: 'Newest First' },
  { key: 'price_asc',      label: 'Price: Low → High' },
  { key: 'price_desc',     label: 'Price: High → Low' },
  { key: 'rating_desc',    label: 'Top Rated' },
] as const;

// ─── Product card (mini) ──────────────────────────────────────────────────────

const ProductCard: React.FC<{ product: Product; onPress: () => void }> = ({ product, onPress }) => {
  const dispatch = useAppDispatch();
  const qty = useAppSelector(selectItemQuantity(product.id));
  const scale = useRef(new Animated.Value(1)).current;

  const bump = () =>
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.12, useNativeDriver: true, friction: 4 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();

  const img = productImageUrl(product);

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={cardStyles.imgWrap}>
        {img ? (
          <FastImage source={{ uri: img, priority: FastImage.priority.normal }} style={cardStyles.img} resizeMode={FastImage.resizeMode.cover} />
        ) : (
          <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={cardStyles.img}>
            <Icon name="leaf" size={28} color={Colors.primary} />
          </LinearGradient>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <View style={cardStyles.stockBadge}><Text style={cardStyles.stockText}>Only {product.stock} left</Text></View>
        )}
      </View>
      <View style={cardStyles.info}>
        <Text style={cardStyles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={cardStyles.farmer} numberOfLines={1}>{product.farmerName ?? ''}</Text>
        <View style={cardStyles.footer}>
          <View>
            <Text style={cardStyles.price}>₹{product.price}</Text>
            <Text style={cardStyles.unit}>/{product.unit}</Text>
          </View>
          <Animated.View style={{ transform: [{ scale }] }}>
            {qty === 0 ? (
              <TouchableOpacity style={cardStyles.addBtn} onPress={() => { bump(); dispatch(addItem({ product, quantity: 1 })); }}>
                <Icon name="add" size={16} color={Colors.white} />
              </TouchableOpacity>
            ) : (
              <View style={cardStyles.stepper}>
                <TouchableOpacity onPress={() => { bump(); dispatch(updateQuantity({ productId: product.id, quantity: qty - 1 })); }} style={cardStyles.stepBtn}>
                  <Icon name="remove" size={12} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={cardStyles.stepQty}>{qty}</Text>
                <TouchableOpacity onPress={() => { bump(); dispatch(updateQuantity({ productId: product.id, quantity: qty + 1 })); }} style={cardStyles.stepBtn}>
                  <Icon name="add" size={12} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden', flex: 1, margin: 6, ...shadow.sm },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center' },
  stockBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: Colors.error, borderRadius: borderRadius.full, paddingHorizontal: 6, paddingVertical: 2 },
  stockText: { fontSize: 9, fontWeight: '700', color: Colors.white },
  info: { padding: 10 },
  name: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  farmer: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  price: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  unit: { fontSize: 10, color: Colors.textSecondary },
  addBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: Colors.primary, overflow: 'hidden' },
  stepBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  stepQty: { fontSize: 12, fontWeight: '800', color: Colors.primary, paddingHorizontal: 4 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const CategoryBrowseScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const route = useRoute<CBRoute>();
  const { categoryId, categoryName = 'Products' } = route.params;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [sortKey, setSortKey] = useState('createdAt_desc');
  const [filterModal, setFilterModal] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const loadingMore = useRef(false);

  const loadProducts = useCallback(async (pageNum = 1, refresh = false) => {
    if (loadingMore.current && !refresh) return;
    loadingMore.current = true;
    try {
      const [sortBy, sortOrder] = sortKey.split('_') as [string, string];
      const res = await productsApi.getAll({
        categoryId,
        page: pageNum,
        limit: PAGE_SIZE,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        ...(minPrice ? { minPrice: Number(minPrice) } : {}),
        ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      });
      const newProducts = res.data?.items ?? [];
      const total = res.data?.total ?? newProducts.length;
      setTotalCount(total);
      if (pageNum === 1) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }
      setHasMore(newProducts.length === PAGE_SIZE);
      setPage(pageNum);
    } catch { /* silently fail */ } finally {
      setLoading(false);
      setRefreshing(false);
      loadingMore.current = false;
    }
  }, [categoryId, sortKey, minPrice, maxPrice]);

  useEffect(() => { setLoading(true); loadProducts(1, true); }, [sortKey]);

  const handleEndReached = () => {
    if (hasMore && !loading) loadProducts(page + 1);
  };

  const handleRefresh = () => { setRefreshing(true); loadProducts(1, true); };

  const applyFilters = () => {
    setFilterModal(false);
    setLoading(true);
    loadProducts(1, true);
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Gradient header */}
      <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          {totalCount > 0 && <Text style={styles.headerSub}>{totalCount} products</Text>}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModal(true)}>
          <Icon name="options-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Sort chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortBar}
        contentContainerStyle={styles.sortContent}
      >
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setSortKey(opt.key)}
            style={[styles.sortChip, sortKey === opt.key && styles.sortChipActive]}
          >
            <Text style={[styles.sortChipText, sortKey === opt.key && styles.sortChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product grid */}
      <FlashList
        data={products}
        numColumns={2}
        estimatedItemSize={220}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.grid}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Icon name="leaf-outline" size={56} color={Colors.border} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters</Text>
            </View>
          ) : null
        }
      />

      {/* Filter modal */}
      <Modal
        isVisible={filterModal}
        onBackdropPress={() => setFilterModal(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={{ justifyContent: 'flex-end', margin: 0 }}
      >
        <View style={styles.filterSheet}>
          <View style={styles.filterHandle} />
          <Text style={styles.filterTitle}>Filters</Text>

          <Text style={styles.filterLabel}>Price Range</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              value={minPrice}
              onChangeText={setMinPrice}
              placeholder="Min ₹"
              placeholderTextColor={Colors.textHint}
              keyboardType="number-pad"
              selectionColor={Colors.primary}
            />
            <Text style={styles.priceDash}>–</Text>
            <TextInput
              style={styles.priceInput}
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Max ₹"
              placeholderTextColor={Colors.textHint}
              keyboardType="number-pad"
              selectionColor={Colors.primary}
            />
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => { setMinPrice(''); setMaxPrice(''); }}
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  filterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sortBar: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  sortContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  sortChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, marginRight: 4 },
  sortChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  sortChipTextActive: { color: Colors.white },
  grid: { padding: 8, paddingBottom: 48 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textSecondary },
  filterSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  filterHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
  filterTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20 },
  filterLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  priceInput: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  priceDash: { fontSize: 18, color: Colors.textHint },
  filterActions: { flexDirection: 'row', gap: 12 },
  resetBtn: { flex: 1, paddingVertical: 14, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  resetBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  applyBtn: { flex: 2, paddingVertical: 14, borderRadius: borderRadius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});

export default CategoryBrowseScreen;
