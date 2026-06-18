import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Linking, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius, spacing } from '../../theme/spacing';
import { deliveryApi } from '../../api/delivery';
import type { DeliveryOrder } from '../../types/delivery';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatAddr(addr: string | any): string {
  if (!addr) return 'Address not available';
  if (typeof addr === 'string') return addr;
  return [addr.line1, addr.city, addr.state].filter(Boolean).join(', ');
}

function ContactCard({
  icon, color, label, name, phone, address,
}: {
  icon: string; color: string; label: string;
  name?: string; phone?: string; address?: string;
}) {
  return (
    <View style={[cc.wrap, { borderLeftColor: color }]}>
      <Text style={cc.label}>{label}</Text>
      {name ? (
        <View style={cc.row}>
          <Icon name="person-outline" size={13} color={Colors.textSecondary} />
          <Text style={cc.name}>{name}</Text>
        </View>
      ) : null}
      {phone ? (
        <TouchableOpacity style={cc.row} onPress={() => Linking.openURL(`tel:${phone}`)}>
          <Icon name="call-outline" size={13} color={Colors.success} />
          <Text style={[cc.phone, { color: Colors.success }]}>{phone}</Text>
        </TouchableOpacity>
      ) : null}
      {address ? (
        <View style={cc.row}>
          <Icon name="location-outline" size={13} color={Colors.textSecondary} />
          <Text style={cc.addr} numberOfLines={2}>{address}</Text>
        </View>
      ) : null}
    </View>
  );
}

const cc = StyleSheet.create({
  wrap: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10, backgroundColor: Colors.background, borderRadius: borderRadius.sm, padding: 10 },
  label: { fontSize: 10, fontWeight: '700', color: Colors.textHint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  phone: { fontSize: 13, fontWeight: '600' },
  addr: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});

export const DeliveryHomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isOnline, setIsOnline]         = useState(false);
  const [togglingOnline, setToggling]   = useState(false);
  const [available, setAvailable]       = useState<DeliveryOrder[]>([]);
  const [assigned, setAssigned]         = useState<DeliveryOrder[]>([]);
  const [earnings, setEarnings]         = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [claimingId, setClaimingId]     = useState<string | null>(null);
  const [updatingId, setUpdatingId]     = useState<string | null>(null);

  const toggleScale = useRef(new Animated.Value(1)).current;
  const toggleBg    = useRef(new Animated.Value(0)).current;
  const pulse       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
    return undefined;
  }, [isOnline, pulse]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [availRes, assignRes, earningsRes] = await Promise.all([
        deliveryApi.getAvailableOrders().catch(() => ({ data: [] } as any)),
        deliveryApi.getAssignedOrders().catch(() => ({ data: [] } as any)),
        deliveryApi.getEarnings().catch(() => ({ data: null } as any)),
      ]);
      setAvailable(Array.isArray((availRes as any).data) ? (availRes as any).data : []);
      const assignedList = (assignRes as any).data?.items ?? (assignRes as any).data ?? [];
      setAssigned(Array.isArray(assignedList) ? assignedList : []);
      setEarnings((earningsRes as any).data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleOnline = useCallback(async () => {
    setToggling(true);
    Animated.sequence([
      Animated.spring(toggleScale, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(toggleScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    Animated.timing(toggleBg, { toValue: isOnline ? 0 : 1, duration: 400, useNativeDriver: false }).start();
    try {
      await deliveryApi.updateAvailability(!isOnline);
      setIsOnline(prev => !prev);
    } catch {}
    finally { setTimeout(() => setToggling(false), 500); }
  }, [isOnline, toggleScale, toggleBg]);

  const claimOrder = async (orderId: string) => {
    setClaimingId(orderId);
    try {
      await deliveryApi.claimOrder(orderId);
      loadData();
    } catch (e: any) {
      Alert.alert('Could not claim', e?.response?.data?.message ?? 'Try again');
    } finally { setClaimingId(null); }
  };

  const updateStatus = async (orderId: string, status: string, label: string) => {
    Alert.alert('Update Status', `Mark as "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        setUpdatingId(orderId);
        try {
          await deliveryApi.updateOrderStatus(orderId, status as any);
          loadData();
        } catch { Alert.alert('Error', 'Could not update status'); }
        finally { setUpdatingId(null); }
      }},
    ]);
  };

  const bgColor = toggleBg.interpolate({ inputRange: [0, 1], outputRange: [Colors.error, Colors.primary] });

  const activeDelivery = assigned.find(o => ['assigned','picked_up','in_transit'].includes(o.status));

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradientGreen} style={styles.header}>
        <Text style={styles.headerTitle}>AgriDirect Delivery</Text>
        <Text style={styles.headerSub}>{isOnline ? '🟢 Online — Ready for orders' : '🔴 Offline'}</Text>
      </LinearGradient>

      {/* Online/offline map area */}
      <View style={[styles.mapPlaceholder, !isOnline && styles.mapOffline]}>
        {isOnline ? (
          <>
            <Animated.View style={[styles.mapPulse, { transform: [{ scale: pulse }] }]} />
            <Text style={styles.mapOnlineText}>You are visible to farmers nearby</Text>
          </>
        ) : (
          <>
            <Text style={styles.offlineIcon}>😴</Text>
            <Text style={styles.offlineText}>You are offline</Text>
            <Text style={styles.offlineSub}>Go online to receive orders</Text>
          </>
        )}
      </View>

      {/* Toggle pill */}
      <View style={styles.toggleWrap}>
        <Animated.View style={{ transform: [{ scale: toggleScale }] }}>
          <TouchableOpacity onPress={toggleOnline} disabled={togglingOnline} activeOpacity={0.9}>
            <Animated.View style={[styles.togglePill, { backgroundColor: bgColor }]}>
              <Text style={styles.toggleText}>
                {togglingOnline ? 'Please wait...' : isOnline ? '🔴  Go Offline' : '🟢  Go Online'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={Colors.primary} />}
      >
        {/* Today's earnings stats */}
        <Text style={styles.sectionTitle}>Today's Stats</Text>
        <View style={styles.statsRow}>
          {[
            { icon: '📦', label: 'Deliveries', value: String(earnings?.todayDeliveries ?? assigned.filter(o => o.status === 'delivered').length) },
            { icon: '💰', label: 'Earned Today', value: `₹${earnings?.today ?? 0}` },
            { icon: '💵', label: 'This Month', value: `₹${earnings?.thisMonth ?? 0}` },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Active delivery banner */}
        {activeDelivery && (
          <TouchableOpacity
            style={styles.activeCard}
            onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: activeDelivery.id || (activeDelivery as any).orderId })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={Colors.gradientGreen} style={styles.activeGradient}>
              <Text style={styles.activeTitle}>🚀 Active Delivery</Text>
              <Text style={styles.activeId}>Order #{activeDelivery.orderNumber || 'ONGOING'}</Text>
              <Text style={styles.activeStatus}>{activeDelivery.status.replace(/_/g, ' ').toUpperCase()}</Text>

              <View style={{ marginTop: 12, gap: 6 }}>
                <View style={styles.activeRow}>
                  <Icon name="person-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.activeRowText}>Farmer: {activeDelivery.farmerName || '—'}</Text>
                  {activeDelivery.farmerPhone ? (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${activeDelivery.farmerPhone}`)}>
                      <Icon name="call" size={14} color={Colors.white} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.activeRow}>
                  <Icon name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.activeRowText} numberOfLines={1}>Pickup: {activeDelivery.pickupAddress || '—'}</Text>
                </View>
                <View style={styles.activeRow}>
                  <Icon name="person-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.activeRowText}>Buyer: {activeDelivery.buyerName || '—'}</Text>
                  {activeDelivery.buyerPhone ? (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${activeDelivery.buyerPhone}`)}>
                      <Icon name="call" size={14} color={Colors.white} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.activeRow}>
                  <Icon name="home-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.activeRowText} numberOfLines={1}>Drop: {formatAddr(activeDelivery.dropAddress)}</Text>
                </View>
              </View>

              {/* Status action */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                {activeDelivery.status === 'assigned' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => updateStatus(activeDelivery.id || (activeDelivery as any).orderId, 'PICKED_UP', 'Picked Up')}
                    disabled={updatingId === activeDelivery.id}
                  >
                    {updatingId === activeDelivery.id ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.actionBtnText}>📦 Mark Picked Up</Text>}
                  </TouchableOpacity>
                )}
                {(activeDelivery.status === 'picked_up' || activeDelivery.status === 'in_transit') && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                    onPress={() => updateStatus(activeDelivery.id || (activeDelivery as any).orderId, 'DELIVERED', 'Delivered')}
                    disabled={updatingId === activeDelivery.id}
                  >
                    {updatingId === activeDelivery.id ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.actionBtnText}>✅ Mark Delivered</Text>}
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Available orders pool */}
        <Text style={styles.sectionTitle}>
          Available Orders ({available.length})
        </Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : available.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No available orders right now</Text>
            <Text style={styles.emptySub}>Pull to refresh</Text>
          </View>
        ) : (
          available.map(order => (
            <View key={order.id || (order as any).orderId} style={styles.orderCard}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.orderNum}>#{String(order.id || (order as any).orderId || '').slice(0, 8).toUpperCase()}</Text>
                <View style={styles.earnBadge}>
                  <Text style={styles.earnBadgeText}>Earn ₹{(order.deliveryFee ?? 0).toFixed(0)}</Text>
                </View>
              </View>

              {/* Meta */}
              <View style={styles.metaRow}>
                {(order as any).itemCount ? <Text style={styles.metaChip}>{(order as any).itemCount} items</Text> : null}
                {order.distance ? <Text style={styles.metaChip}>{order.distance.toFixed(1)} km</Text> : null}
                <Text style={styles.metaChip}>₹{((order as any).totalAmount ?? 0).toFixed(0)} order</Text>
              </View>

              {/* Farmer contact */}
              <ContactCard
                icon="leaf-outline"
                color={Colors.warning}
                label="📦 Pickup — Farmer"
                name={order.farmerName}
                phone={order.farmerPhone}
                address={order.pickupAddress}
              />

              {/* Buyer contact */}
              <ContactCard
                icon="home-outline"
                color={Colors.primary}
                label="🏠 Drop — Buyer"
                name={order.buyerName}
                phone={order.buyerPhone}
                address={formatAddr(order.dropAddress)}
              />

              {/* Claim */}
              <TouchableOpacity
                style={[styles.claimBtn, claimingId === (order.id || (order as any).orderId) && { opacity: 0.6 }]}
                onPress={() => claimOrder(order.id || (order as any).orderId)}
                disabled={claimingId === (order.id || (order as any).orderId)}
                activeOpacity={0.85}
              >
                {claimingId === (order.id || (order as any).orderId)
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.claimBtnText}>Claim Order</Text>}
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

export default DeliveryHomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  mapPlaceholder: { height: 160, backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center' },
  mapOffline: { backgroundColor: Colors.divider },
  mapPulse: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, ...shadow.md },
  mapOnlineText: { fontSize: 12, color: Colors.primary, marginTop: 12, opacity: 0.8 },
  offlineIcon: { fontSize: 40 },
  offlineText: { fontSize: 17, fontWeight: '700', color: Colors.textHint, marginTop: 6 },
  offlineSub: { fontSize: 13, color: Colors.textHint, marginTop: 2 },
  toggleWrap: { alignItems: 'center', marginTop: -22, zIndex: 10 },
  togglePill: { borderRadius: borderRadius.full, paddingHorizontal: 40, paddingVertical: 14, ...shadow.lg },
  toggleText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  scroll: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, marginTop: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 12, alignItems: 'center', ...shadow.sm },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 10, color: Colors.textHint, marginTop: 2, textAlign: 'center' },
  activeCard: { borderRadius: borderRadius.xl, overflow: 'hidden', ...shadow.md, marginBottom: 8 },
  activeGradient: { padding: 16 },
  activeTitle: { color: Colors.white, fontSize: 13, fontWeight: '600', opacity: 0.9 },
  activeId: { color: Colors.white, fontSize: 20, fontWeight: '800', marginTop: 2 },
  activeStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeRowText: { flex: 1, color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  actionBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 32, alignItems: 'center', ...shadow.sm },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { fontSize: 12, color: Colors.textHint, marginTop: 4 },
  orderCard: { backgroundColor: Colors.white, borderRadius: borderRadius.xl, padding: 14, marginBottom: 14, ...shadow.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNum: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  earnBadge: { backgroundColor: Colors.successLight, borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  earnBadgeText: { color: Colors.success, fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  metaChip: { backgroundColor: Colors.background, borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  claimBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  claimBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
