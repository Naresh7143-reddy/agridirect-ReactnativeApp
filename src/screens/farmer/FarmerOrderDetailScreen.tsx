/**
 * FarmerOrderDetailScreen
 *
 * - Vertical status timeline (Placed → Accepted → Packed → Picked Up → Delivered)
 *   Current step: pulsing green ring (Reanimated)
 * - Order info card, items list, price breakdown
 * - Buyer info card with call button
 * - Action section that changes per status
 * - Confirmation bottom sheet via react-native-modal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from '../../utils/reanimatedStub';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors, OrderStatusColors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { OrderStatus, type Order, type OrderItem } from '../../types/order';
import type { FarmerScreenProps } from '../../types/navigation';
import AdvancedMapView from '../../components/map/AdvancedMapView';

// ─── Timeline config ──────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { status: OrderStatus.PENDING,   label: 'Placed',     icon: 'receipt-outline' },
  { status: OrderStatus.ACCEPTED,  label: 'Accepted',   icon: 'checkmark-circle-outline' },
  { status: OrderStatus.PACKED,    label: 'Packed',     icon: 'cube-outline' },
  { status: OrderStatus.PICKED_UP, label: 'Picked Up',  icon: 'bicycle-outline' },
  { status: OrderStatus.DELIVERED, label: 'Delivered',  icon: 'home-outline' },
];

const STATUS_ORDER = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PACKED,
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERED,
];

const stepIndex = (status: OrderStatus) =>
  STATUS_ORDER.indexOf(status);

// ─── Pulsing ring (Reanimated) ─────────────────────────────────────────────────

const PulsingRing: React.FC = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 700 }),
        withTiming(0.8, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View
      style={[
        {
          position: 'absolute',
          width: 34,
          height: 34,
          borderRadius: 17,
          borderWidth: 2.5,
          borderColor: Colors.primary,
        },
        style,
      ]}
    />
  );
};

// ─── Status timeline ──────────────────────────────────────────────────────────

const StatusTimeline: React.FC<{ status: OrderStatus; events: any[] }> = ({ status, events }) => {
  const current = stepIndex(status);

  const getTimestamp = (s: OrderStatus) => {
    const ev = events.find((e) => e.status === s);
    if (!ev) return '';
    const d = new Date(ev.timestamp);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <View style={timelineStyles.wrap}>
      {TIMELINE_STEPS.map((step, i) => {
        const done = current > i;
        const active = current === i;
        const future = current < i;

        return (
          <View key={step.status} style={timelineStyles.row}>
            {/* Line above (not for first) */}
            {i > 0 && (
              <View
                style={[
                  timelineStyles.line,
                  (done || active) && timelineStyles.lineDone,
                  future && timelineStyles.lineFuture,
                ]}
              />
            )}

            {/* Circle */}
            <View style={timelineStyles.circleWrap}>
              {active && <PulsingRing />}
              <View
                style={[
                  timelineStyles.circle,
                  done && timelineStyles.circleDone,
                  active && timelineStyles.circleActive,
                  future && timelineStyles.circleFuture,
                ]}
              >
                {done ? (
                  <Icon name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <Icon
                    name={step.icon}
                    size={14}
                    color={active ? Colors.white : Colors.textHint}
                  />
                )}
              </View>
            </View>

            {/* Label + timestamp */}
            <View style={timelineStyles.labelWrap}>
              <Text
                style={[
                  timelineStyles.label,
                  (done || active) && timelineStyles.labelActive,
                ]}
              >
                {step.label}
              </Text>
              {(done || active) && getTimestamp(step.status) ? (
                <Text style={timelineStyles.ts}>{getTimestamp(step.status)}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const timelineStyles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  line: {
    position: 'absolute',
    top: -20,
    left: 27,
    width: 2,
    height: 24,
    backgroundColor: Colors.primary,
  },
  lineDone: { backgroundColor: Colors.primary },
  lineFuture: { backgroundColor: Colors.border, borderStyle: 'dashed' },
  circleWrap: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  circleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  circleFuture: { borderStyle: 'dashed', borderColor: Colors.border },
  labelWrap: { flex: 1, justifyContent: 'center', paddingVertical: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textHint },
  labelActive: { color: Colors.textPrimary },
  ts: { fontSize: 11, color: Colors.textHint, marginTop: 2 },
});

// ─── Item row ─────────────────────────────────────────────────────────────────

const ItemRow: React.FC<{ item: OrderItem }> = ({ item }) => {
  const itemPrice = Number(
    item.total ??
    (item as any).subtotal ??
    (item as any).amount ??
    ((item.pricePerUnit ?? (item as any).unitPrice ?? (item as any).price ?? 0) * (item.quantity ?? 1))
  ) || 0;

  return (
    <View style={itemStyles.row}>
      <View style={itemStyles.icon}>
        <Icon name="leaf" size={20} color={Colors.primary} />
      </View>
      <View style={itemStyles.info}>
        <Text style={itemStyles.name}>{item.productName}</Text>
        <Text style={itemStyles.qty}>{item.quantity} {item.unit}</Text>
      </View>
      <Text style={itemStyles.price}>₹{itemPrice.toFixed(2)}</Text>
    </View>
  );
};

const itemStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  qty: { fontSize: 12, color: Colors.textSecondary },
  price: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
});

// ─── Action section ───────────────────────────────────────────────────────────

interface ActionSectionProps {
  order: Order;
  onAction: (action: string) => void;
}

const ActionSection: React.FC<ActionSectionProps> = ({ order, onAction }) => {
  const { status, deliveryAgentName } = order;
  return (
    <View style={actionStyles.wrap}>
      {status === OrderStatus.PENDING && (
        <View style={actionStyles.row}>
          <TouchableOpacity
            style={[actionStyles.btn, actionStyles.acceptBtn]}
            onPress={() => onAction('accept')}
          >
            <Icon name="checkmark-circle" size={18} color={Colors.white} />
            <Text style={actionStyles.btnTxt}>Accept Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[actionStyles.btn, actionStyles.declineBtn]}
            onPress={() => onAction('decline')}
          >
            <Text style={actionStyles.declineTxt}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      {status === OrderStatus.ACCEPTED && (
        <View>
          <View style={{ backgroundColor: Colors.info + '18', padding: 10, borderRadius: borderRadius.md, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="information-circle-outline" size={18} color={Colors.info} />
            <Text style={{ fontSize: 12, color: Colors.textSecondary, flex: 1 }}>
              Order is accepted! Please pack the items and tap 'Mark as Packed' so the delivery executive can pick up.
            </Text>
          </View>
          <TouchableOpacity
            style={[actionStyles.btn, actionStyles.packBtn]}
            onPress={() => onAction('pack')}
          >
            <Icon name="cube" size={18} color={Colors.white} />
            <Text style={actionStyles.btnTxt}>Mark as Packed</Text>
          </TouchableOpacity>
        </View>
      )}
      {status === OrderStatus.PACKED && (
        <View>
          <TouchableOpacity style={[actionStyles.btn, actionStyles.waitBtn]} disabled>
            <Icon name="time-outline" size={18} color={Colors.textHint} />
            <Text style={actionStyles.waitTxt}>Waiting for Pickup</Text>
          </TouchableOpacity>
          {deliveryAgentName && (
            <Text style={actionStyles.agentNote}>Agent: {deliveryAgentName}</Text>
          )}
        </View>
      )}
      {status === OrderStatus.DELIVERED && (
        <View style={actionStyles.completedWrap}>
          <Icon name="checkmark-done-circle" size={36} color={Colors.success} />
          <Text style={actionStyles.completedTxt}>Order Completed</Text>
        </View>
      )}
    </View>
  );
};

const actionStyles = StyleSheet.create({
  wrap: { padding: 20 },
  row: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    gap: 8,
    marginBottom: 4,
  },
  acceptBtn: { backgroundColor: Colors.success },
  packBtn: { backgroundColor: Colors.info },
  declineBtn: {
    flex: 0.5,
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: Colors.surface,
  },
  waitBtn: { backgroundColor: Colors.surfaceSecondary, borderWidth: 1, borderColor: Colors.border },
  btnTxt: { fontSize: 15, fontWeight: '700', color: Colors.white },
  declineTxt: { fontSize: 15, fontWeight: '700', color: Colors.error },
  waitTxt: { fontSize: 14, fontWeight: '600', color: Colors.textHint },
  agentNote: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  completedWrap: { alignItems: 'center', gap: 8 },
  completedTxt: { fontSize: 16, fontWeight: '700', color: Colors.success },
});

// ─── Confirmation modal ───────────────────────────────────────────────────────

interface ConfirmProps {
  visible: boolean;
  action: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmProps> = ({ visible, action, onConfirm, onCancel }) => {
  const messages: Record<string, { title: string; body: string }> = {
    accept:  { title: 'Accept order?', body: 'You commit to preparing this order.' },
    decline: { title: 'Decline order?', body: 'The buyer will be notified of the cancellation.' },
    pack:    { title: 'Mark as packed?', body: 'This notifies the delivery team to pick up the order.' },
  };
  const cfg = messages[action] ?? messages.accept;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onCancel}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={{ justifyContent: 'flex-end', margin: 0 }}
    >
      <View style={cmStyles.sheet}>
        <View style={cmStyles.handle} />
        <Text style={cmStyles.title}>{cfg.title}</Text>
        <Text style={cmStyles.body}>{cfg.body}</Text>
        <TouchableOpacity style={cmStyles.confirm} onPress={onConfirm}>
          <Text style={cmStyles.confirmTxt}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cmStyles.cancel} onPress={onCancel}>
          <Text style={cmStyles.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const cmStyles = StyleSheet.create({
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 24 },
  confirm: { backgroundColor: Colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  confirmTxt: { fontSize: 16, fontWeight: '700', color: Colors.white },
  cancel: { alignItems: 'center', paddingVertical: 10 },
  cancelTxt: { fontSize: 15, color: Colors.textSecondary },
});

// ─── Main component ───────────────────────────────────────────────────────────

type Props = FarmerScreenProps<'FarmerOrderDetail'>;

const FarmerOrderDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route?.params ?? {};
  const orderId = params.orderId;
  const initialData = (params as any)?.initialOrder ?? (params as any)?.order ?? null;
  const [order, setOrder] = useState<Order | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modal, setModal] = useState({ visible: false, action: '' });

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadOrderDetails = useCallback(() => {
    if (!orderId) return;
    setErrorMsg(null);
    ordersApi.getFarmerOrderById(orderId)
      .then((res) => {
        const fetched = (res as any).data ?? res;
        if (fetched) setOrder(fetched);
      })
      .catch((err) => {
        console.log('FarmerOrderDetail error:', err?.response?.status, err?.response?.data);
        if (!initialData) {
          setErrorMsg(err?.response?.data?.message ?? err?.message ?? 'Failed to load order details');
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      if (orderId) {
        loadOrderDetails();
      }
    }, [orderId, loadOrderDetails])
  );

  // ── Action ──────────────────────────────────────────────────────────────────

  const handleAction = (action: string) => setModal({ visible: true, action });

  const confirmAction = async () => {
    const { action } = modal;
    setModal({ visible: false, action: '' });
    try {
      if (action === 'accept') {
        await ordersApi.accept(orderId);
        Toast.show({ type: 'success', text1: 'Order accepted ✓' });
      } else if (action === 'pack') {
        await ordersApi.markPacked(orderId);
        Toast.show({ type: 'success', text1: 'Marked as packed ✓' });
      }
      const res = await ordersApi.getFarmerOrderById(orderId);
      setOrder((res as any).data ?? res);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Action failed', text2: e?.message });
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loader}>
        <Icon name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 12 }}>
          {errorMsg || 'Order details unavailable'}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadOrderDetails}>
          <Text style={styles.retryTxt}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullBuyerPhone = order.buyerPhone
    ? (order.buyerPhone.startsWith('+91') ? order.buyerPhone : `+91 ${order.buyerPhone}`)
    : 'No phone number provided';

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            (navigation as any).navigate('FarmerTabs', { screen: 'OrdersTab' });
          }
        }}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber || order.id?.slice(-6)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          <StatusTimeline status={order.status} events={order.trackingEvents ?? []} />
        </View>

        {/* Live Delivery Route Map */}
        <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 16, paddingTop: 14 }]}>Live Delivery Route</Text>
          <AdvancedMapView
            mode="tracking"
            style={{ width: '100%', height: 200 }}
            pickupLocation={{
              latitude: order.items?.[0]?.farmerLat || 13.085,
              longitude: order.items?.[0]?.farmerLng || 80.265,
              title: 'Your Farm'
            }}
            dropoffLocation={{
              latitude: typeof order.deliveryAddress === 'object' ? order.deliveryAddress.lat || 13.078 : 13.078,
              longitude: typeof order.deliveryAddress === 'object' ? order.deliveryAddress.lng || 80.28 : 80.28,
              title: order.buyerName || 'Buyer Location'
            }}
            driverLocation={{
              latitude: (order as any)?.driverLat || 13.082,
              longitude: (order as any)?.driverLng || 80.272
            }}
            vehicleType={(order as any)?.requiredVehicleType || 'BIKE'}
            theme="green"
            showControls={false}
          />
        </View>

        {/* Order info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <InfoRow label="Order ID" value={`#${order.orderNumber || order.id}`} />
          <InfoRow label="Placed On" value={new Date(order.createdAt).toLocaleString('en-IN')} />
          <InfoRow label="Payment Method" value={order.paymentMethod || 'COD'} />
          <InfoRow label="Payment Status" value={order.paymentStatus || 'PENDING'} />
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items Ordered ({order.items?.length || 0})</Text>
          {order.items?.map((item) => (
            <ItemRow key={item.id || item.productId} item={item} />
          ))}
        </View>

        {/* Price breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <PriceRow label="Items total" amount={order.totalAmount} />
          <PriceRow label="Delivery fee" amount={order.deliveryFee} />
          {(Number(order.discount) || 0) > 0 && (
            <PriceRow label="Discount" amount={-(Number(order.discount) || 0)} />
          )}
          <View style={styles.greenDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalAmount}>₹{(Number(order.grandTotal ?? order.totalAmount) || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Buyer info (Enhanced for Farmer) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Buyer Details</Text>
          <View style={styles.buyerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(order.buyerName ?? 'B').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.buyerInfo}>
              <Text style={styles.buyerName}>{order.buyerName ?? 'Customer'}</Text>
              <Text style={styles.buyerPhone}>{fullBuyerPhone}</Text>
            </View>
            {order.buyerPhone ? (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${order.buyerPhone}`)}
              >
                <Icon name="call" size={18} color={Colors.white} />
                <Text style={styles.callTxt}>Call Buyer</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.addressRow}>
            <Icon name="location-outline" size={18} color={Colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.addressTxt}>
              {typeof order.deliveryAddress === 'string'
                ? order.deliveryAddress
                : [
                    (order.deliveryAddress as any)?.line1,
                    (order.deliveryAddress as any)?.line2,
                    (order.deliveryAddress as any)?.city,
                    (order.deliveryAddress as any)?.state,
                    (order.deliveryAddress as any)?.pincode,
                  ].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>

        {/* Delivery agent info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Partner Details</Text>
          {(order.deliveryAgentName || order.deliveryAgentId || (order as any).deliveryAgentPhone) ? (
            <View style={styles.buyerRow}>
              <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                <Icon name="bicycle" size={20} color={Colors.white} />
              </View>
              <View style={styles.buyerInfo}>
                <Text style={styles.buyerName}>{order.deliveryAgentName ?? 'Delivery Executive'}</Text>
                <Text style={styles.buyerPhone}>
                  {(order.status as string) === 'ASSIGNED' ? '🟡 Partner Assigned' :
                   (order.status as string) === 'PICKED_UP' ? '🚴 Picked Up from Farm' :
                   (order.status as string) === 'IN_TRANSIT' || (order.status as string) === 'ON_THE_WAY' ? '🚀 On the Way to Buyer' :
                   (order.status as string) === 'DELIVERED' ? '✅ Delivered to Buyer' : order.status}
                </Text>
              </View>
              {(order as any).deliveryAgentPhone ? (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${(order as any).deliveryAgentPhone}`)}
                >
                  <Icon name="call" size={18} color={Colors.white} />
                  <Text style={styles.callTxt}>Call Agent</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
              <Icon name="time-outline" size={22} color={Colors.warning} />
              <Text style={{ fontSize: 13, color: Colors.textSecondary, flex: 1 }}>
                Searching for nearest delivery executive. Partner will be assigned automatically after packing.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action section pinned at bottom */}
      <View style={styles.actionBar}>
        <ActionSection order={order} onAction={handleAction} />
      </View>

      <ConfirmModal
        visible={modal.visible}
        action={modal.action}
        onConfirm={confirmAction}
        onCancel={() => setModal({ visible: false, action: '' })}
      />
    </View>
  );
};

// ─── Helper components ────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={infoStyles.row}>
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={infoStyles.value}>{value}</Text>
  </View>
);

const PriceRow: React.FC<{ label: string; amount: number }> = ({ label, amount }) => {
  const val = Number(amount) || 0;
  return (
    <View style={priceStyles.row}>
      <Text style={priceStyles.label}>{label}</Text>
      <Text style={[priceStyles.amount, val < 0 && priceStyles.discount]}>
        {val < 0 ? '-' : ''}₹{Math.abs(val).toFixed(2)}
      </Text>
    </View>
  );
};

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  label: { fontSize: 13, color: Colors.textSecondary },
  value: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
});

const priceStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 14, color: Colors.textSecondary },
  amount: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  discount: { color: Colors.success },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: borderRadius.md },
  retryTxt: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    ...shadow.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 16, paddingBottom: 120 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  greenDivider: { height: 2, backgroundColor: Colors.primary, marginVertical: 10, borderRadius: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  totalAmount: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.white },
  buyerInfo: { flex: 1 },
  buyerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  buyerPhone: { fontSize: 13, color: Colors.textSecondary },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  callTxt: { fontSize: 13, fontWeight: '700', color: Colors.white },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  addressTxt: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    ...shadow.lg,
  },
});

export default FarmerOrderDetailScreen;
