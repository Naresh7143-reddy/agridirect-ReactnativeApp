// FILE: src/screens/farmer/FarmerOrdersScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { OrderStatus, type Order } from '../../types/order';
import type { FarmerStackParamList } from '../../types/navigation';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'ALL',       label: 'All',       filter: null },
  { key: 'PENDING',   label: 'Pending',   filter: ['PENDING'] },
  { key: 'ACCEPTED',  label: 'Accepted',  filter: ['ACCEPTED'] },
  { key: 'PACKED',    label: 'Packed',    filter: ['PACKED'] },
  { key: 'DELIVERED', label: 'Delivered', filter: ['DELIVERED', 'COMPLETED'] },
  { key: 'CANCELLED', label: 'Cancelled', filter: ['CANCELLED', 'REJECTED'] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(val: any): string {
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const diffMs   = Date.now() - d.getTime();
    const mins     = Math.floor(diffMs / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

function getStatusColor(status: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    PENDING:   { color: '#E65100', bg: '#FFF3E0' },
    ACCEPTED:  { color: '#0277BD', bg: '#E1F5FE' },
    PACKED:    { color: '#6A1B9A', bg: '#F3E5F5' },
    PICKED_UP: { color: '#00838F', bg: '#E0F7FA' },
    IN_TRANSIT:{ color: '#1565C0', bg: '#E3F2FD' },
    ON_THE_WAY:{ color: '#1565C0', bg: '#E3F2FD' },
    DELIVERED: { color: '#2E7D32', bg: '#E8F5E9' },
    COMPLETED: { color: '#2E7D32', bg: '#E8F5E9' },
    CANCELLED: { color: '#C62828', bg: '#FFEBEE' },
    REJECTED:  { color: '#C62828', bg: '#FFEBEE' },
  };
  return map[status?.toUpperCase()] ?? { color: Colors.textSecondary, bg: Colors.border };
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending', ACCEPTED: 'Accepted', PACKED: 'Packed',
    PICKED_UP: 'Picked Up', IN_TRANSIT: 'In Transit', ON_THE_WAY: 'On The Way',
    DELIVERED: 'Delivered', COMPLETED: 'Delivered',
    CANCELLED: 'Cancelled', REJECTED: 'Rejected',
  };
  return labels[status?.toUpperCase()] ?? status;
}

function unwrapOrders(response: any): Order[] {
  if (!response) return [];
  // Direct array
  if (Array.isArray(response)) return response;
  // Spring Boot Page<T>: { content: [...] } — axios returns response.data so we get this directly
  if (Array.isArray(response.content)) return response.content;
  // Wrapped in .data
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.content)) return response.data.content;
  if (Array.isArray(response.data?.items)) return response.data.items;
  if (Array.isArray(response.items)) return response.items;
  return [];
}

// ─── Order Card ───────────────────────────────────────────────────────────────

interface CardProps {
  order: Order;
  onPress: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onPack: () => void;
}

const OrderCard: React.FC<CardProps> = ({ order, onPress, onAccept, onDecline, onPack }) => {
  const status = (order.status as string)?.toUpperCase() ?? 'PENDING';
  const { color, bg } = getStatusColor(status);
  const label = getStatusLabel(status);
  const amount = (order as any).grandTotal ?? order.totalAmount ?? 0;
  const itemCount = order.items?.length ?? 0;
  const isPending  = status === 'PENDING';
  const isAccepted = status === 'ACCEPTED';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNum}>
            #{order.orderNumber ?? ((order as any).id ?? '').slice(-8).toUpperCase()}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: bg }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={styles.buyerRow}>
          <Icon name="person-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.buyerName}>{order.buyerName ?? 'Customer'}</Text>
        </View>
        <Text style={styles.itemMeta}>
          {itemCount} item{itemCount !== 1 ? 's' : ''} · ₹{amount.toFixed(2)}
        </Text>
        <Text style={styles.payMethod}>
          Pay: {((order.paymentMethod as string) ?? 'COD').replace('_', ' ')}
        </Text>
      </View>

      {/* Actions */}
      {isPending && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={e => { e.stopPropagation?.(); onAccept(); }}
          >
            <Icon name="checkmark" size={15} color={Colors.white} />
            <Text style={styles.actionText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={e => { e.stopPropagation?.(); onDecline(); }}
          >
            <Icon name="close" size={15} color={Colors.white} />
            <Text style={styles.actionText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {isAccepted && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.packBtn]}
            onPress={e => { e.stopPropagation?.(); onPack(); }}
          >
            <Icon name="cube-outline" size={15} color={Colors.white} />
            <Text style={styles.actionText}>Mark as Packed</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* View details */}
      <View style={styles.viewRow}>
        <Text style={styles.viewText}>View details</Text>
        <Icon name="chevron-forward" size={14} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ tab: string }> = ({ tab }) => {
  const map: Record<string, { icon: string; title: string }> = {
    ALL:       { icon: 'cart-outline',            title: 'No orders yet' },
    PENDING:   { icon: 'time-outline',            title: 'No pending orders' },
    ACCEPTED:  { icon: 'checkmark-circle-outline',title: 'No accepted orders' },
    PACKED:    { icon: 'cube-outline',            title: 'No packed orders' },
    DELIVERED: { icon: 'checkmark-done-outline',  title: 'No deliveries' },
    CANCELLED: { icon: 'close-circle-outline',    title: 'No cancelled orders' },
  };
  const { icon, title } = map[tab] ?? map.ALL;
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>Orders will appear here</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const FarmerOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();

  const [activeTab, setActiveTab]   = useState(0);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await ordersApi.getFarmerOrders({ limit: 200 });
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

  const filtered = orders.filter(o => {
    const tab = TABS[activeTab];
    if (!tab.filter) return true;
    return tab.filter.includes((o.status as string)?.toUpperCase() ?? '');
  });

  // Sort: newest first
  const sorted = [...filtered].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const goToDetail = (order: Order) => {
    const id = (order as any).id ?? (order as any)._id ?? '';
    navigation.navigate('FarmerOrderDetail', { orderId: id, initialOrder: order });
  };

  const doAccept = async (order: Order) => {
    const id = (order as any).id ?? (order as any)._id ?? '';
    setActionLoading(id);
    try {
      await ordersApi.accept(id);
      Toast.show({ type: 'success', text1: 'Order accepted!', text2: 'Please prepare it for packing.' });
      await load(true);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to accept', text2: e?.message });
    } finally { setActionLoading(null); }
  };

  const doDecline = (order: Order) => {
    Alert.alert('Decline Order', 'Are you sure you want to decline this order?', [
      { text: 'No', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => {
        const id = (order as any).id ?? (order as any)._id ?? '';
        setActionLoading(id);
        try {
          await ordersApi.cancel(id, 'Farmer declined');
          Toast.show({ type: 'info', text1: 'Order declined' });
          await load(true);
        } catch (e: any) {
          Toast.show({ type: 'error', text1: 'Failed', text2: e?.message });
        } finally { setActionLoading(null); }
      }},
    ]);
  };

  const doPack = async (order: Order) => {
    const id = (order as any).id ?? (order as any)._id ?? '';
    setActionLoading(id);
    try {
      await ordersApi.markPacked(id);
      Toast.show({ type: 'success', text1: 'Marked as Packed!', text2: 'Awaiting pickup by delivery agent.' });
      await load(true);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: e?.message });
    } finally { setActionLoading(null); }
  };

  // Pending count badge
  const pendingCount = orders.filter(o => (o.status as string)?.toUpperCase() === 'PENDING').length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Orders</Text>
          {pendingCount > 0 && (
            <Text style={styles.headerSub}>{pendingCount} pending order{pendingCount !== 1 ? 's' : ''} need attention</Text>
          )}
        </View>
        {pendingCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* Tab bar (horizontal scroll) */}
      <View style={styles.tabContainer}>
        <FlashList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={90}
          contentContainerStyle={styles.tabList}
          keyExtractor={t => t.key}
          renderItem={({ item, index }) => {
            const count = item.filter
              ? orders.filter(o => item.filter!.includes((o.status as string)?.toUpperCase())).length
              : orders.length;
            return (
              <TouchableOpacity
                style={[styles.tab, activeTab === index && styles.tabActive]}
                onPress={() => setActiveTab(index)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
                  {item.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabCount, activeTab === index && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, activeTab === index && styles.tabCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading orders…</Text>
        </View>
      ) : (
        <FlashList
          data={sorted}
          keyExtractor={o => (o as any).id ?? (o as any)._id ?? Math.random().toString()}
          estimatedItemSize={220}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={<EmptyState tab={TABS[activeTab].key} />}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => goToDetail(item)}
              onAccept={() => doAccept(item)}
              onDecline={() => doDecline(item)}
              onPack={() => doPack(item)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Tabs
  tabContainer: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabList: { paddingHorizontal: 12 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
    marginRight: 4,
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  tabCount: {
    backgroundColor: Colors.border,
    borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  tabCountActive: { backgroundColor: Colors.primaryMuted },
  tabCountText: { fontSize: 11, fontWeight: '700', color: Colors.textHint },
  tabCountTextActive: { color: Colors.primary },

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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderNum: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  timeAgo: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: 10 },

  cardBody: { gap: 4 },
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buyerName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  itemMeta: { fontSize: 13, color: Colors.textSecondary },
  payMethod: { fontSize: 12, color: Colors.textHint },

  // Actions
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: borderRadius.md,
  },
  acceptBtn: { backgroundColor: Colors.success },
  declineBtn: { backgroundColor: Colors.error },
  packBtn:   { backgroundColor: Colors.primaryLight },
  actionText: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  viewRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 4, marginTop: 10, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  viewText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },

  // Loader
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
});

// Named + default exports so both import styles work
export { FarmerOrdersScreen };
export default FarmerOrdersScreen;
