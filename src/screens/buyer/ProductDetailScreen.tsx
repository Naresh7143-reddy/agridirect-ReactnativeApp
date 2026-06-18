// FILE: src/screens/buyer/ProductDetailScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { useAppDispatch, useAppSelector } from '../../store';
import { addItem, updateQuantity, selectItemQuantity } from '../../store/cartSlice';
import { productsApi } from '../../api/products';
import type { Product } from '../../types/product';
import type { BuyerStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STAR_COUNTS = [
  { star: 5, pct: 62 },
  { star: 4, pct: 20 },
  { star: 3, pct: 10 },
  { star: 2, pct: 5 },
  { star: 1, pct: 3 },
];

const MOCK_REVIEWS = [
  { id: '1', user: 'Priya M.', rating: 5, text: 'Super fresh tomatoes! Arrived same day.', date: '2 days ago' },
  { id: '2', user: 'Rahul K.', rating: 4, text: 'Good quality, slightly small size but tasty.', date: '5 days ago' },
  { id: '3', user: 'Anita S.', rating: 5, text: 'Best price in the market. Will order again!', date: '1 week ago' },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ fontSize: 14, color: s <= rating ? Colors.secondary : Colors.border }}>★</Text>
      ))}
    </View>
  );
}

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const route = useRoute<RouteProp<BuyerStackParamList, 'ProductDetail'>>();
  const { productId } = route.params;
  const dispatch = useAppDispatch();
  const qty = useAppSelector(selectItemQuantity(productId));

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const stickyOpacity = scrollY.interpolate({ inputRange: [200, 280], outputRange: [0, 1], extrapolate: 'clamp' });

  useEffect(() => {
    productsApi.getById(productId).then((r: any) => {
      setProduct(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [productId]);

  const isUnavailable = !product?.isAvailable || (product?.stock != null && product.stock === 0);

  const handleAdd = useCallback(() => {
    if (!product) return;
    if (isUnavailable) return; // guard: do not add unavailable products
    dispatch(addItem({ product, quantity: 1 }));
  }, [dispatch, product, isUnavailable]);

  const handleInc = useCallback(() => {
    dispatch(updateQuantity({ productId, quantity: qty + 1 }));
  }, [dispatch, productId, qty]);

  const handleDec = useCallback(() => {
    dispatch(updateQuantity({ productId, quantity: qty - 1 }));
  }, [dispatch, productId, qty]);

  if (loading) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn2}>
          <Text style={styles.backBtn2Text}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Gallery: prefer images[].url, else imageUrls[], else primaryImageUrl.
  const images: string[] = product.images?.length
    ? product.images.map((img: any) => img.url || img)
    : Array.isArray((product as any).imageUrls) && (product as any).imageUrls.length
      ? (product as any).imageUrls
      : [product.primaryImageUrl || ''];

  return (
    <View style={styles.container}>
      {/* Back Button Overlay */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backOverlay}>
        <Text style={styles.backOverlayText}>←</Text>
      </TouchableOpacity>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* Image Carousel */}
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
          renderItem={({ item }) => (
            <FastImage
              source={{ uri: item }}
              style={styles.carouselImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          )}
        />
        <View style={styles.dotsRow}>
          {images.map((_: string, i: number) => (
            <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.content}>
          {/* Name + Rating */}
          <View style={styles.row}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.stock < 10 && product.stock > 0 && (
              <View style={styles.freshBadge}>
                <Text style={styles.freshBadgeText}>🌱 Fresh</Text>
              </View>
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.price}>₹{product.price}/{product.unit}</Text>
            {(product.rating ?? 0) > 0 && (
              <View style={styles.ratingWrap}>
                <Text style={styles.ratingText}>⭐ {(product.rating ?? 0).toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Quantity Stepper */}
          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Quantity:</Text>
            {qty === 0 ? (
              <TouchableOpacity
                style={[styles.addBtn, isUnavailable && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={isUnavailable}
              >
                <Text style={styles.addBtnText}>{isUnavailable ? (!product?.isAvailable ? 'Unavailable' : 'Out of Stock') : '+ Add to Cart'}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.stepper}>
                <TouchableOpacity onPress={handleDec} style={styles.stepperBtn}><Text style={styles.stepperBtnText}>−</Text></TouchableOpacity>
                <Text style={styles.stepperQty}>{qty}</Text>
                <TouchableOpacity onPress={handleInc} style={styles.stepperBtn}><Text style={styles.stepperBtnText}>+</Text></TouchableOpacity>
              </View>
            )}
          </View>

          {/* Farmer Card */}
          <View style={styles.farmerCard}>
            <View style={styles.farmerAvatar}>
              <Text style={styles.farmerAvatarText}>{product.farmerName?.[0] || 'F'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.farmerName}>{product.farmerName}</Text>
              <Text style={styles.farmerSub}>Verified Farmer</Text>
            </View>
            <TouchableOpacity
              style={styles.viewFarmerBtn}
              onPress={() => navigation.navigate('FarmerPublicProfile', { farmerId: product.farmerId })}
            >
              <Text style={styles.viewFarmerText}>View Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descText} numberOfLines={descExpanded ? undefined : 3}>
              {product.description || 'No description available for this product.'}
            </Text>
            {(product.description?.length || 0) > 100 && (
              <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)}>
                <Text style={styles.readMore}>{descExpanded ? 'Show less ▲' : 'Read more ▼'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Star Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <View style={styles.overallRating}>
              <Text style={styles.bigRating}>{product.rating?.toFixed(1) || '—'}</Text>
              <StarRow rating={Math.round(product.rating || 0)} />
              <Text style={styles.ratingCount}>Based on reviews</Text>
            </View>
            {STAR_COUNTS.map((row) => (
              <View key={row.star} style={styles.starBreakRow}>
                <Text style={styles.starLabel}>{row.star}★</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${row.pct}%` }]} />
                </View>
                <Text style={styles.starPct}>{row.pct}%</Text>
              </View>
            ))}
            {MOCK_REVIEWS.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}><Text style={styles.reviewAvatarText}>{rev.user[0]}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUser}>{rev.user}</Text>
                    <StarRow rating={rev.rating} />
                  </View>
                  <Text style={styles.reviewDate}>{rev.date}</Text>
                </View>
                <Text style={styles.reviewText}>{rev.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Sticky Bottom Bar */}
      <Animated.View style={[styles.stickyBar, { opacity: stickyOpacity }]}>
        <View style={styles.stickyPriceWrap}>
          <Text style={styles.stickyPrice}>₹{product.price}/{product.unit}</Text>
          <Text style={styles.stickyStock}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</Text>
        </View>
        {qty === 0 ? (
          <TouchableOpacity
            style={[styles.stickyAddBtn, isUnavailable && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={isUnavailable}
          >
            <Text style={styles.stickyAddText}>{isUnavailable ? (!product?.isAvailable ? 'Unavailable' : 'Out of Stock') : '+ Add to Cart'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stickyStepperWrap}>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={handleDec} style={styles.stepperBtn}><Text style={styles.stepperBtnText}>−</Text></TouchableOpacity>
              <Text style={styles.stepperQty}>{qty}</Text>
              <TouchableOpacity onPress={handleInc} style={styles.stepperBtn}><Text style={styles.stepperBtnText}>+</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
              <Text style={styles.cartBtnText}>Go to Cart →</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: Colors.error },
  backBtn2: { marginTop: 12, backgroundColor: Colors.primary, borderRadius: borderRadius.md, paddingHorizontal: 20, paddingVertical: 10 },
  backBtn2Text: { color: Colors.white, fontWeight: '600' },
  backOverlay: { position: 'absolute', top: 48, left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: borderRadius.full, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backOverlayText: { color: Colors.white, fontSize: 20 },
  carouselImage: { width: SCREEN_WIDTH, height: 280 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border, marginHorizontal: 3 },
  dotActive: { width: 18, backgroundColor: Colors.primary },
  content: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  productName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  freshBadge: { backgroundColor: Colors.successLight, borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  freshBadgeText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  price: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  ratingWrap: { backgroundColor: Colors.warningLight, borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText: { color: Colors.warning, fontWeight: '700', fontSize: 14 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 12 },
  stepperLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  addBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: borderRadius.md, paddingVertical: 12, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: Colors.border },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, borderRadius: borderRadius.md, paddingHorizontal: 8, paddingVertical: 6, gap: 12 },
  stepperBtn: { width: 32, height: 32, backgroundColor: Colors.primary, borderRadius: borderRadius.xs, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { color: Colors.white, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  stepperQty: { fontSize: 18, fontWeight: '700', color: Colors.primary, minWidth: 30, textAlign: 'center' },
  farmerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 14, marginVertical: 12, ...shadow.sm },
  farmerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  farmerAvatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  farmerName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  farmerSub: { fontSize: 12, color: Colors.accent, marginTop: 2 },
  viewFarmerBtn: { backgroundColor: Colors.successLight, borderRadius: borderRadius.md, paddingHorizontal: 10, paddingVertical: 6 },
  viewFarmerText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  readMore: { color: Colors.primary, fontSize: 13, fontWeight: '600', marginTop: 4 },
  overallRating: { alignItems: 'center', marginBottom: 16 },
  bigRating: { fontSize: 48, fontWeight: '800', color: Colors.textPrimary },
  ratingCount: { fontSize: 12, color: Colors.textHint, marginTop: 4 },
  starBreakRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  starLabel: { width: 24, fontSize: 12, color: Colors.textSecondary },
  barBg: { flex: 1, height: 6, backgroundColor: Colors.divider, borderRadius: 3, marginHorizontal: 8 },
  barFill: { height: 6, backgroundColor: Colors.secondary, borderRadius: 3 },
  starPct: { width: 32, fontSize: 12, color: Colors.textHint, textAlign: 'right' },
  reviewCard: { backgroundColor: Colors.white, borderRadius: borderRadius.md, padding: 12, marginTop: 10, ...shadow.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  reviewAvatarText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  reviewUser: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  reviewDate: { fontSize: 11, color: Colors.textHint },
  reviewText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  stickyBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28, ...shadow.lg },
  stickyPriceWrap: { flex: 1 },
  stickyPrice: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  stickyStock: { fontSize: 11, color: Colors.textHint },
  stickyAddBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: 20, paddingVertical: 12 },
  stickyAddText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  stickyStepperWrap: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  cartBtn: { backgroundColor: Colors.successLight, borderRadius: borderRadius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  cartBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
});
