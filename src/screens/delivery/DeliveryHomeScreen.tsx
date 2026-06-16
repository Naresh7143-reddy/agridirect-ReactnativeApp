// FILE: src/screens/delivery/DeliveryHomeScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { deliveryApi } from '../../api/delivery';
import type { DeliveryOrder } from '../../types/delivery';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const DeliveryHomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  const [newOrder, setNewOrder] = useState<DeliveryOrder | null>(null);
  const [countdown, setCountdown] = useState(30);

  const toggleScale = useRef(new Animated.Value(1)).current;
  const toggleBg = useRef(new Animated.Value(0)).current;
  const newOrderSlide = useRef(new Animated.Value(-200)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // Pulse for online map dot
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

  // New order countdown
  useEffect(() => {
    if (!newOrder) return;
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setNewOrder(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [newOrder]);

  useEffect(() => {
    if (newOrder) {
      Animated.spring(newOrderSlide, { toValue: 0, useNativeDriver: true, tension: 60 }).start();
    } else {
      Animated.timing(newOrderSlide, { toValue: -200, duration: 200, useNativeDriver: true }).start();
    }
  }, [newOrder, newOrderSlide]);

  const loadOrders = useCallback(async () => {
    try {
      const res: any = await deliveryApi.getAssignedOrders({ status: 'IN_TRANSIT' as any });
      const list: DeliveryOrder[] = res.data || [];
      setOrders(list);
      const active = list.find((o) => ['PICKED_UP', 'IN_TRANSIT'].includes((o as any).status));
      setActiveOrder(active || null);
      // Simulate new order alert for demo
      const pending = list.find((o) => (o as any).status === 'PACKED');
      if (pending && isOnline) setNewOrder(pending);
    } catch {}
    finally { setLoading(false); }
  }, [isOnline]);

  useEffect(() => { if (isOnline) loadOrders(); }, [isOnline, loadOrders]);

  const toggleOnline = useCallback(async () => {
    setTogglingOnline(true);
    Animated.sequence([
      Animated.spring(toggleScale, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(toggleScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    Animated.timing(toggleBg, {
      toValue: isOnline ? 0 : 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
    try {
      await deliveryApi.updateAvailability(!isOnline);
      setIsOnline(!isOnline);
    } catch { }
    finally { setTimeout(() => setTogglingOnline(false), 500); }
  }, [isOnline, toggleScale, toggleBg]);

  const bgColor = toggleBg.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.error, Colors.primary],
  });

  // Earnings stats (mock)
  const stats = [
    { label: 'Deliveries', value: '5', icon: '📦' },
    { label: 'Distance', value: '23 km', icon: '📍' },
    { label: 'Earned', value: '₹340', icon: '💰' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={Colors.gradientGreen} style={styles.header}>
        <Text style={styles.headerTitle}>AgriDirect Delivery</Text>
        <Text style={styles.headerSub}>{isOnline ? '🟢 Online — Ready for orders' : '🔴 Offline'}</Text>
      </LinearGradient>

      {/* Map Placeholder */}
      <View style={[styles.mapPlaceholder, !isOnline && styles.mapPlaceholderOffline]}>
        {isOnline ? (
          <>
            <Text style={styles.mapLabel}>Live Map</Text>
            <Animated.View style={[styles.mapPulse, { transform: [{ scale: pulse }] }]} />
            <Text style={styles.mapOnlineText}>You are visible to farmers</Text>
          </>
        ) : (
          <>
            <Text style={styles.offlineIcon}>😴</Text>
            <Text style={styles.offlineText}>You are offline</Text>
            <Text style={styles.offlineSub}>Go online to receive orders</Text>
          </>
        )}
      </View>

      {/* Toggle Pill */}
      <View style={styles.toggleWrap}>
        <Animated.View style={{ transform: [{ scale: toggleScale }] }}>
          <TouchableOpacity onPress={toggleOnline} disabled={togglingOnline} activeOpacity={0.9}>
            <Animated.View style={[styles.togglePill, { backgroundColor: bgColor }]}>
              {togglingOnline ? (
                <Text style={styles.toggleText}>Going {isOnline ? 'Offline' : 'Online'}...</Text>
              ) : (
                <Text style={styles.toggleText}>
                  {isOnline ? '🔴  Go Offline' : '🟢  Go Online'}
                </Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* New Order Alert */}
      {newOrder && (
        <Animated.View style={[styles.newOrderCard, { transform: [{ translateY: newOrderSlide }] }]}>
          <View style={styles.newOrderHeader}>
            <Text style={styles.newOrderTitle}>🆕 New Order!</Text>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownText}>{countdown}s</Text>
            </View>
          </View>
          <Text style={styles.newOrderSub}>Pickup from farmer • Deliver to customer</Text>
          <Text style={styles.newOrderEarning}>Earn ₹{(40 + Math.random() * 30).toFixed(0)}</Text>
          <View style={styles.newOrderActions}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => setNewOrder(null)}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => {
                setActiveOrder(newOrder);
                setNewOrder(null);
                navigation.navigate('DeliveryOrderDetail', { orderId: newOrder.id || (newOrder as any).orderId });
              }}
            >
              <Text style={styles.acceptBtnText}>Accept ✓</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <ScrollView style={styles.bottomContent} showsVerticalScrollIndicator={false}>
        {/* Today's Stats */}
        <Text style={styles.sectionTitle}>Today's Stats</Text>
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Active Delivery */}
        {activeOrder && (
          <TouchableOpacity
            style={styles.activeDeliveryCard}
            onPress={() => navigation.navigate('DeliveryNavigation', {
              orderId: (activeOrder as any).id,
              pickupLat: 0, pickupLng: 0, dropLat: 0, dropLng: 0,
            })}
          >
            <LinearGradient colors={Colors.gradientGreen} style={styles.activeDeliveryGradient}>
              <Text style={styles.activeDeliveryTitle}>🚀 Active Delivery</Text>
              <Text style={styles.activeDeliveryId}>Order #{(activeOrder as any).orderNumber || 'ONGOING'}</Text>
              <Text style={styles.activeDeliveryAction}>Tap to navigate →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
  mapPlaceholder: { height: 220, backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center' },
  mapPlaceholderOffline: { backgroundColor: Colors.divider },
  mapLabel: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginBottom: 12, opacity: 0.6 },
  mapPulse: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, ...shadow.md },
  mapOnlineText: { fontSize: 12, color: Colors.primary, marginTop: 12, opacity: 0.7 },
  offlineIcon: { fontSize: 48 },
  offlineText: { fontSize: 18, fontWeight: '700', color: Colors.textHint, marginTop: 8 },
  offlineSub: { fontSize: 13, color: Colors.textHint, marginTop: 4 },
  toggleWrap: { alignItems: 'center', marginTop: -24, zIndex: 10 },
  togglePill: { borderRadius: borderRadius.full, paddingHorizontal: 40, paddingVertical: 14, ...shadow.lg },
  toggleText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  newOrderCard: { position: 'absolute', top: 0, left: 16, right: 16, zIndex: 20, backgroundColor: Colors.white, borderRadius: borderRadius.xl, padding: 16, marginTop: 110, ...shadow.xl },
  newOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  newOrderTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  countdownCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.errorLight, alignItems: 'center', justifyContent: 'center' },
  countdownText: { fontSize: 14, fontWeight: '800', color: Colors.error },
  newOrderSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  newOrderEarning: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 12 },
  newOrderActions: { flexDirection: 'row', gap: 10 },
  declineBtn: { flex: 1, borderRadius: borderRadius.md, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: Colors.error },
  declineBtnText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
  acceptBtn: { flex: 2, borderRadius: borderRadius.md, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.primary },
  acceptBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  bottomContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, marginTop: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 14, alignItems: 'center', ...shadow.sm },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textHint, marginTop: 2 },
  activeDeliveryCard: { borderRadius: borderRadius.lg, overflow: 'hidden', ...shadow.md, marginBottom: 24 },
  activeDeliveryGradient: { padding: 16 },
  activeDeliveryTitle: { color: Colors.white, fontSize: 14, fontWeight: '600', opacity: 0.9 },
  activeDeliveryId: { color: Colors.white, fontSize: 20, fontWeight: '800', marginTop: 4 },
  activeDeliveryAction: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 8 },
});
