// FILE: src/screens/buyer/OrderTrackingScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { calculateSwiggyStyleEta } from '../../utils/deliveryCalc';
import type { Order } from '../../types/order';
import type { BuyerStackParamList } from '../../navigation/types';
import AdvancedMapView from '../../components/map/AdvancedMapView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_POINTS = [
  SCREEN_HEIGHT * 0.75, // collapsed (25% of screen from bottom)
  SCREEN_HEIGHT * 0.45, // default (55% from bottom)
  SCREEN_HEIGHT * 0.10, // expanded (90% from bottom)
];

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: '📋' },
  { key: 'ACCEPTED', label: 'Farmer Accepted', icon: '✅' },
  { key: 'PACKED', label: 'Packed & Ready', icon: '📦' },
  { key: 'PICKED_UP', label: 'Picked Up', icon: '🏍️' },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: '🚚' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉' },
];

function getStepIndex(status: string): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface AgentInfo {
  lat: number;
  lng: number;
  agentName?: string;
  agentPhone?: string;
  vehicleType?: string;
  vehicleRegistration?: string;
  rating?: number;
  totalDeliveries?: number;
  status?: string;
}

const VEHICLE_ICONS: Record<string, string> = {
  BIKE: '🏍️',
  BICYCLE: '🚲',
  AUTO: '🛺',
  VAN: '🚐',
  SCOOTER: '🛵',
};

export const OrderTrackingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const route = useRoute<RouteProp<BuyerStackParamList, 'OrderTracking'>>();
  const { orderId } = route.params;
  const initialData = (route.params as any)?.initialOrder ?? (route.params as any)?.order ?? null;

  const [order, setOrder] = useState<Order | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [countdown, setCountdown] = useState(25 * 60);

  const sheetY = useRef(new Animated.Value(SNAP_POINTS[1])).current;
  const lastY = useRef(SNAP_POINTS[1]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load order details & compute dynamic Swiggy/Zomato ETA
  useEffect(() => {
    if (!order) setLoading(true);
    ordersApi.getOrderById(orderId).then((r: any) => {
      const o: Order = r?.data ?? r;
      if (o) {
        setOrder(o);
        const eta = calculateSwiggyStyleEta(3.5, o.items?.length || 2, o.createdAt, o.status);
        setCountdown(eta.countdownSeconds);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orderId]);

  // Poll agent location every 5 seconds
  useEffect(() => {
    const fetchAgentLocation = () => {
      ordersApi.getAgentLocation(orderId).then((r: any) => {
        const data = r.data;
        if (data?.available) {
          setAgent({
            lat: data.lat,
            lng: data.lng,
            agentName: data.agentName,
            agentPhone: data.agentPhone,
            vehicleType: data.vehicleType,
            vehicleRegistration: data.vehicleRegistration,
            rating: data.rating,
            totalDeliveries: data.totalDeliveries,
            status: data.status,
          });

          // Update order status from agent location response
          if (data.status) {
            setOrder(prev => prev ? { ...prev, status: data.status as any } : prev);
          }
        }
      }).catch(() => {});
    };

    fetchAgentLocation(); // Initial fetch
    const interval = setInterval(fetchAgentLocation, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const snapToPoint = (gestureY: number) => {
    const closest = SNAP_POINTS.reduce((prev, curr) =>
      Math.abs(curr - gestureY) < Math.abs(prev - gestureY) ? curr : prev,
    );
    lastY.current = closest;
    Animated.spring(sheetY, { toValue: closest, useNativeDriver: false, tension: 60, friction: 12 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const newY = lastY.current + g.dy;
        if (newY >= SNAP_POINTS[2] && newY <= SNAP_POINTS[0]) {
          sheetY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, g) => {
        snapToPoint(lastY.current + g.dy);
      },
    }),
  ).current;

  const currentStepIndex = order ? getStepIndex(order.status) : 0;

  return (
    <View style={styles.container}>
      {/* Advanced Map Engine */}
      <View style={styles.mapContainer}>
        <AdvancedMapView
          mode="tracking"
          style={StyleSheet.absoluteFill}
          driverLocation={{
            latitude: agent?.lat || 13.0827,
            longitude: agent?.lng || 80.2707,
          }}
          vehicleType={agent?.vehicleType || 'BIKE'}
          etaMinutes={Math.max(1, Math.ceil(countdown / 60))}
          pickupLocation={{ latitude: 13.088, longitude: 80.265, title: 'Farm Harvest' }}
          dropoffLocation={{ latitude: 13.075, longitude: 80.28, title: 'Delivery Home' }}
          theme="green"
        />

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.dragHint}>Drag up for details ↑</Text>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.sheet, { top: sheetY }]} {...panResponder.panHandlers}>
        <View style={styles.sheetHandle} />

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : !order ? (
          <Text style={styles.errorText}>Order not found</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={false}>
            {/* Swiggy/Zomato style agent card */}
            <View style={styles.topRow}>
              <View style={styles.agentInfo}>
                <View style={styles.agentAvatar}>
                  <Text style={styles.agentAvatarText}>
                    {VEHICLE_ICONS[agent?.vehicleType || 'BIKE'] || '🏍️'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.agentName}>{agent?.agentName || 'Delivery Partner'}</Text>
                  <Text style={styles.agentSub}>
                    {agent?.vehicleType || 'Bike'} {agent?.vehicleRegistration ? `(${agent.vehicleRegistration})` : ''} • ⭐ {(agent?.rating || 4.5).toFixed(1)}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {agent?.agentPhone ? (
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => {
                      const url = `tel:${agent.agentPhone}`;
                      require('react-native').Linking.openURL(url);
                    }}
                  >
                    <Text style={styles.callBtnText}>📞 Call</Text>
                  </TouchableOpacity>
                ) : null}
                <View style={styles.etaBox}>
                  <Text style={styles.etaLabel}>ETA</Text>
                  <Text style={styles.etaTime}>{formatCountdown(countdown)}</Text>
                </View>
              </View>
            </View>

            {/* Delivery Verification OTP Highlight Card */}
            {(order as any).deliveryOtp || (order as any).otp ? (
              <View style={styles.otpCard}>
                <View style={styles.otpHeader}>
                  <Text style={styles.otpShieldIcon}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.otpTitle}>Delivery Verification Code</Text>
                    <Text style={styles.otpSub}>Share this OTP with delivery agent upon arrival</Text>
                  </View>
                </View>
                <View style={styles.otpCodeContainer}>
                  <Text style={styles.otpCode}>{(order as any).deliveryOtp || (order as any).otp}</Text>
                </View>
              </View>
            ) : null}

            {/* Status Stepper */}
            <View style={styles.stepperContainer}>
              <Text style={styles.sectionTitle}>Order Status Progression</Text>
              {STATUS_STEPS.map((step, index) => {
                const done = index <= currentStepIndex;
                const active = index === currentStepIndex;
                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={{ alignItems: 'center', marginRight: 14 }}>
                      <View style={[styles.stepCircle, done && styles.stepCircleDone, active && styles.stepCircleActive]}>
                        <Text style={[styles.stepIcon, done && styles.stepIconDone, active && styles.stepIconActive]}>
                          {done ? '✓' : step.icon}
                        </Text>
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View style={[styles.stepLine, done && styles.stepLineDone]} />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepLabel, done && styles.stepLabelDone, active && styles.stepLabelActive]}>{step.label}</Text>
                      {active && <Text style={styles.activeStepSub}>Current Status</Text>}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Expanded: items + address */}
            <View style={styles.orderItemsSection}>
              <Text style={styles.sectionTitle}>Items Ordered</Text>
              {order.items?.map((item: any) => {
                const itemTotal = Number(item.total ?? item.subtotal ?? item.amount ?? ((item.pricePerUnit ?? item.unitPrice ?? item.price ?? 0) * (item.quantity ?? 1))) || 0;
                return (
                  <View key={item.id || item.productId} style={styles.orderItemRow}>
                    <Text style={styles.orderItemName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.orderItemQty}>x{item.quantity} {item.unit}</Text>
                    <Text style={styles.orderItemTotal}>₹{itemTotal.toFixed(0)}</Text>
                  </View>
                );
              })}
            </View>

            {order.deliveryAddress && (
              <View style={styles.addressSection}>
                <Text style={styles.sectionTitle}>Delivering to</Text>
                {typeof order.deliveryAddress === 'string' ? (
                  <Text style={styles.addressText}>{order.deliveryAddress}</Text>
                ) : (
                  <>
                    <Text style={styles.addressText}>
                      {order.deliveryAddress.line1}{order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}
                    </Text>
                    <Text style={styles.addressText}>
                      {order.deliveryAddress.city}, {order.deliveryAddress.state}
                    </Text>
                  </>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};

export default OrderTrackingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { flex: 1, position: 'relative' },
  mapPlaceholder: { flex: 1, backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  mapContent: { alignItems: 'center' },
  mapIcon: { fontSize: 64, opacity: 0.4 },
  mapText: { color: Colors.primary, fontSize: 16, fontWeight: '600', marginTop: 8, opacity: 0.6 },
  agentDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, marginTop: 16, ...shadow.md },
  backBtn: { position: 'absolute', top: 50, left: 16, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: borderRadius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  backBtnText: { fontSize: 20 },
  dragHint: { position: 'absolute', bottom: '28%', color: Colors.primaryLight, fontSize: 13, fontWeight: '600' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, ...shadow.xl },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  errorText: { color: Colors.error, textAlign: 'center', marginTop: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  agentInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  agentAvatarText: { fontSize: 22 },
  agentName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  agentSub: { fontSize: 12, color: Colors.textHint },
  etaBox: { alignItems: 'center', backgroundColor: Colors.successLight, borderRadius: borderRadius.md, paddingHorizontal: 16, paddingVertical: 8 },
  callBtn: { backgroundColor: Colors.success, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  callBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  etaLabel: { fontSize: 11, color: Colors.textHint },
  etaTime: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  stepperContainer: { marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepCircleDone: { backgroundColor: Colors.successLight },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepIcon: { fontSize: 12, color: Colors.textPrimary },
  stepLine: { width: 2, height: 24, backgroundColor: Colors.border, marginTop: 2 },
  stepLineDone: { backgroundColor: Colors.primary },
  otpCard: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 20,
    ...shadow.sm,
  },
  otpHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  otpShieldIcon: { fontSize: 24, marginRight: 10 },
  otpTitle: { fontSize: 13, fontWeight: '800', color: Colors.secondaryDark },
  otpSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  otpCodeContainer: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  otpCode: { fontSize: 26, fontWeight: '900', color: Colors.secondaryDark, letterSpacing: 6 },
  stepIconDone: { color: Colors.primary },
  stepIconActive: { color: Colors.white },
  stepContent: { flex: 1, paddingBottom: 16 },
  stepLabel: { fontSize: 13, color: Colors.textHint, fontWeight: '500' },
  stepLabelDone: { color: Colors.textPrimary, fontWeight: '600' },
  stepLabelActive: { color: Colors.primary, fontWeight: '700' },
  activeStepSub: { fontSize: 11, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  orderItemsSection: { marginBottom: 16, borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 16 },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  orderItemName: { flex: 2, fontSize: 13, color: Colors.textPrimary },
  orderItemQty: { flex: 1, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  orderItemTotal: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right' },
  addressSection: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 16, marginBottom: 16 },
  addressText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
