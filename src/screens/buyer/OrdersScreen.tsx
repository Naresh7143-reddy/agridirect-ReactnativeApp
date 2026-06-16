// FILE: src/screens/buyer/OrdersScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, OrderStatusColors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import type { Order } from '../../types/order';
import type { BuyerStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TABS = ['Active', 'Past', 'Cancelled'];
const TAB_WIDTH = SCREEN_WIDTH / TABS.length;

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'PACKED', 'PICKED_UP', 'IN_TRANSIT'];
const PAST_STATUSES = ['DELIVERED'];
const CANCELLED_STATUSES = ['CANCELLED'];

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending', ACCEPTED: 'Accepted', PACKED: 'Packed',
    PICKED_UP: 'Picked Up', IN_TRANSIT: 'In Transit', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

// ── OrderCard ─────────────────────────────────────────────────────────────────
interface OrderCardProps {
  order: Order;
  tab: number;
  onTrack: () => void;
  onRate: () => void;
  onReorder: () => void;
  onView: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, tab, onTrack, onRate, onView }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const statusColor = OrderStatusColors[order.status] || { color: Colors.textHint, bg: Colors.divider };

  useEffect(() => {
    if (tab === 0) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
    return undefined;
  }, [tab, pulse]);

  return (
    <TouchableOpacity style={[styles.orderCard, tab === 2 && styles.cancelledCard]} onPress={onView} activeOpacity={0.85}>
      <View style={styles.orderCardTop}>
        <View>
          <Text style={[styles.orderNumber, tab === 2 && styles.cancelledText]}>#{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          {tab === 0 && (
            <Animated.View style={[styles.pulseDot, { backgroundColor: statusColor.color, transform: [{ scale: pulse }] }]} />
          )}
          <Text style={[styles.statusText, { color: statusColor.color }]}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      <View style={styles.orderMeta}>
        <Text style={styles.orderItems}>{order.items?.length || 0} items</Text>
        <Text style={[styles.orderTotal, tab === 2 && styles.cancelledText]}>₹{order.grandTotal?.toFixed(0) || order.totalAmount?.toFixed(0)}</Text>
      </View>

      {tab === 2 && (
        <View style={styles.refundRow}>
          <Text style={styles.refundText}>Refund Status: </Text>
          <Text style={styles.refundValue}>{order.paymentStatus === 'REFUNDED' ? 'Refunded ✓' : 'Processing'}</Text>
        </View>
      )}

      <View style={styles.orderCardActions}>
        {tab === 0 && (
          <TouchableOpacity style={styles.primaryActionBtn} onPress={onTrack}>
            <Text style={styles.primaryActionText}>Track Order</Text>
          </TouchableOpacity>
        )}
        {tab === 1 && (
          <>
            <TouchableOpacity style={styles.secondaryActionBtn} onPress={onRate}>
              <Text style={styles.secondaryActionText}>⭐ Rate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryActionBtn} onPress={onView}>
              <Text style={styles.primaryActionText}>Reorder</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const loadOrders = useCallback(async () => {
    try {
      const res: any = await ordersApi.getBuyerOrders({ limit: 50 });
      // Backend returns res.data as a plain array; older code expected
      // {items:[...]}. Handle both so the list never silently empties.
      const data = res?.data;
      const list = Array.isArray(data) ? data : (data?.items ?? data?.content ?? []);
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const switchTab = (index: number) => {
    setActiveTab(index);
    Animated.timing(tabAnim, { toValue: index * TAB_WIDTH, duration: 200, useNativeDriver: false }).start();
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 0) return ACTIVE_STATUSES.includes(o.status);
    if (activeTab === 1) return PAST_STATUSES.includes(o.status);
    return CANCELLED_STATUSES.includes(o.status);
  });

  const renderOrder = ({ item }: { item: Order }) => (
    <OrderCard
      order={item}
      tab={activeTab}
      onTrack={() => navigation.navigate('OrderTracking', { orderId: item.id })}
      onRate={() => navigation.navigate('RateReview', { orderId: item.id })}
      onReorder={() => {}}
      onView={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => switchTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
        <Animated.View style={[styles.tabIndicator, { left: tabAnim }]} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlashList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(o) => o.id}
          estimatedItemSize={160}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No {TABS[activeTab].toLowerCase()} orders</Text>
              <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: Colors.white, ...shadow.sm },
  backText: { fontSize: 22, color: Colors.textPrimary, width: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, position: 'relative' },
  tab: { width: TAB_WIDTH, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 14, color: Colors.textHint, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: 0, height: 2, width: TAB_WIDTH, backgroundColor: Colors.primary, borderRadius: 1 },
  listContent: { padding: 14, paddingBottom: 32 },
  orderCard: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 14, marginBottom: 12, ...shadow.sm },
  cancelledCard: { opacity: 0.75 },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderNumber: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cancelledText: { textDecorationLine: 'line-through', color: Colors.textHint },
  orderDate: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.full, gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderItems: { fontSize: 13, color: Colors.textSecondary },
  orderTotal: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  refundRow: { flexDirection: 'row', marginBottom: 8 },
  refundText: { fontSize: 12, color: Colors.textHint },
  refundValue: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  orderCardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  primaryActionBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 8 },
  primaryActionText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  secondaryActionBtn: { backgroundColor: Colors.warningLight, borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 8 },
  secondaryActionText: { color: Colors.warning, fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textHint, marginTop: 4 },
});
