// FILE: src/screens/buyer/OrderDetailScreen.tsx
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

import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import type { Order, OrderItem } from '../../types/order';
import type { BuyerStackParamList } from '../../types/navigation';

type RouteP = RouteProp<BuyerStackParamList, 'OrderDetail'>;
type NavP   = NativeStackNavigationProp<BuyerStackParamList>;

// ─── Timeline config ──────────────────────────────────────────────────────────

const STEPS = [
  { key: 'PENDING',   label: 'Placed',     icon: 'receipt-outline' },
  { key: 'ACCEPTED',  label: 'Accepted',   icon: 'checkmark-circle-outline' },
  { key: 'PACKED',    label: 'Packed',     icon: 'cube-outline' },
  { key: 'PICKED_UP', label: 'Picked Up',  icon: 'bicycle-outline' },
  { key: 'IN_TRANSIT',label: 'On the Way', icon: 'car-outline' },
  { key: 'DELIVERED', label: 'Delivered',  icon: 'home-outline' },
];

const STATUS_ORDER = STEPS.map(s => s.key);

function getStepIndex(status: string): number {
  const upper = status?.toUpperCase() ?? '';
  // Aliases
  if (upper === 'ON_THE_WAY' || upper === 'DISPATCHED') return STATUS_ORDER.indexOf('IN_TRANSIT');
  if (upper === 'COMPLETED') return STATUS_ORDER.indexOf('DELIVERED');
  const idx = STATUS_ORDER.indexOf(upper);
  return idx === -1 ? 0 : idx;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Order Placed', PAID: 'Paid', ACCEPTED: 'Accepted',
    PACKED: 'Packed', PICKED_UP: 'Picked Up', IN_TRANSIT: 'In Transit',
    ON_THE_WAY: 'On The Way', DISPATCHED: 'On The Way',
    DELIVERED: 'Delivered', COMPLETED: 'Delivered',
    CANCELLED: 'Cancelled', REJECTED: 'Rejected', REFUNDED: 'Refunded',
  };
  return labels[status?.toUpperCase()] ?? status;
}

function getStatusColors(status: string): { color: string; bg: string } {
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

function formatDate(val: any): string {
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

function unwrapOrder(res: any): Order | null {
  if (!res) return null;
  if (res.id || res._id) return res;
  if (res.data?.id || res.data?._id) return res.data;
  return null;
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; onChange: (r: number) => void }> = ({ rating, onChange }) => (
  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
    {[1, 2, 3, 4, 5].map(star => (
      <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
        <Icon name={star <= rating ? 'star' : 'star-outline'} size={30} color="#FFC107" />
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const route      = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const orderId    = route.params?.orderId;
  const initial    = (route.params as any)?.initialOrder ?? (route.params as any)?.order ?? null;

  const [order, setOrder]     = useState<Order | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [rating, setRating]   = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    try {
      const res: any = await ordersApi.getOrderById(orderId);
      const fetched = unwrapOrder(res);
      if (fetched) setOrder(fetched);
    } catch (e: any) {
      if (!initial) Alert.alert('Error', e?.message ?? 'Could not load order');
    } finally {
      setLoading(false);
    }
  }, [orderId, initial]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try { await ordersApi.cancel(orderId!); await load(); }
        catch (e: any) { Alert.alert('Error', e?.message ?? 'Could not cancel'); }
      }},
    ]);
  };

  const handleRateSubmit = async () => {
    if (!rating || !orderId) return;
    setSubmittingRating(true);
    try {
      await ordersApi.rateOrder(orderId, rating);
      setRatingDone(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading && !order) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingText}>Loading order details…</Text>
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
  const stepIndex   = getStepIndex(status);
  const { color, bg } = getStatusColors(status);
  const statusLabel = getStatusLabel(status);
  const isCancelled = status === 'CANCELLED' || status === 'REJECTED';
  const isDelivered = status === 'DELIVERED' || status === 'COMPLETED';
  const canCancel   = ['PENDING', 'ACCEPTED', 'PAID'].includes(status);

  const addr = typeof order.deliveryAddress === 'object' ? order.deliveryAddress : null;
  const addrText = addr
    ? [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
    : (order.deliveryAddress as string) ?? '';

  const grandTotal = (order as any).grandTotal ?? order.totalAmount ?? 0;
  const subTotal   = order.items?.reduce((s, it) => s + (it.total ?? 0), 0) ?? grandTotal;
  const delivery   = order.deliveryFee ?? 0;
  const discount   = order.discount ?? 0;

  const farmerName  = order.items?.[0]?.farmerName ?? null;
  const farmerPhone = (order as any).farmerPhone ?? null;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BuyerTabs' as any)} style={s.backIcon}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Order ID + Status */}
        <View style={s.card}>
          <Text style={s.sectionSmall}>
            order #{order.orderNumber ?? (order.id ?? '').slice(-8).toUpperCase()}
          </Text>
          <View style={s.titleRow}>
            <Text style={s.orderTitle}>Order Details</Text>
            <View style={[s.statusPill, { backgroundColor: bg }]}>
              <Text style={[s.statusPillText, { color }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={s.dateText}>{formatDate(order.createdAt)}</Text>
        </View>

        {/* Timeline */}
        {!isCancelled && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Order Timeline</Text>
            <View style={s.timeline}>
              {STEPS.map((step, i) => {
                const done    = i <= stepIndex;
                const current = i === stepIndex;
                const last    = i === STEPS.length - 1;
                return (
                  <View key={step.key} style={s.stepRow}>
                    {/* Icon column */}
                    <View style={s.stepIconCol}>
                      <View style={[s.stepCircle, done && s.stepCircleDone, current && s.stepCircleCurrent]}>
                        <Icon
                          name={done ? 'checkmark' : step.icon}
                          size={14}
                          color={done || current ? Colors.white : Colors.textHint}
                        />
                      </View>
                      {!last && <View style={[s.stepLine, done && s.stepLineDone]} />}
                    </View>
                    {/* Label */}
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
          <Text style={s.sectionTitle}>Items</Text>
          {(order.items ?? []).map((item: OrderItem, idx) => (
            <View key={idx} style={[s.itemRow, idx > 0 && { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 10 }]}>
              <View style={s.itemIconBox}>
                <Icon name="leaf-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.productName}</Text>
                <Text style={s.itemQty}>{item.quantity} × ₹{item.pricePerUnit} / {item.unit ?? 'unit'}</Text>
              </View>
              <Text style={s.itemTotal}>₹{(item.total ?? 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Price Breakdown</Text>
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
            <Text style={s.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Payment</Text>
            <Text style={s.priceValue}>{((order.paymentMethod as string) ?? 'COD').replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        {!!addrText && (
          <View style={s.card}>
            <View style={s.infoRow}>
              <Icon name="location-outline" size={20} color={Colors.primary} />
              <Text style={s.sectionTitle}>Delivery Address</Text>
            </View>
            <Text style={s.infoValue}>{addrText}</Text>
          </View>
        )}

        {/* Farmer Info */}
        {!!farmerName && (
          <View style={s.card}>
            <View style={s.infoRow}>
              <Icon name="person-circle-outline" size={20} color={Colors.primary} />
              <Text style={s.sectionTitle}>Farmer</Text>
            </View>
            <View style={s.farmerRow}>
              <View style={s.farmerAvatar}>
                <Text style={s.farmerAvatarText}>{farmerName[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.farmerName}>{farmerName}</Text>
                {farmerPhone && <Text style={s.farmerPhone}>{farmerPhone}</Text>}
              </View>
              {farmerPhone && (
                <TouchableOpacity
                  style={s.callBtn}
                  onPress={() => Linking.openURL(`tel:${farmerPhone}`)}
                >
                  <Icon name="call-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Rate This Order */}
        {isDelivered && (
          <View style={s.card}>
            <View style={s.infoRow}>
              <Icon name="star-outline" size={20} color="#FFC107" />
              <Text style={s.sectionTitle}>Rate this order</Text>
            </View>
            {ratingDone ? (
              <View style={s.ratingDone}>
                <Icon name="checkmark-circle" size={28} color={Colors.success} />
                <Text style={s.ratingDoneText}>Thank you for your rating!</Text>
              </View>
            ) : (
              <>
                <StarRating rating={rating} onChange={setRating} />
                <TouchableOpacity
                  style={[s.submitRatingBtn, !rating && s.submitRatingBtnDisabled]}
                  onPress={handleRateSubmit}
                  disabled={!rating || submittingRating}
                >
                  {submittingRating
                    ? <ActivityIndicator size="small" color={Colors.white} />
                    : <Text style={s.submitRatingText}>Submit Rating</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Cancel button */}
        {canCancel && (
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
            <Icon name="close-circle-outline" size={18} color={Colors.error} />
            <Text style={s.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 52,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...shadow.sm,
  },
  backIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
  },

  sectionSmall: { fontSize: 11, color: Colors.textHint, fontWeight: '500', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  orderTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 12, color: Colors.textSecondary },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoValue: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  // Timeline
  timeline: { paddingLeft: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  stepIconCol: { alignItems: 'center', width: 32, marginRight: 12 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleDone: { backgroundColor: Colors.primary },
  stepCircleCurrent: { backgroundColor: Colors.primary },
  stepLine: { width: 2, height: 28, backgroundColor: Colors.border, marginVertical: 2 },
  stepLineDone: { backgroundColor: Colors.primary },
  stepLabel: { fontSize: 13, color: Colors.textHint, paddingTop: 6, paddingBottom: 22, fontWeight: '500' },
  stepLabelDone: { color: Colors.textSecondary },
  stepLabelCurrent: { color: Colors.primary, fontWeight: '700' },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  itemIconBox: { width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  itemQty: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  priceValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },

  // Farmer
  farmerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  farmerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  farmerAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  farmerName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  farmerPhone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },

  // Rating
  ratingDone: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  ratingDoneText: { fontSize: 14, fontWeight: '600', color: Colors.success },
  submitRatingBtn: {
    marginTop: 12, backgroundColor: Colors.primary,
    paddingVertical: 12, borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitRatingBtnDisabled: { backgroundColor: Colors.border },
  submitRatingText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Cancel
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: Colors.error,
    backgroundColor: Colors.errorLight, marginBottom: 12,
  },
  cancelBtnText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
});
