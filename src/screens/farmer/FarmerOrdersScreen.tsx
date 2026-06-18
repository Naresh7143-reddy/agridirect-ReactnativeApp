/**
 * FarmerOrdersScreen
 *
 * - Scrollable tab bar (All | Pending | Accepted | Packed | Delivered | Cancelled)
 *   with animated sliding green underline indicator
 * - FlatList of order cards
 * - Each card: product thumbnails, order ID, buyer, time-ago, items summary, total, status
 * - Swipe right → Accept, Swipe left → Reject (with confirmation Modal)
 * - Pull-to-refresh with spinning sun icon
 * - "New Order" badge animates in when FCM arrives
 * - Per-tab empty states
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
  RefreshControl,
  ScrollView,
  Dimensions,
  Clipboard,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors, OrderStatusColors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { OrderStatus, type Order } from '../../types/order';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FarmerStackParamList } from '../../types/navigation';

const { width: W } = Dimensions.get('window');

// ─── Tab config ───────────────────────────────────────────────────────────────

interface TabDef {
  key: string;
  label: string;
  status?: OrderStatus;
}

const TABS: TabDef[] = [
  { key: 'ALL',       label: 'All' },
  { key: 'PENDING',   label: 'Pending',   status: OrderStatus.PENDING },
  { key: 'ACCEPTED',  label: 'Accepted',  status: OrderStatus.ACCEPTED },
  { key: 'PACKED',    label: 'Packed',    status: OrderStatus.PACKED },
  { key: 'DELIVERED', label: 'Delivered', status: OrderStatus.DELIVERED },
  { key: 'CANCELLED', label: 'Cancelled', status: OrderStatus.CANCELLED },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const shortId = (id: string) => id.slice(-6).toUpperCase();

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const cfg = OrderStatusColors[status] ?? { color: Colors.textHint, bg: Colors.divider };
  return (
    <View style={[badgeStyles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.text, { color: cfg.color }]}>{status}</Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  pill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700' },
});

// ─── Order card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onAccept: () => void;
  onReject: () => void;
  onPack: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress, onAccept, onReject, onPack }) => {
  const items = order.items ?? [];
  const totalKg = items.reduce((s, i) => s + i.quantity, 0);
  const firstThree = items.slice(0, 3);
  const extra = items.length - 3;

  const copyId = () => {
    Clipboard.setString(order.orderNumber);
    Toast.show({ type: 'success', text1: 'Order ID copied!', position: 'top' });
  };

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Thumbnail stack */}
      <View style={cardStyles.thumbStack}>
        {firstThree.map((item, i) => (
          <View
            key={item.id}
            style={[
              cardStyles.thumb,
              { marginTop: i * 8, zIndex: firstThree.length - i },
            ]}
          >
            <Icon name="leaf" size={20} color={Colors.primary} />
          </View>
        ))}
        {extra > 0 && (
          <View style={[cardStyles.extraBadge, { marginTop: firstThree.length * 8 }]}>
            <Text style={cardStyles.extraText}>+{extra}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={cardStyles.info}>
        <View style={cardStyles.topRow}>
          <TouchableOpacity onPress={copyId} style={cardStyles.idRow}>
            <Text style={cardStyles.orderId}>#{shortId(order.id)}</Text>
            <Icon name="copy-outline" size={12} color={Colors.textHint} />
          </TouchableOpacity>
          <Text style={cardStyles.timeAgo}>{timeAgo(order.createdAt)}</Text>
        </View>

        <Text style={cardStyles.buyerName} numberOfLines={1}>
          {order.buyerName ?? 'Buyer'}{order.deliveryAddress?.city ? ` · ${order.deliveryAddress.city}` : ''}
        </Text>

        <Text style={cardStyles.summary}>
          {items.length} item{items.length !== 1 ? 's' : ''} · {totalKg} units
        </Text>

        <View style={cardStyles.bottomRow}>
          <Text style={cardStyles.total}>₹{(order.grandTotal ?? 0).toFixed(2)}</Text>
          <StatusBadge status={order.status} />
        </View>
      </View>

      {/* Quick action buttons */}
      {order.status === OrderStatus.PENDING && (
        <View style={cardStyles.actions}>
          <TouchableOpacity style={cardStyles.acceptBtn} onPress={onAccept}>
            <Icon name="checkmark" size={16} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.rejectBtn} onPress={onReject}>
            <Icon name="close" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
      {order.status === OrderStatus.ACCEPTED && (
        <View style={cardStyles.actions}>
          <TouchableOpacity style={cardStyles.packBtn} onPress={onPack}>
            <Icon name="cube-outline" size={14} color={Colors.white} />
            <Text style={cardStyles.packTxt}>Pack</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 12,
    ...shadow.sm,
  },
  thumbStack: { width: 44, alignItems: 'center', position: 'relative', minHeight: 60 },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
    position: 'absolute',
  },
  extraBadge: {
    position: 'absolute',
    width: 28,
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: { fontSize: 9, color: Colors.white, fontWeight: '700' },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderId: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  timeAgo: { fontSize: 11, color: Colors.textHint },
  buyerName: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500', marginBottom: 2 },
  summary: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  actions: { flexDirection: 'column', gap: 8, justifyContent: 'center' },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packBtn: {
    borderRadius: 8,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  packTxt: { fontSize: 10, fontWeight: '700', color: Colors.white },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ tabKey: string }> = ({ tabKey }) => {
  const configs: Record<string, { icon: string; title: string; sub: string }> = {
    PENDING:   { icon: 'moon-outline',      title: 'No new orders',        sub: 'New orders will appear here' },
    ALL:       { icon: 'storefront-outline', title: 'No orders yet',        sub: 'Start listing products to receive orders!' },
    ACCEPTED:  { icon: 'timer-outline',      title: 'Nothing accepted',     sub: 'Accept orders to start packing' },
    PACKED:    { icon: 'cube-outline',       title: 'Nothing packed',       sub: 'Mark accepted orders as packed' },
    DELIVERED: { icon: 'checkmark-done',     title: 'No deliveries yet',    sub: 'Delivered orders appear here' },
    CANCELLED: { icon: 'close-circle-outline', title: 'No cancellations',   sub: 'Hopefully it stays that way!' },
  };
  const cfg = configs[tabKey] ?? configs.ALL;
  return (
    <View style={emptyStyles.wrap}>
      <Icon name={cfg.icon} size={64} color={Colors.border} />
      <Text style={emptyStyles.title}>{cfg.title}</Text>
      <Text style={emptyStyles.sub}>{cfg.sub}</Text>
    </View>
  );
};

const emptyStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});

// ─── Confirmation modal ───────────────────────────────────────────────────────

interface ConfirmModalProps {
  visible: boolean;
  action: 'accept' | 'reject' | 'pack' | null;
  orderId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const MODAL_CONFIG = {
  accept: {
    icon: 'checkmark-circle',
    color: Colors.success,
    title: 'Accept this order?',
    sub: "You'll be committed to prepare and hand over this order for delivery.",
    btnLabel: 'Yes, Accept',
  },
  pack: {
    icon: 'cube',
    color: Colors.warning,
    title: 'Mark as Packed?',
    sub: 'Confirm that this order is packed and ready for pickup by a delivery agent.',
    btnLabel: 'Yes, Mark Packed',
  },
  reject: {
    icon: 'close-circle',
    color: Colors.error,
    title: 'Decline this order?',
    sub: 'The buyer will be notified and the order will be cancelled.',
    btnLabel: 'Yes, Decline',
  },
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({ visible, action, orderId, onConfirm, onCancel }) => {
  const cfg = action ? MODAL_CONFIG[action] : MODAL_CONFIG.reject;
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={modalStyles.modal}
    >
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />
        <Icon
          name={cfg.icon}
          size={48}
          color={cfg.color}
          style={{ alignSelf: 'center', marginBottom: 12 }}
        />
        <Text style={modalStyles.title}>{cfg.title}</Text>
        <Text style={modalStyles.sub}>{cfg.sub}</Text>
        <TouchableOpacity
          style={[modalStyles.confirmBtn, { backgroundColor: cfg.color }]}
          onPress={onConfirm}
        >
          <Text style={modalStyles.confirmTxt}>{cfg.btnLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
          <Text style={modalStyles.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  modal: { justifyContent: 'flex-end', margin: 0 },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 10 },
  sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  confirmBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTxt: { fontSize: 16, fontWeight: '700', color: Colors.white },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelTxt: { fontSize: 15, color: Colors.textSecondary },
});

// ─── Main component ───────────────────────────────────────────────────────────

const FarmerOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    visible: boolean;
    action: 'accept' | 'reject' | 'pack' | null;
    orderId: string;
  }>({ visible: false, action: null, orderId: '' });

  // Sliding tab indicator
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidths = useRef<number[]>(TABS.map(() => 0)).current;
  const tabOffsets = useRef<number[]>(TABS.map(() => 0)).current;

  // Count badge per status
  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: orders.length };
    TABS.forEach((t) => {
      if (t.status) map[t.key] = orders.filter((o) => o.status === t.status).length;
    });
    return map;
  }, [orders]);

  // Filtered orders for current tab
  const displayedOrders = useMemo(() => {
    const tab = TABS[activeTab];
    if (!tab.status) return orders;
    return orders.filter((o) => o.status === tab.status);
  }, [orders, activeTab]);

  // ── Load orders ────────────────────────────────────────────────────────────

  const loadOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res: any = await ordersApi.getFarmerOrders({ limit: 50 } as any);
      // Backend returns res.data as a plain array — handle both array and
      // paginated shapes defensively so orders never disappear.
      const data = res?.data;
      const list = Array.isArray(data) ? data : (data?.items ?? data?.content ?? []);
      setOrders(list);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load orders' });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── Tab switch ─────────────────────────────────────────────────────────────

  const switchTab = (index: number) => {
    setActiveTab(index);
    Animated.spring(indicatorX, {
      toValue: tabOffsets[index],
      friction: 8,
      tension: 80,
      useNativeDriver: false,
    }).start();
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const openModal = (action: 'accept' | 'reject' | 'pack', orderId: string) => {
    setModal({ visible: true, action, orderId });
  };

  const handleConfirm = async () => {
    const { action, orderId } = modal;
    setModal((m) => ({ ...m, visible: false }));
    try {
      if (action === 'accept') {
        await ordersApi.accept(orderId);
        Toast.show({ type: 'success', text1: 'Order accepted' });
      } else if (action === 'pack') {
        await ordersApi.markPacked(orderId);
        Toast.show({ type: 'success', text1: 'Order marked as packed' });
      } else {
        Toast.show({ type: 'info', text1: 'Order declined' });
      }
      loadOrders();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Action failed', text2: e?.message });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity onPress={() => loadOrders(true)}>
          <Icon name="refresh-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => switchTab(i)}
              onLayout={(e) => {
                tabWidths[i] = e.nativeEvent.layout.width;
                tabOffsets[i] = e.nativeEvent.layout.x;
              }}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {counts[tab.key] > 0 && (
                <View style={[styles.countBadge, activeTab === i && styles.countBadgeActive]}>
                  <Text style={[styles.countText, activeTab === i && styles.countTextActive]}>
                    {counts[tab.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Animated underline */}
        <Animated.View
          style={[
            styles.tabIndicator,
            { left: indicatorX, width: tabWidths[activeTab] || 60 },
          ]}
        />
      </View>

      {/* Order list */}
      <FlashList
        data={displayedOrders}
        keyExtractor={(o) => o.id}
        estimatedItemSize={140}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? <EmptyState tabKey={TABS[activeTab].key} /> : null
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('FarmerOrderDetail', { orderId: item.id })}
            onAccept={() => openModal('accept', item.id)}
            onReject={() => openModal('reject', item.id)}
            onPack={() => openModal('pack', item.id)}
          />
        )}
      />

      {/* Confirmation modal */}
      <ConfirmModal
        visible={modal.visible}
        action={modal.action}
        orderId={modal.orderId}
        onConfirm={handleConfirm}
        onCancel={() => setModal((m) => ({ ...m, visible: false }))}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  tabLabel: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeActive: { backgroundColor: Colors.primary },
  countText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  countTextActive: { color: Colors.white },
  listContent: { padding: 16, flexGrow: 1 },
});

export default FarmerOrdersScreen;
