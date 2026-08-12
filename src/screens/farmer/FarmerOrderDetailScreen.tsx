// FILE: src/screens/farmer/FarmerOrderDetailScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { OrderStatus, type Order, type OrderItem } from '../../types/order';
import type { FarmerStackParamList } from '../../types/navigation';

type RouteP = RouteProp<FarmerStackParamList, 'FarmerOrderDetail'>;
type NavP   = NativeStackNavigationProp<FarmerStackParamList>;

// ─── Timeline steps ───────────────────────────────────────────────────────────

const STEPS = [
  { key: 'PENDING',   label: 'Order Placed',  icon: 'receipt-outline' },
  { key: 'ACCEPTED',  label: 'Accepted',      icon: 'checkmark-circle-outline' },
  { key: 'PACKED',    label: 'Packed',        icon: 'cube-outline' },
  { key: 'PICKED_UP', label: 'Picked Up',     icon: 'bicycle-outline' },
  { key: 'IN_TRANSIT',label: 'In Transit',    icon: 'car-outline' },
  { key: 'DELIVERED', label: 'Delivered',     icon: 'home-outline' },
];

const STATUS_ORDER = STEPS.map(s => s.key);

function getStepIndex(status: string): number {
  const upper = status?.toUpperCase() ?? '';
  if (upper === 'ON_THE_WAY' || upper === 'DISPATCHED') return STATUS_ORDER.indexOf('IN_TRANSIT');
  if (upper === 'COMPLETED') return STATUS_ORDER.indexOf('DELIVERED');
  const idx = STATUS_ORDER.indexOf(upper);
  return idx === -1 ? 0 : idx;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending', ACCEPTED: 'Accepted', PACKED: 'Packed',
    PICKED_UP: 'Picked Up', IN_TRANSIT: 'In Transit', ON_THE_WAY: 'On The Way',
    DISPATCHED: 'On The Way', DELIVERED: 'Delivered', COMPLETED: 'Delivered',
    CANCELLED: 'Cancelled', REJECTED: 'Rejected',
  };
  return labels[status?.toUpperCase()] ?? status;
}

function getStatusColors(status: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    PENDING:   { color: '#E65100', bg: '#FFF3E0' },
    ACCEPTED:  { color: '#0277BD', bg: '#E1F5FE' },
    PACKED:    { color: '#6A1B9A', bg: '#F3E5F5' },
    PICKED_UP: { color: '#00838F', bg: '#E0F7FA' },
    IN_TRANSIT:{ color: '#1565C0', bg: '#E3F2FD' },
    ON_THE_WAY:{ color: '#1565C0', bg: '#E3F2FD' },
    DISPATCHED:{ color: '#1565C0', bg: '#E3F2FD' },
    DELIVERED: { color: '#2E7D32', bg: '#E8F5E9' },
    COMPLETED: { color: '#2E7D32', bg: '#E8F5E9' },
    CANCELLED: { color: '#C62828', bg: '#FFEBEE' },
    REJECTED:  { color: '#C62828', bg: '#FFEBEE' },
  };
  return map[status?.toUpperCase()] ?? { color: Colors.textSecondary, bg: Colors.border };
}

function formatDate(val: any): string {
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function unwrapOrder(res: any): Order | null {
  if (!res) return null;
  if (res.id || res._id) return res;
  if (res.data?.id || res.data?._id) return res.data;
  return null;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FarmerOrderDetailScreen() {
  const route      = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const orderId    = route.params?.orderId;
  const initial    = (route.params as any)?.initialOrder ?? (route.params as any)?.order ?? null;

  const [order, setOrder]         = useState<Order | null>(initial);
  const [loading, setLoading]     = useState(!initial);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    try {
      const res: any = await ordersApi.getFarmerOrderById(orderId);
      const fetched  = unwrapOrder(res);
      if (fetched) setOrder(fetched);
    } catch (e: any) {
      if (!initial) Alert.alert('Error', e?.message ?? 'Could not load order');
    } finally {
      setLoading(false);
    }
  }, [orderId, initial]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAccept = async () => {
    if (!orderId) return;
    setActionLoading(true);
    try {
      await ordersApi.accept(orderId);
      Toast.show({ type: 'success', text1: 'Order Accepted!', text2: 'Prepare the items for packing.' });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not accept order');
    } finally { setActionLoading(false); }
  };

  const handlePack = async () => {
    if (!orderId) return;
    setActionLoading(true);
    try {
      await ordersApi.markPacked(orderId);
      Toast.show({ type: 'success', text1: 'Marked as Packed!', text2: 'Awaiting delivery agent pickup.' });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not mark as packed');
    } finally { setActionLoading(false); }
  };

  const handleDecline = () => {
    Alert.alert('Decline Order', 'Are you sure you want to decline this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => {
        if (!orderId) return;
        setActionLoading(true);
        try {
          await ordersApi.cancel(orderId, 'Farmer declined');
          Toast.show({ type: 'info', text1: 'Order Declined' });
          navigation.goBack();
        } catch (e: any) {
          Alert.alert('Error', e?.message ?? 'Could not decline');
        } finally { setActionLoading(false); }
      }},
    ]);
  };

  if (loading && !order) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingText}>Loading order…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={s.center}>
        <Icon name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={s.errorText}>Order not found</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status      = (order.status as string)?.toUpperCase() ?? 'PENDING';
  const stepIdx     = getStepIndex(status);
  const { color, bg } = getStatusColors(status);
  const isCancelled = status === 'CANCELLED' || status === 'REJECTED';
  const isPending   = status === 'PENDING';
  const isAccepted  = status === 'ACCEPTED';

  const amount    = (order as any).grandTotal ?? order.totalAmount ?? 0;
  const subTotal  = order.items?.reduce((acc, it) => acc + (it.total ?? 0), 0) ?? amount;
  const delivery  = order.deliveryFee ?? 0;
  const discount  = order.discount ?? 0;

  const addr = typeof order.deliveryAddress === 'object' ? order.deliveryAddress : null;
  const addrText = addr
    ? [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
    : (order.deliveryAddress as string) ?? '';

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backIcon}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Order ID + Status */}
        <View style={s.card}>
          <Text style={s.labelSmall}>
            order #{order.orderNumber ?? ((order as any).id ?? '').slice(-8).toUpperCase()}
          </Text>
          <View style={s.titleRow}>
            <Text style={s.cardTitle}>Order Summary</Text>
            <View style={[s.statusPill, { backgroundColor: bg }]}>
              <Text style={[s.statusPillText, { color }]}>{getStatusLabel(status)}</Text>
            </View>
          </View>
          <Text style={s.dateText}>Placed on {formatDate(order.createdAt)}</Text>
        </View>

        {/* Buyer Info */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Icon name="person-outline" size={18} color={Colors.primary} />
            <Text style={s.sectionTitle}>Buyer Details</Text>
          </View>
          <View style={s.buyerRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(order.buyerName ?? 'C')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.buyerName}>{order.buyerName ?? 'Customer'}</Text>
              {order.buyerPhone && <Text style={s.buyerPhone}>{order.buyerPhone}</Text>}
            </View>
            {order.buyerPhone && (
              <TouchableOpacity
                style={s.callBtn}
                onPress={() => Linking.openURL(`tel:${order.buyerPhone}`)}
              >
                <Icon name="call-outline" size={18} color={Colors.primary} />
                <Text style={s.callBtnText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Timeline */}
        {!isCancelled && (
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Icon name="git-branch-outline" size={18} color={Colors.primary} />
              <Text style={s.sectionTitle}>Order Timeline</Text>
            </View>
            <View style={s.timeline}>
              {STEPS.map((step, i) => {
                const done    = i <= stepIdx;
                const current = i === stepIdx;
                const last    = i === STEPS.length - 1;
                return (
                  <View key={step.key} style={s.stepRow}>
                    <View style={s.stepLeft}>
                      <View style={[s.stepCircle, done && s.stepDone, current && s.stepCurrent]}>
                        <Icon
                          name={done ? 'checkmark' : step.icon}
                          size={13}
                          color={done || current ? Colors.white : Colors.textHint}
                        />
                      </View>
                      {!last && <View style={[s.stepLine, done && s.stepLineDone]} />}
                    </View>
                    <Text style={[s.stepLabel, done && s.stepLabelDone, current && s.stepLabelCurrent]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Items */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Icon name="basket-outline" size={18} color={Colors.primary} />
            <Text style={s.sectionTitle}>Order Items</Text>
          </View>
          {(order.items ?? []).map((item: OrderItem, idx) => (
            <View
              key={idx}
              style={[s.itemRow, idx > 0 && { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 10, marginTop: 2 }]}
            >
              <View style={s.itemIcon}>
                <Icon name="leaf-outline" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.productName}</Text>
                <Text style={s.itemQty}>
                  {item.quantity} {item.unit ?? 'unit'} × ₹{item.pricePerUnit}
                </Text>
              </View>
              <Text style={s.itemTotal}>₹{(item.total ?? 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Icon name="receipt-outline" size={18} color={Colors.primary} />
            <Text style={s.sectionTitle}>Price Breakdown</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Subtotal</Text>
            <Text style={s.priceValue}>₹{subTotal.toFixed(2)}</Text>
          </View>
          {delivery > 0 && (
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Delivery Fee</Text>
              <Text style={s.priceValue}>₹{delivery.toFixed(2)}</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Discount</Text>
              <Text style={[s.priceValue, { color: Colors.success }]}>-₹{discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[s.priceRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>₹{amount.toFixed(2)}</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Payment Method</Text>
            <View style={[s.payBadge, { backgroundColor: order.paymentStatus === 'PAID' ? Colors.successLight : Colors.warningLight }]}>
              <Text style={[s.payBadgeText, { color: order.paymentStatus === 'PAID' ? Colors.success : Colors.warning }]}>
                {((order.paymentMethod as string) ?? 'COD').replace('_', ' ')} · {order.paymentStatus ?? 'PENDING'}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        {!!addrText && (
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Icon name="location-outline" size={18} color={Colors.primary} />
              <Text style={s.sectionTitle}>Delivery Address</Text>
            </View>
            <Text style={s.addrText}>{addrText}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {isPending && (
          <View style={s.actionSection}>
            <TouchableOpacity
              style={[s.actionBtn, s.acceptBtn, actionLoading && s.btnDisabled]}
              onPress={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <>
                    <Icon name="checkmark-circle-outline" size={18} color={Colors.white} />
                    <Text style={s.actionBtnText}>Accept Order</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.declineBtn, actionLoading && s.btnDisabled]}
              onPress={handleDecline}
              disabled={actionLoading}
            >
              <Icon name="close-circle-outline" size={18} color={Colors.white} />
              <Text style={s.actionBtnText}>Decline Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <View style={s.actionSection}>
            <TouchableOpacity
              style={[s.actionBtn, s.packBtn, actionLoading && s.btnDisabled]}
              onPress={handlePack}
              disabled={actionLoading}
            >
              {actionLoading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <>
                    <Icon name="cube-outline" size={18} color={Colors.white} />
                    <Text style={s.actionBtnText}>Mark as Packed</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
  errorText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  backBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: borderRadius.md },
  backBtnText: { color: Colors.white, fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 52,
    paddingBottom: 12, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    ...shadow.sm,
  },
  backIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    padding: 16, marginBottom: 12,
    ...shadow.sm,
  },

  labelSmall: { fontSize: 11, color: Colors.textHint, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 12, color: Colors.textSecondary },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  // Buyer
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  buyerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  buyerPhone: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.primaryMuted, borderRadius: borderRadius.full,
  },
  callBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Timeline
  timeline: { paddingLeft: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  stepLeft: { alignItems: 'center', width: 30, marginRight: 12 },
  stepCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDone: { backgroundColor: Colors.primary },
  stepCurrent: { backgroundColor: Colors.primary },
  stepLine: { width: 2, height: 26, backgroundColor: Colors.border, marginVertical: 2 },
  stepLineDone: { backgroundColor: Colors.primary },
  stepLabel: { fontSize: 13, color: Colors.textHint, paddingTop: 5, paddingBottom: 20, fontWeight: '500', flex: 1 },
  stepLabelDone: { color: Colors.textSecondary },
  stepLabelCurrent: { color: Colors.primary, fontWeight: '700' },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  itemIcon: {
    width: 38, height: 38, borderRadius: borderRadius.md,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  itemQty: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  priceValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  payBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full },
  payBadgeText: { fontSize: 12, fontWeight: '600' },

  addrText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  // Actions
  actionSection: { gap: 10, marginBottom: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: borderRadius.lg,
  },
  acceptBtn: { backgroundColor: Colors.success },
  declineBtn: { backgroundColor: Colors.error },
  packBtn:   { backgroundColor: Colors.primaryLight },
  btnDisabled: { opacity: 0.6 },
  actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
