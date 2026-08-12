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
import AdvancedMapView from '../../components/map/AdvancedMapView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatAddr(addr: string | any): string {
  if (!addr) return 'Address not available';
  if (typeof addr === 'string') return addr.trim() || 'Address not available';
  if (addr.address && typeof addr.address === 'string') return addr.address;
  if (addr.fullAddress && typeof addr.fullAddress === 'string') return addr.fullAddress;
  if (addr.formattedAddress && typeof addr.formattedAddress === 'string') return addr.formattedAddress;
  const parts = [
    addr.line1 || addr.street || addr.houseNo || addr.building,
    addr.line2 || addr.area || addr.landmark,
    addr.city,
    addr.state,
    addr.pincode || addr.zipCode,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
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
      const [availRes, assignRes, earningsRes, profileRes] = await Promise.all([
        deliveryApi.getAvailableOrders().catch(() => ({ data: [] } as any)),
        deliveryApi.getAssignedOrders().catch(() => ({ data: [] } as any)),
        deliveryApi.getEarnings().catch(() => ({ data: null } as any)),
        deliveryApi.getProfile().catch(() => ({ data: null } as any)),
      ]);
      // API client unwraps response.data — handle both wrapped and unwrapped shapes
      const availData: any = (availRes as any)?.data ?? availRes;
      const assignData: any = (assignRes as any)?.data ?? assignRes;
      const earningsData: any = (earningsRes as any)?.data ?? earningsRes;
      const profileData: any = (profileRes as any)?.data ?? profileRes;

      setAvailable(Array.isArray(availData) ? availData : []);
      const assignedList = assignData?.items ?? assignData?.content ?? assignData ?? [];
      const validAssigned: DeliveryOrder[] = Array.isArray(assignedList) ? assignedList : [];
      setAssigned(validAssigned);
      setEarnings(earningsData);

      const hasActive = validAssigned.some(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status));
      const rawAvailable = profileData?.isAvailable ?? profileData?.available;
      const onlineState = rawAvailable !== undefined ? Boolean(rawAvailable) : true;

      setIsOnline(onlineState || hasActive);
      Animated.timing(toggleBg, { toValue: (onlineState || hasActive) ? 1 : 0, duration: 300, useNativeDriver: false }).start();
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [toggleBg]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleOnline = useCallback(async () => {
    setToggling(true);
    Animated.sequence([
      Animated.spring(toggleScale, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(toggleScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    const nextState = !isOnline;
    Animated.timing(toggleBg, { toValue: nextState ? 1 : 0, duration: 400, useNativeDriver: false }).start();
    try {
      await deliveryApi.updateAvailability(nextState);
      setIsOnline(nextState);
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
        } catch (err: any) {
          const msg = err?.message || err?.response?.data?.message || 'Could not update status';
          Alert.alert('Update Failed', msg + '\n\nIf the order is stuck, please create a new test order.');
        }
        finally { setUpdatingId(null); }
      }},
    ]);
  };

  const bgColor = toggleBg.interpolate({ inputRange: [0, 1], outputRange: [Colors.error, Colors.success] });

  const activeDelivery = assigned.find(o => ['assigned','picked_up','in_transit'].includes(o.status));
  const todayDelivered = assigned.filter(o => o.status === 'delivered');
  const todayEarnedFallback = todayDelivered.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const todayEarnedVal = earnings?.today ?? earnings?.todayEarnings ?? (todayEarnedFallback > 0 ? todayEarnedFallback : 0);
  const monthEarnedVal = earnings?.thisMonth ?? earnings?.monthEarnings ?? (todayEarnedFallback > 0 ? todayEarnedFallback : 0);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>AgriDirect Delivery</Text>
          <Text style={styles.headerSub}>{isOnline ? 'Searching for orders...' : 'You are offline'}</Text>
        </View>
        <TouchableOpacity onPress={toggleOnline} disabled={togglingOnline} activeOpacity={0.8}>
          <Animated.View style={[styles.inlineToggle, { backgroundColor: bgColor, transform: [{ scale: toggleScale }] }]}>
            <View style={styles.toggleDot} />
            <Text style={styles.toggleTextInline}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.dashboardWidget}>
          <View style={styles.dashHeaderRow}>
            <Text style={styles.dashTitle}>Today's Earnings</Text>
            <TouchableOpacity style={styles.dashDetailsBtn}>
              <Text style={styles.dashDetailsText}>Details →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dashAmount}>₹{todayEarnedVal}</Text>
          
          <View style={styles.dashBottomRow}>
            <View style={styles.dashStatBox}>
              <Text style={styles.dashStatLabel}>Deliveries</Text>
              <Text style={styles.dashStatValue}>{earnings?.todayDeliveries ?? earnings?.todayCount ?? todayDelivered.length}</Text>
            </View>
            <View style={styles.dashDivider} />
            <View style={styles.dashStatBox}>
              <Text style={styles.dashStatLabel}>This Month</Text>
              <Text style={styles.dashStatValue}>₹{monthEarnedVal}</Text>
            </View>
          </View>
        </LinearGradient>

        {activeDelivery && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Current Assignment</Text>
            <TouchableOpacity
              style={styles.activeCard}
              onPress={() =>
                navigation.navigate('DeliveryOrderDetail', {
                  orderId: activeDelivery.id || (activeDelivery as any)._id || activeDelivery.orderId,
                  initialOrder: activeDelivery,
                })
              }
              activeOpacity={0.9}
            >
              <View style={styles.activeCardHeader}>
                <View style={styles.pulseDotWrap}>
                  <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulse }] }]} />
                  <Text style={styles.activeStatusText}>{activeDelivery.status.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.activeOrderId}>#{String(activeDelivery.orderNumber || 'ONGOING')}</Text>
              </View>

              <View style={styles.activeCardBody}>
                <View style={styles.routeTimeline}>
                  <Icon name="radio-button-on" size={16} color={Colors.primary} />
                  <View style={styles.routeLine} />
                  <Icon name="location" size={16} color={Colors.error} />
                </View>
                <View style={styles.routeTextCol}>
                  <View style={styles.routeTextItem}>
                    <Text style={styles.routeLabel}>PICKUP</Text>
                    <Text style={styles.routeAddress} numberOfLines={1}>{activeDelivery.pickupAddress || 'Farm'}</Text>
                  </View>
                  <View style={styles.routeTextItem}>
                    <Text style={styles.routeLabel}>DROPOFF</Text>
                    <Text style={styles.routeAddress} numberOfLines={1}>{formatAddr(activeDelivery.dropAddress)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.activeCardActions}>
                <TouchableOpacity
                  style={[styles.actionBtnSolid, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}
                  onPress={() => navigation.navigate('DeliveryNavigation', {
                    orderId: activeDelivery.id || (activeDelivery as any).orderId,
                    pickupLat: activeDelivery.pickupLat ?? 0,
                    pickupLng: activeDelivery.pickupLng ?? 0,
                    dropLat: activeDelivery.dropLat ?? 0,
                    dropLng: activeDelivery.dropLng ?? 0,
                  })}
                >
                  <Icon name="navigate-outline" size={18} color={Colors.primary} />
                  <Text style={[styles.actionBtnTextSolid, { color: Colors.primary }]}>Navigate</Text>
                </TouchableOpacity>

                {activeDelivery.status === 'assigned' && (
                  <TouchableOpacity
                    style={[styles.actionBtnSolid, { flex: 1.5, backgroundColor: Colors.primary }]}
                    onPress={() => updateStatus(activeDelivery.id || (activeDelivery as any).orderId, 'PICKED_UP', 'Picked Up')}
                    disabled={updatingId === activeDelivery.id}
                  >
                    {updatingId === activeDelivery.id ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.actionBtnTextSolid}>Mark Picked Up</Text>}
                  </TouchableOpacity>
                )}
                {(activeDelivery.status === 'picked_up' || activeDelivery.status === 'in_transit') && (
                  <TouchableOpacity
                    style={[styles.actionBtnSolid, { flex: 1.5, backgroundColor: Colors.success }]}
                    onPress={() => updateStatus(activeDelivery.id || (activeDelivery as any).orderId, 'DELIVERED', 'Delivered')}
                    disabled={updatingId === activeDelivery.id}
                  >
                    {updatingId === activeDelivery.id ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.actionBtnTextSolid}>Mark Delivered</Text>}
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Available Orders ({available.length})
        </Text>
        
        {!isOnline ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>😴</Text>
            <Text style={styles.emptyText}>You are currently offline</Text>
            <Text style={styles.emptySub}>Go online to start receiving new delivery requests.</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 40 }} size="large" />
        ) : available.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyText}>Looking for orders...</Text>
            <Text style={styles.emptySub}>Stay online, new requests will appear here automatically.</Text>
          </View>
        ) : (
          available.map(order => (
            <View key={order.id || (order as any).orderId} style={styles.availableCard}>
              <View style={styles.availHeader}>
                <View>
                  <Text style={styles.availEarning}>₹{(order.deliveryFee ?? 0).toFixed(0)}</Text>
                  <Text style={styles.availDistance}>{order.distance ? `${order.distance.toFixed(1)} km total` : 'Distance unknown'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.claimBtnSolid, claimingId === (order.id || (order as any).orderId) && { opacity: 0.6 }]}
                  onPress={() => claimOrder(order.id || (order as any).orderId)}
                  disabled={claimingId === (order.id || (order as any).orderId)}
                >
                  {claimingId === (order.id || (order as any).orderId) ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.claimBtnTextSolid}>Accept Order</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.availBody}>
                <View style={styles.availLocation}>
                  <Icon name="storefront" size={16} color={Colors.primary} />
                  <Text style={styles.availAddrText} numberOfLines={1}>{order.pickupAddress || 'Farm Pickup'}</Text>
                </View>
                <View style={styles.availLocationDivider} />
                <View style={styles.availLocation}>
                  <Icon name="home" size={16} color={Colors.error} />
                  <Text style={styles.availAddrText} numberOfLines={1}>{formatAddr(order.dropAddress) || 'Customer Dropoff'}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default DeliveryHomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, ...shadow.sm },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  inlineToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  toggleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white },
  toggleTextInline: { color: Colors.white, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  
  dashboardWidget: { borderRadius: 24, padding: 24, marginBottom: 28, ...shadow.md },
  dashHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dashTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  dashDetailsBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dashDetailsText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  dashAmount: { color: Colors.white, fontSize: 44, fontWeight: '800', marginBottom: 24 },
  dashBottomRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: 16 },
  dashStatBox: { flex: 1, alignItems: 'center' },
  dashStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  dashStatValue: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  dashDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  
  activeCard: { backgroundColor: Colors.white, borderRadius: 20, ...shadow.md, overflow: 'hidden' },
  activeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pulseDotWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryDark },
  activeStatusText: { color: Colors.primaryDark, fontSize: 12, fontWeight: '800' },
  activeOrderId: { fontSize: 13, fontWeight: '700', color: Colors.textHint },
  
  activeCardBody: { flexDirection: 'row', padding: 16 },
  routeTimeline: { width: 24, alignItems: 'center', marginRight: 12 },
  routeLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  routeTextCol: { flex: 1, justifyContent: 'space-between' },
  routeTextItem: { marginBottom: 12 },
  routeLabel: { fontSize: 10, color: Colors.textHint, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  routeAddress: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  
  activeCardActions: { flexDirection: 'row', padding: 16, paddingTop: 0, gap: 10 },
  actionBtnSolid: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 6 },
  actionBtnTextSolid: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  
  availableCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 16, marginBottom: 16, ...shadow.sm },
  availHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  availEarning: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  availDistance: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  claimBtnSolid: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100 },
  claimBtnTextSolid: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  
  availBody: { backgroundColor: Colors.background, borderRadius: 16, padding: 16 },
  availLocation: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  availLocationDivider: { width: 1.5, height: 16, backgroundColor: Colors.border, marginLeft: 7, marginVertical: 4 },
  availAddrText: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: Colors.white, borderRadius: 24, ...shadow.sm },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 30 },
});
