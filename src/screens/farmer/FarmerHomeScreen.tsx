/**
 * FarmerHomeScreen
 *
 * Farmer's main landing tab. Shows:
 *  - Greeting header with name and date
 *  - Dashboard stat cards (revenue, orders, products, rating)
 *  - Quick actions (Add Product, Orders, AI, Earnings)
 *  - Recent products carousel (from getMyListings)
 *  - Daily farming tip
 *
 * Loads from farmerApi.getDashboard() and productsApi.getMyListings().
 * Errors are swallowed -> empty states so the screen never crashes.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { useAuth } from '../../hooks/useAuth';
import { farmerApi } from '../../api/farmer';
import { productsApi } from '../../api/products';
import { productImageUrl } from '../../utils/productImage';
import type { FarmerDashboard } from '../../types/farmer';
import type { Product } from '../../types/product';
import type { FarmerStackParamList } from '../../types/navigation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const greetingFor = (hour: number) => {
  if (hour < 5)  return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

const formatINR = (n: number) =>
  '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconColor, iconBg, label, value, onPress }) => {
  const inner = (
    <>
      <View style={[statStyles.iconBox, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </>
  );
  return onPress ? (
    <TouchableOpacity style={statStyles.card} onPress={onPress} activeOpacity={0.85}>{inner}</TouchableOpacity>
  ) : (
    <View style={statStyles.card}>{inner}</View>
  );
};

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    ...shadow.sm,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  value: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  label: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

// ─── Quick action ─────────────────────────────────────────────────────────────

const Quick: React.FC<{ icon: string; label: string; onPress: () => void }> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={quickStyles.btn} onPress={onPress} activeOpacity={0.85}>
    <View style={quickStyles.iconBox}>
      <Icon name={icon} size={22} color={Colors.primary} />
    </View>
    <Text style={quickStyles.label}>{label}</Text>
  </TouchableOpacity>
);

const quickStyles = StyleSheet.create({
  btn: { flex: 1, alignItems: 'center', gap: 6 },
  iconBox: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
});

// ─── Product card (compact) ───────────────────────────────────────────────────

const ProductCard: React.FC<{ product: Product; onPress: () => void }> = ({ product, onPress }) => {
  const img = productImageUrl(product);
  return (
  <TouchableOpacity style={prodStyles.card} onPress={onPress} activeOpacity={0.85}>
    {img ? (
      <Image source={{ uri: img }} style={prodStyles.image} />
    ) : (
      <View style={[prodStyles.image, prodStyles.imageFallback]}>
        <Icon name="leaf-outline" size={28} color={Colors.primary} />
      </View>
    )}
    <Text style={prodStyles.name} numberOfLines={1}>{product.name}</Text>
    <Text style={prodStyles.price}>{formatINR(product.price)}<Text style={prodStyles.unit}>/{product.unit}</Text></Text>
  </TouchableOpacity>
  );
};

const prodStyles = StyleSheet.create({
  card: {
    width: 132,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 10,
    marginRight: 12,
    ...shadow.sm,
  },
  image: { width: '100%', height: 90, borderRadius: 10, marginBottom: 8 },
  imageFallback: { backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  price: { fontSize: 14, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  unit: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const FarmerHomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<FarmerDashboard | null>(null);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [dashRes, prodRes] = await Promise.all([
        farmerApi.getDashboard().catch(() => null),
        productsApi.getMyListings({ page: 1, limit: 10 }).catch(() => null),
      ]);
      if (dashRes && (dashRes as any).data) setDashboard((dashRes as any).data);
      const list: any = prodRes && (prodRes as any).data;
      if (Array.isArray(list)) setProducts(list);
      else if (list && Array.isArray(list.items)) setProducts(list.items);
      else if (list && Array.isArray(list.content)) setProducts(list.content);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const hour = new Date().getHours();
  const greeting = greetingFor(hour);
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <LinearGradient colors={Colors.gradientGreen} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.farmer}>{user?.name ?? 'Farmer'} 🌾</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.85}
          >
            <Icon name="notifications-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.statsRow}>
          <StatCard
            icon="cash-outline"
            iconColor={Colors.success}
            iconBg={Colors.successLight}
            label="Total Revenue"
            value={formatINR(dashboard?.totalRevenue ?? 0)}
            onPress={() => navigation.navigate('FarmerEarnings')}
          />
          <View style={{ width: 12 }} />
          <StatCard
            icon="bag-outline"
            iconColor={Colors.primary}
            iconBg={Colors.surfaceSecondary}
            label="Total Orders"
            value={String(dashboard?.totalOrders ?? 0)}
            onPress={() => navigation.navigate('FarmerTabs', { screen: 'OrdersTab' } as any)}
          />
        </View>
        <View style={[styles.statsRow, { marginTop: 12 }]}>
          <StatCard
            icon="leaf-outline"
            iconColor={Colors.primary}
            iconBg={Colors.successLight}
            label="Active Products"
            value={String(dashboard?.activeProducts ?? products.length)}
            onPress={() => navigation.navigate('MyProducts')}
          />
          <View style={{ width: 12 }} />
          <StatCard
            icon="star-outline"
            iconColor={Colors.warning}
            iconBg={Colors.warningLight}
            label="Rating"
            value={(dashboard?.averageRating ?? 0).toFixed(1)}
          />
        </View>

        {/* Orders breakdown */}
        {(dashboard?.totalOrders ?? 0) > 0 && (
          <View style={[styles.statsRow, { marginTop: 12 }]}>
            <View style={[statStyles.card, { alignItems: 'center' }]}>
              <Text style={[statStyles.value, { color: Colors.warning }]}>{dashboard?.pendingOrders ?? 0}</Text>
              <Text style={statStyles.label}>Pending</Text>
            </View>
            <View style={{ width: 12 }} />
            <View style={[statStyles.card, { alignItems: 'center' }]}>
              <Text style={[statStyles.value, { color: Colors.primary }]}>{dashboard?.acceptedOrders ?? 0}</Text>
              <Text style={statStyles.label}>Accepted</Text>
            </View>
            <View style={{ width: 12 }} />
            <View style={[statStyles.card, { alignItems: 'center' }]}>
              <Text style={[statStyles.value, { color: Colors.success }]}>{dashboard?.deliveredOrders ?? 0}</Text>
              <Text style={statStyles.label}>Delivered</Text>
            </View>
          </View>
        )}

        {(dashboard?.pendingOrders ?? 0) > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => navigation.navigate('FarmerTabs')}
            activeOpacity={0.85}
          >
            <Icon name="alert-circle-outline" size={22} color={Colors.warning} />
            <Text style={styles.pendingText}>
              {dashboard?.pendingOrders} new order{dashboard?.pendingOrders === 1 ? '' : 's'} waiting to confirm
            </Text>
            <Icon name="chevron-forward" size={18} color={Colors.warning} />
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <Quick icon="add-circle-outline" label="Add Product" onPress={() => navigation.navigate('AddProduct')} />
          <Quick icon="cube-outline"       label="Orders"      onPress={() => navigation.navigate('FarmerTabs', { screen: 'OrdersTab' } as any)} />
          <Quick icon="sparkles-outline"   label="AI Assist"   onPress={() => navigation.navigate('FarmerTabs', { screen: 'AITab' } as any)} />
          <Quick icon="cash-outline"       label="Earnings"    onPress={() => navigation.navigate('FarmerEarnings')} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddProduct')}>
            <Text style={styles.sectionLink}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : products.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="leaf-outline" size={36} color={Colors.primary} />
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySub}>Tap below to list your first crop or produce</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddProduct')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>Add your first product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onPress={() => navigation.navigate('ProductPreview', { productId: p.id })}
              />
            ))}
          </ScrollView>
        )}

        <LinearGradient colors={['#E8F5E9', '#FFFFFF']} style={styles.tipCard}>
          <Icon name="bulb-outline" size={24} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Today's Farming Tip</Text>
            <Text style={styles.tipBody}>
              Check the weather forecast in the AI Assistant tab before irrigating — it can save you
              water and boost yield.
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  greeting: { color: Colors.white, fontSize: 14, opacity: 0.9 },
  farmer:   { color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 2 },
  date:     { color: Colors.white, fontSize: 12, opacity: 0.85, marginTop: 4 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row' },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: borderRadius.md,
    padding: 14,
    marginTop: 14,
  },
  pendingText: { flex: 1, color: Colors.textPrimary, fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLink: { color: Colors.primary, fontWeight: '700', fontSize: 13, marginTop: 20 },
  quickRow: { flexDirection: 'row', gap: 8 },
  carousel: { marginLeft: -4 },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    ...shadow.sm,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  emptySub:   { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  tipCard: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.successLight,
  },
  tipTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  tipBody:  { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});

export default FarmerHomeScreen;
