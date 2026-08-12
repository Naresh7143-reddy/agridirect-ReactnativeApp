// FILE: src/screens/buyer/OrdersScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import type { Order } from '../../types/order';
import type { BuyerStackParamList } from '../../types/navigation';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['PENDING', 'PAID', 'ACCEPTED', 'PACKED', 'PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'DISPATCHED'];
const PAST_STATUSES   = ['DELIVERED', 'COMPLETED'];
const CANCELLED_STATUSES = ['CANCELLED', 'REJECTED', 'REFUNDED'];

const TABS = [
  { key: 'Active',    label: 'Active',    statuses: ACTIVE_STATUSES },
  { key: 'Past',      label: 'Past',      statuses: PAST_STATUSES },
  { key: 'Cancelled', label: 'Cancelled', statuses: CANCELLED_STATUSES },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(val: any): string {
  if (!val) return '';
  try {
    // Handle array timestamps from Java [year,month,day,hour,min,sec]
    if (Array.isArray(val)) {
      const [y, mo, d, h = 0, mi = 0] = val;
      return new Date(y, mo - 1, d, h, mi).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function getStatusColor(status: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    PENDING:    { color: '#E65100', bg: '#FFF3E0' },
    PAID:       { color: '#0277BD', bg: '#E1F5FE' },
    ACCEPTED:   { color: '#0277BD', bg: '#E1F5FE' },
    PACKED:     { color: '#6A1B9A', bg: '#F3E5F5' },
    PICKED_UP:  { color: '#00838F', bg: '#E0F7FA' },
    IN_TRANSIT: { color: '#1565C0', bg: '#E3F2FD' },
    ON_THE_WAY: { color: '#1565C0', bg: '#E3F2FD' },
    DISPATCHED: { color: '#1565C0', bg: '#E3F2FD' },
    DELIVERED:  { color: '#2E7D32', bg: '#E8F5E9' },
    COMPLETED:  { color: '#2E7D32', bg: '#E8F5E9' },
    CANCELLED:  { color: '#C62828', bg: '#FFEBEE' },
    REJECTED:   { color: '#C62828', bg: '#FFEBEE' },
    REFUNDED:   { color: '#4E342E', bg: '#EFEBE9' },
  };
  return map[status?.toUpperCase()] ?? { color: Colors.textSecondary, bg: Colors.border };
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Order Placed', PAID: 'Paid', ACCEPTED: 'Accepted',
    PACKED: 'Packed', PICKED_UP: 'Picked Up', IN_TRANSIT: 'In Transit',
    ON_THE_WAY: 'On The Way', DISPATCHED: 'Dispatched',
    DELIVERED: 'Delivered', COMPLETED: 'Delivered',
    CANCELLED: 'Cancelled', REJECTED: 'Rejected', REFUNDED: 'Refunded',
  };
  return labels[status?.toUpperCase()] ?? status;
}

function unwrapOrders(response: any): Order[] {
  if (!response) return [];
  // Array directly
  if (Array.isArray(response)) return response;
  // Spring Boot Page: { content: [...] } — axios interceptor returns response.data
  // so we get this object directly
  if (Array.isArray(response.content)) return response.content;
  // Wrapped in .data (some endpoints)
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.content)) return response.data.content;
  if (Array.isArray(response.data?.items)) return response.data.items;
  if (Array.isArray(response.items)) return response.items;
  // Single order object in data field
  if (response.data && typeof response.data === 'object') return [response.data];
  return [];
}

// ─── Order Card ───────────────────────────────────────────────────────────────

interface CardProps {
  order: Order;
  tabIndex: number;
  onPress: () => void;
}

const OrderCard: React.FC<CardProps> = ({ order, tabIndex, onPress }) => {
  const status = (order.status as string)?.toUpperCase() ?? 'PENDING';
  const { color, bg } = getStatusColor(status);
  const label = getStatusLabel(status);
  // Price: try grandTotal first, fallback to totalAmount, then 0
  const rawAmount = (order as any).grandTotal ?? (order as any).grandtotal ??
                    order.totalAmount ?? (order as any).total ?? 0;
  const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount)) || 0;
  const itemCount = order.items?.length ?? 0;
  const itemLabel = itemCount === 1 ? '1 Order Item' : `${itemCount} Order Items`;
  const isCancelled = tabIndex === 2;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardOrderNum}>
          #{order.orderNumber ?? (order.id ?? '').slice(-8).toUpperCase()}
        </Text>
        <Text style={styles.cardDate}>{formatDate(order.createdAt)}</Text>
      </View>

      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Item summary */}
      <Text style={styles.itemSummary}>{itemLabel}</Text>

      {/* Amount */}
      <Text style={styles.amount}>₹{amount.toFixed(2)}</Text>

      {/* Payment method */}
      <View style={styles.payRow}>
        <Icon name="card-outline" size={13} color={Colors.textSecondary} />
        <Text style={styles.payText}>
          Pay: {((order.paymentMethod as string) ?? 'COD').replace('_', ' ')}
        </Text>
      </View>

      {/* Estimated delivery (active) */}
      {tabIndex === 0 && order.estimatedDelivery && (
        <View style={styles.estRow}>
          <Icon name="time-outline" size={13} color={Colors.primary} />
          <Text style={styles.estText}>
            Estimated delivery: {formatDate(order.estimatedDelivery)}
          </Text>
        </View>
      )}

      {/* Cancel reason */}
      {isCancelled && (order as any).cancelReason && (
        <Text style={styles.cancelReason} numberOfLines={1}>
          Reason: {(order as any).cancelReason}
        </Text>
      )}

      {/* View details */}
      <View style={styles.viewRow}>
        <Text style={styles.viewText}>View details</Text>
        <Icon name="arrow-forward" size={14} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ tab: string }> = ({ tab }) => {
  const map: Record<string, { icon: string; title: string; sub: string }> = {
    Active:    { icon: 'bag-outline',           title: 'No Active Orders',    sub: 'Your active orders will appear here' },
    Past:      { icon: 'checkmark-done-outline', title: 'No Past Orders',      sub: 'Your order history will show here'  },
    Cancelled: { icon: 'close-circle-outline',   title: 'No Cancelled Orders', sub: 'Cancelled orders will appear here'  },
  };
  const { icon, title, sub } = map[tab] ?? map.Active;
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();

  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await ordersApi.getBuyerOrders({ limit: 100 });
      setOrders(unwrapOrders(res));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(true); };

  // Filter orders by current tab
  const filteredOrders = orders.filter(o => {
    const s = (o.status as string)?.toUpperCase() ?? '';
    return TABS[activeTab].statuses.includes(s);
  });

  const goToDetail = (order: Order) => {
    const id = (order as any).id ?? (order as any)._id ?? '';
    navigation.navigate('OrderDetail', { orderId: id, initialOrder: order });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Orders</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading orders…</Text>
        </View>
      ) : (
        <FlashList
          data={filteredOrders}
          keyExtractor={(o) => (o as any).id ?? (o as any)._id ?? Math.random().toString()}
          estimatedItemSize={200}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={<EmptyState tab={TABS[activeTab].key} />}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              tabIndex={activeTab}
              onPress={() => goToDetail(item)}
            />
          )}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.white },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardOrderNum: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardDate: { fontSize: 12, color: Colors.textSecondary },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: 10,
    gap: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },

  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: 10 },

  itemSummary: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  amount: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  payText: { fontSize: 12, color: Colors.textSecondary },

  estRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  estText: { fontSize: 12, color: Colors.primary },

  cancelReason: { fontSize: 12, color: Colors.error, marginBottom: 4 },

  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  viewText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },

  // Loader
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
});

// Both named + default exports so navigator's default import works
export { OrdersScreen };
export default OrdersScreen;
