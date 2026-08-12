// FILE: src/screens/delivery/DeliveriesScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Platform, RefreshControl, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { deliveryApi } from '../../api/delivery';
import type { DeliveryOrder } from '../../types/delivery';
import type { DeliveryStackParamList } from '../../types/navigation';

type NavP = NativeStackNavigationProp<DeliveryStackParamList>;

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Active', 'Completed'];
const ACTIVE_STATUSES   = ['assigned', 'picked_up', 'in_transit', 'packed', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'PACKED'];
const COMPLETE_STATUSES = ['delivered', 'failed', 'DELIVERED', 'FAILED'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColor(status: string): { color: string; bg: string } {
  const s = status?.toLowerCase() ?? '';
  const map: Record<string, { color: string; bg: string }> = {
    assigned:   { color: '#E65100', bg: '#FFF3E0' },
    packed:     { color: '#6A1B9A', bg: '#F3E5F5' },
    picked_up:  { color: '#0277BD', bg: '#E1F5FE' },
    in_transit: { color: '#1565C0', bg: '#E3F2FD' },
    delivered:  { color: '#2E7D32', bg: '#E8F5E9' },
    failed:     { color: '#C62828', bg: '#FFEBEE' },
  };
  return map[s] ?? { color: Colors.textSecondary, bg: Colors.border };
}

function getStatusLabel(status: string): string {
  const s = status?.toLowerCase() ?? '';
  const labels: Record<string, string> = {
    assigned: 'Assigned', packed: 'Packed',
    picked_up: 'Picked Up', in_transit: 'In Transit',
    delivered: 'Delivered', failed: 'Failed',
  };
  return labels[s] ?? status.replace('_', ' ').toUpperCase();
}

function timeAgo(val: any): string {
  if (!val) return '';
  try {
    let d: Date;
    if (Array.isArray(val)) {
      const [y, mo, day, h = 0, mi = 0] = val;
      d = new Date(y, mo - 1, day, h, mi);
    } else {
      d = new Date(val);
    }
    if (isNaN(d.getTime())) return '';
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

// Unwrap Spring Boot Page response
// axios strips response.data, so we get { content: [...] } directly
function unwrapList(res: any): DeliveryOrder[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.content)) return res.content;       // Spring Boot Page
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.content)) return res.data.content;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

// ─── Delivery Card ────────────────────────────────────────────────────────────

function DeliveryCard({ order, onPress }: { order: DeliveryOrder; onPress: () => void }) {
  const { color, bg } = getStatusColor(order.status);
  const label = getStatusLabel(order.status);
  const dateVal = (order as any).assignedAt ?? (order as any).createdAt ?? (order as any).updatedAt;
  const drop = typeof order.dropAddress === 'string'
    ? order.dropAddress
    : order.dropAddress
      ? `${(order.dropAddress as any).line1 ?? ''}, ${(order.dropAddress as any).city ?? ''}`
      : '';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header */}
      <View style={s.cardHeader}>
        <View>
          <Text style={s.orderNum}>
            #{order.orderNumber ?? (order.orderId ?? '').slice(-8).toUpperCase()}
          </Text>
          <Text style={s.timeAgo}>{timeAgo(dateVal)}</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: bg }]}>
          <View style={[s.statusDot, { backgroundColor: color }]} />
          <Text style={[s.statusText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={s.divider} />

      {/* Buyer */}
      <View style={s.infoRow}>
        <Icon name="person-outline" size={14} color={Colors.textSecondary} />
        <Text style={s.infoText}>{order.buyerName ?? 'Buyer'}</Text>
      </View>

      {/* Pickup address */}
      <View style={s.infoRow}>
        <Icon name="leaf-outline" size={14} color={Colors.success} />
        <Text style={s.infoText} numberOfLines={1}>Pickup: {order.pickupAddress ?? '—'}</Text>
      </View>

      {/* Drop address */}
      <View style={s.infoRow}>
        <Icon name="location-outline" size={14} color={Colors.primary} />
        <Text style={s.infoText} numberOfLines={1}>Drop: {drop || '—'}</Text>
      </View>

      {/* Bottom: earnings + distance */}
      <View style={s.cardFooter}>
        <View style={s.earningBadge}>
          <Icon name="cash-outline" size={13} color={Colors.primary} />
          <Text style={s.earningText}>
            ₹{(order.deliveryFee ?? 0).toFixed(0)} earnings
          </Text>
        </View>
        {order.distance != null && (
          <Text style={s.distText}>{order.distance.toFixed(1)} km</Text>
        )}
      </View>

      {/* View details link */}
      <View style={s.viewRow}>
        <Text style={s.viewText}>View details</Text>
        <Icon name="arrow-forward" size={13} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: number }) {
  return (
    <View style={s.empty}>
      <Icon name="cube-outline" size={64} color={Colors.border} />
      <Text style={s.emptyTitle}>No {tab === 0 ? 'active' : 'completed'} deliveries</Text>
      <Text style={s.emptySub}>
        {tab === 0 ? 'You have no active deliveries right now' : 'Completed deliveries will appear here'}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DeliveriesScreen() {
  const navigation = useNavigation<NavP>();

  const [tab, setTab]           = useState(0);
  const [orders, setOrders]     = useState<DeliveryOrder[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch assigned orders from backend
      const res = await deliveryApi.getAssignedOrders({ limit: 200 } as any);
      const list = unwrapList(res);

      // Also try to fetch available pool (may 404 if not implemented)
      let available: DeliveryOrder[] = [];
      try {
        const availRes = await deliveryApi.getAvailableOrders();
        available = unwrapList(availRes);
      } catch { /* ignore - endpoint may not exist */ }

      // Merge + deduplicate
      const seen = new Set<string>();
      const merged = [...list, ...available].filter(o => {
        const id = (o as any).id || (o as any)._id || (o as any).orderId;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      setOrders(merged);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefresh(true); load(true); };

  const filtered = orders.filter(o => {
    const st = o.status?.toLowerCase() ?? '';
    return tab === 0
      ? ACTIVE_STATUSES.some(s => s.toLowerCase() === st)
      : COMPLETE_STATUSES.some(s => s.toLowerCase() === st);
  });

  const goToDetail = (order: DeliveryOrder) => {
    const id = (order as any).id || (order as any)._id || order.orderId || '';
    navigation.navigate('DeliveryOrderDetail', { orderId: id, initialOrder: order as any });
  };

  // Count badges
  const activeCount   = orders.filter(o => ACTIVE_STATUSES.some(s => s.toLowerCase() === o.status?.toLowerCase())).length;
  const completeCount = orders.filter(o => COMPLETE_STATUSES.some(s => s.toLowerCase() === o.status?.toLowerCase())).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Deliveries</Text>
        {activeCount > 0 && (
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{activeCount}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {TABS.map((label, i) => {
          const count = i === 0 ? activeCount : completeCount;
          return (
            <TouchableOpacity
              key={label}
              style={[s.tab, tab === i && s.tabActive]}
              onPress={() => setTab(i)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, tab === i && s.tabTextActive]}>{label}</Text>
              {count > 0 && (
                <View style={[s.tabCount, tab === i && s.tabCountActive]}>
                  <Text style={[s.tabCountText, tab === i && s.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={s.loaderText}>Loading deliveries…</Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(o, idx) => {
            const id = (o as any).id || (o as any)._id || o.orderId || `d-${idx}`;
            return String(id);
          }}
          estimatedItemSize={200}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={<EmptyState tab={tab} />}
          renderItem={({ item }) => {
            if (!item) return null;
            return <DeliveryCard order={item} onPress={() => goToDetail(item)} />;
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
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
  headerBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeText: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  tabCount: {
    backgroundColor: Colors.border, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  tabCountActive: { backgroundColor: Colors.primaryMuted },
  tabCountText: { fontSize: 11, fontWeight: '700', color: Colors.textHint },
  tabCountTextActive: { color: Colors.primary },

  // List
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10,
  },
  orderNum: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  timeAgo: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: 10 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10,
  },
  earningBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  earningText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  distText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  viewRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 4, marginTop: 10, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  viewText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Empty
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
});
