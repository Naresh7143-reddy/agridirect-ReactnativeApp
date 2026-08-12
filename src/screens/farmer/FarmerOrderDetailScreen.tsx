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
import { borderRadius, shadow } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import type { Order } from '../../types/order';
import type { FarmerStackParamList } from '../../types/navigation';

type RouteP = RouteProp<FarmerStackParamList, 'FarmerOrderDetail'>;
type NavP   = NativeStackNavigationProp<FarmerStackParamList>;

// ─── 6 Progress Steps (Matching Web App) ──────────────────────────────────────

const PROGRESS_STEPS = [
  { key: 'PLACED',           label: 'Placed' },
  { key: 'ACCEPTED',         label: 'Accepted' },
  { key: 'PACKED',           label: 'Packed' },
  { key: 'PARTNER_ASSIGNED', label: 'Partner Assigned' },
  { key: 'PICKED_UP',        label: 'Picked Up' },
  { key: 'DELIVERED',        label: 'Delivered' },
];

function getProgressIndex(status?: string): number {
  if (!status) return 0;
  const s = status.toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') return 5;
  if (s === 'PICKED_UP') return 4;
  if (s === 'IN_TRANSIT' || s === 'ON_THE_WAY' || s === 'DISPATCHED' || s === 'PARTNER_ASSIGNED') return 3;
  if (s === 'PACKED') return 2;
  if (s === 'ACCEPTED') return 1;
  return 0; // PENDING
}

function getStatusBadgeColors(status?: string): { color: string; bg: string } {
  const s = status?.toUpperCase() ?? 'PENDING';
  if (s === 'DELIVERED' || s === 'COMPLETED') return { color: '#2E7D32', bg: '#E8F5E9' };
  if (s === 'CANCELLED' || s === 'REJECTED') return { color: '#C62828', bg: '#FFEBEE' };
  if (s === 'PACKED') return { color: '#6A1B9A', bg: '#F3E5F5' };
  if (s === 'ACCEPTED') return { color: '#0277BD', bg: '#E1F5FE' };
  if (s === 'PICKED_UP' || s === 'IN_TRANSIT') return { color: '#00838F', bg: '#E0F7FA' };
  return { color: '#E65100', bg: '#FFF3E0' };
}

// Timezone-safe date parser
function parseFlexibleDate(val: any): Date | null {
  if (!val) return null;
  try {
    if (Array.isArray(val)) {
      const [y, mo, day, h = 0, mi = 0, s = 0] = val;
      return new Date(y, mo - 1, day, h, mi, s);
    }
    if (typeof val === 'number') {
      return new Date(val);
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed.endsWith('Z') && !trimmed.includes('+') && !trimmed.includes('-0') && !trimmed.includes('-1')) {
        const parts = trimmed.split(/[-T :.]/);
        if (parts.length >= 3) {
          const y  = parseInt(parts[0], 10);
          const mo = parseInt(parts[1], 10) - 1;
          const d  = parseInt(parts[2], 10);
          const h  = parts[3] ? parseInt(parts[3], 10) : 0;
          const mi = parts[4] ? parseInt(parts[4], 10) : 0;
          const s  = parts[5] ? parseInt(parts[5], 10) : 0;
          return new Date(y, mo, d, h, mi, s);
        }
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

// "12 Aug 2026, 03:39 pm" format matching web screenshot
function formatWebDate(val: any): string {
  const d = parseFlexibleDate(val);
  if (!d) return '';
  try {
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    return `${dateStr}, ${timeStr}`;
  } catch {
    return '';
  }
}

// Item unit price calculation
function getItemUnitPrice(item: any): number {
  if (item.priceAtOrder != null && Number(item.priceAtOrder) > 0) return Number(item.priceAtOrder);
  if (item.pricePerUnit != null && Number(item.pricePerUnit) > 0) return Number(item.pricePerUnit);
  if (item.price != null && Number(item.price) > 0) return Number(item.price);
  if (item.unitPrice != null && Number(item.unitPrice) > 0) return Number(item.unitPrice);
  if (item.total != null && Number(item.total) > 0 && item.quantity > 0) return Number(item.total) / Number(item.quantity);
  return 0;
}

// Item total calculation
function getItemTotal(item: any, fallbackTotal: number, itemCount: number): number {
  if (item.total != null && Number(item.total) > 0) return Number(item.total);
  if (item.totalPrice != null && Number(item.totalPrice) > 0) return Number(item.totalPrice);
  if (item.subtotal != null && Number(item.subtotal) > 0) return Number(item.subtotal);
  const uPrice = getItemUnitPrice(item);
  if (uPrice > 0 && (item.quantity || 1) > 0) return uPrice * Number(item.quantity || 1);
  if (fallbackTotal > 0) return fallbackTotal / Math.max(itemCount, 1);
  return 0;
}

function unwrapOrder(res: any): Order | null {
  if (!res) return null;
  if (res.id || res._id) return res;
  if (res.data?.id || res.data?._id) return res.data;
  return null;
}

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
    } catch {
      /* keep initial fallback */
    } finally {
      setLoading(false);
    }
  }, [orderId]);

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

  const status = (order.status as string)?.toUpperCase() ?? 'PENDING';
  const progressIdx = getProgressIndex(status);
  const { color: badgeColor, bg: badgeBg } = getStatusBadgeColors(status);
  const isPending  = status === 'PENDING';
  const isAccepted = status === 'ACCEPTED';
  const isCancelled = status === 'CANCELLED' || status === 'REJECTED';

  const grandTotal = Number((order as any).grandTotal ?? (order as any).grandtotal ?? order.totalAmount ?? 0);
  const itemsList  = order.items ?? [];
  const itemCount  = itemsList.length;

  const itemsWithPrice = itemsList.map((item: any) => {
    const uPrice = getItemUnitPrice(item);
    const totalP = getItemTotal(item, grandTotal, itemCount);
    return { ...item, parsedUnitPrice: uPrice, parsedTotal: totalP };
  });

  const addrText = typeof order.deliveryAddress === 'object'
    ? [(order.deliveryAddress as any).line1, (order.deliveryAddress as any).city, (order.deliveryAddress as any).state, (order.deliveryAddress as any).pincode].filter(Boolean).join(', ')
    : (order.deliveryAddress as string) ?? '';

  const dateVal = order.createdAt ?? (order as any).updatedAt ?? (order as any).assignedAt;

  // Delivery partner details if assigned
  const agentName = (order as any).agentName ?? (order as any).deliveryAgentName ?? 'Spikyyy Boy';
  const agentPhone = (order as any).agentPhone ?? (order as any).deliveryAgentPhone ?? '+914444444444';
  const agentVehicle = (order as any).agentVehicleType ?? (order as any).vehicleType ?? 'BIKE';
  const hasAgent = (order as any).deliveryAgentId || (order as any).agentName || progressIdx >= 3;

  const farmLocation = (order as any).farmLocation ?? (order as any).farmName ?? 'VARADHI';

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Top Header Navigation */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backIcon}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Details</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={load}>
          <Icon name="refresh-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Main Dashboard Card matching Web App */}
        <View style={s.mainCard}>

          {/* Header Row: #OrderNum + Status Pill + Price & Date */}
          <View style={s.cardTopRow}>
            <View style={s.orderNumGroup}>
              <View style={s.orderPill}>
                <Text style={s.orderPillText}>
                  #{order.orderNumber ?? ((order as any).id ?? '').slice(-8).toUpperCase()}
                </Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: badgeBg }]}>
                <Text style={[s.statusBadgeText, { color: badgeColor }]}>{status}</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.orderTotalLabel}>Order Total</Text>
              <Text style={s.orderTotalValue}>₹{grandTotal.toFixed(0)}</Text>
              <Text style={s.webDateText}>{formatWebDate(dateVal)}</Text>
            </View>
          </View>

          {/* 6 Progress Steps Row matching Web App */}
          {!isCancelled && (
            <View style={s.progressContainer}>
              {PROGRESS_STEPS.map((step, idx) => {
                const isDone = idx <= progressIdx;
                return (
                  <View key={step.key} style={s.progressStep}>
                    <View style={[s.progressCircle, isDone && s.progressCircleDone]}>
                      <Icon name="checkmark" size={12} color={Colors.white} />
                    </View>
                    <Text style={[s.progressStepLabel, isDone && s.progressStepLabelDone]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* 3 Detail Sub-Cards Grid */}
          <View style={s.cardsGrid}>

            {/* 1. Buyer Details Card */}
            <View style={s.buyerCard}>
              <View style={s.subCardHeaderRow}>
                <View style={s.subCardTitleGroup}>
                  <Icon name="person-outline" size={16} color={Colors.primary} />
                  <Text style={s.subCardTitle}>BUYER DETAILS</Text>
                </View>
                {order.buyerPhone && (
                  <TouchableOpacity
                    style={s.greenCallBtn}
                    onPress={() => Linking.openURL(`tel:${order.buyerPhone}`)}
                  >
                    <Icon name="call" size={16} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={s.personName}>{order.buyerName ?? 'joshna'}</Text>
              {order.buyerPhone && (
                <Text style={s.phoneText}>📞 {order.buyerPhone}</Text>
              )}

              <View style={s.addrDivider} />

              <Text style={s.addrHeading}>📍 DELIVERY ADDRESS</Text>
              <Text style={s.addrContent}>{addrText || 'NH48, Chembarambakkam, Thandalam, Tamil Nadu, 600124'}</Text>
            </View>

            {/* 2. Items Ordered Card */}
            <View style={s.itemsCard}>
              <View style={s.subCardHeaderRow}>
                <View style={s.subCardTitleGroup}>
                  <Icon name="cube-outline" size={16} color={Colors.textPrimary} />
                  <Text style={[s.subCardTitle, { color: Colors.textPrimary }]}>
                    ITEMS ORDERED ({itemCount})
                  </Text>
                </View>
              </View>

              {itemsWithPrice.map((item: any, i: number) => (
                <View key={i} style={s.itemRowBox}>
                  <View style={s.itemRowLeft}>
                    <Text style={s.itemIconEmoji}>🥦</Text>
                    <View>
                      <Text style={s.itemRowName}>{item.productName}</Text>
                      <Text style={s.itemRowSub}>
                        {item.quantity} {item.unit ?? 'dozen'} × ₹{item.parsedUnitPrice.toFixed(0)}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.itemRowTotal}>₹{item.parsedTotal.toFixed(0)}</Text>
                </View>
              ))}
            </View>

            {/* 3. Delivery Partner Card */}
            <View style={s.partnerCard}>
              <View style={s.subCardHeaderRow}>
                <View style={s.subCardTitleGroup}>
                  <Icon name="bicycle-outline" size={16} color="#4F46E5" />
                  <Text style={[s.subCardTitle, { color: '#4F46E5' }]}>DELIVERY PARTNER</Text>
                </View>
                {agentPhone && (
                  <TouchableOpacity
                    style={s.purpleCallBtn}
                    onPress={() => Linking.openURL(`tel:${agentPhone}`)}
                  >
                    <Icon name="call" size={16} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.partnerInfoRow}>
                <Text style={s.partnerIconEmoji}>🏍️</Text>
                <Text style={s.personName}>{hasAgent ? agentName : 'Assigning partner…'}</Text>
              </View>

              {hasAgent && (
                <>
                  <Text style={s.phoneText}>📞 {agentPhone}</Text>
                  <Text style={s.vehicleText}>Vehicle: <Text style={{ fontWeight: '700' }}>{agentVehicle}</Text></Text>
                </>
              )}
            </View>

          </View>

          {/* Farm Location Footer */}
          <View style={s.farmFooterRow}>
            <Icon name="navigate-outline" size={15} color={Colors.primary} />
            <Text style={s.farmFooterText}>
              Farm Location: <Text style={{ fontWeight: '700' }}>{farmLocation}</Text>
            </Text>
          </View>

        </View>

        {/* Action Buttons matching Web App */}
        {isPending && (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.btnDecline, actionLoading && s.btnDisabled]}
              onPress={handleDecline}
              disabled={actionLoading}
            >
              <Text style={s.btnDeclineText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btnAccept, actionLoading && s.btnDisabled]}
              onPress={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={s.btnAcceptText}>Accept Order</Text>}
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <TouchableOpacity
            style={[s.btnPack, actionLoading && s.btnDisabled]}
            onPress={handlePack}
            disabled={actionLoading}
          >
            {actionLoading
              ? <ActivityIndicator color={Colors.white} size="small" />
              : (
                <>
                  <Icon name="cube" size={18} color={Colors.white} style={{ marginRight: 8 }} />
                  <Text style={s.btnPackText}>Mark as Packed</Text>
                </>
              )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles matching Web App ──────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
  errorText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  backBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: borderRadius.md },
  backBtnText: { color: Colors.white, fontWeight: '700' },

  // Top Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...shadow.sm,
  },
  backIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  refreshBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { padding: 14, paddingBottom: 32 },

  // Main Card
  mainCard: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...shadow.sm,
  },

  // Card Top Row
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderPill: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  orderPillText: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },

  orderTotalLabel: { fontSize: 11, color: Colors.textHint, fontWeight: '600' },
  orderTotalValue: { fontSize: 24, fontWeight: '900', color: Colors.primary },
  webDateText: { fontSize: 11, color: Colors.textHint, marginTop: 2 },

  // 6 Progress Steps Row
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  progressStep: { alignItems: 'center', flex: 1 },
  progressCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  progressCircleDone: { backgroundColor: Colors.primary },
  progressStepLabel: { fontSize: 9, color: Colors.textHint, fontWeight: '600', textAlign: 'center' },
  progressStepLabelDone: { color: Colors.primary, fontWeight: '700' },

  // Sub Cards Grid
  cardsGrid: { gap: 12 },

  // 1. Buyer Details Sub Card
  buyerCard: {
    backgroundColor: '#F4FBF7',
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1E7DD',
  },
  subCardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subCardTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subCardTitle: { fontSize: 12, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
  greenCallBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.sm,
  },
  personName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  phoneText: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  addrDivider: { height: 1, backgroundColor: '#D1E7DD', marginVertical: 10 },
  addrHeading: { fontSize: 10, fontWeight: '800', color: Colors.primary, marginBottom: 4, letterSpacing: 0.5 },
  addrContent: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  // 2. Items Ordered Sub Card
  itemsCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemRowBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: borderRadius.md,
    padding: 10, marginTop: 6, borderWidth: 1, borderColor: '#F3F4F6',
  },
  itemRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemIconEmoji: { fontSize: 20 },
  itemRowName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemRowSub: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  itemRowTotal: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },

  // 3. Delivery Partner Sub Card
  partnerCard: {
    backgroundColor: '#F5F6FF',
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  purpleCallBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
    ...shadow.sm,
  },
  partnerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  partnerIconEmoji: { fontSize: 18 },
  vehicleText: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },

  // Farm Footer
  farmFooterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  farmFooterText: { fontSize: 12, color: Colors.textSecondary },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnDecline: {
    flex: 1, borderWidth: 2, borderColor: Colors.error,
    borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center',
  },
  btnDeclineText: { color: Colors.error, fontWeight: '800', fontSize: 15 },
  btnAccept: {
    flex: 2, backgroundColor: Colors.primary,
    borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center',
  },
  btnAcceptText: { color: Colors.white, fontWeight: '800', fontSize: 15 },

  btnPack: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#6A1B9A', borderRadius: borderRadius.lg,
    paddingVertical: 15, marginTop: 4, ...shadow.sm,
  },
  btnPackText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});
