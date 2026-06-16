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
import type { Order } from '../../types/order';
import type { BuyerStackParamList } from '../../navigation/types';

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

export const OrderTrackingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const route = useRoute<RouteProp<BuyerStackParamList, 'OrderTracking'>>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(15 * 60); // 15 min ETA

  const sheetY = useRef(new Animated.Value(SNAP_POINTS[1])).current;
  const lastY = useRef(SNAP_POINTS[1]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    ordersApi.getOrderById(orderId).then((r: any) => {
      setOrder(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
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
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapContent}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Live tracking map</Text>
          <View style={styles.agentDot} />
        </View>
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
            {/* Collapsed view: agent + ETA */}
            <View style={styles.topRow}>
              <View style={styles.agentInfo}>
                <View style={styles.agentAvatar}>
                  <Text style={styles.agentAvatarText}>🧑</Text>
                </View>
                <View>
                  <Text style={styles.agentName}>Delivery Agent</Text>
                  <Text style={styles.agentSub}>on the way</Text>
                </View>
              </View>
              <View style={styles.etaBox}>
                <Text style={styles.etaLabel}>ETA</Text>
                <Text style={styles.etaTime}>{formatCountdown(countdown)}</Text>
              </View>
            </View>

            {/* Status Stepper */}
            <View style={styles.stepperContainer}>
              <Text style={styles.sectionTitle}>Order Status</Text>
              {STATUS_STEPS.map((step, index) => {
                const done = index <= currentStepIndex;
                const active = index === currentStepIndex;
                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={{ alignItems: 'center', marginRight: 14 }}>
                      <View style={[styles.stepCircle, done && styles.stepCircleDone, active && styles.stepCircleActive]}>
                        <Text style={styles.stepIcon}>{done ? '✓' : step.icon}</Text>
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View style={[styles.stepLine, done && styles.stepLineDone]} />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Expanded: items + address */}
            <View style={styles.orderItemsSection}>
              <Text style={styles.sectionTitle}>Items</Text>
              {order.items?.map((item: any) => (
                <View key={item.id} style={styles.orderItemRow}>
                  <Text style={styles.orderItemName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.orderItemQty}>x{item.quantity} {item.unit}</Text>
                  <Text style={styles.orderItemTotal}>₹{item.total?.toFixed(0) || (item.pricePerUnit * item.quantity).toFixed(0)}</Text>
                </View>
              ))}
            </View>

            {order.deliveryAddress && (
              <View style={styles.addressSection}>
                <Text style={styles.sectionTitle}>Delivering to</Text>
                <Text style={styles.addressText}>
                  {order.deliveryAddress.line1}{order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}
                </Text>
                <Text style={styles.addressText}>
                  {order.deliveryAddress.city}, {order.deliveryAddress.state}
                </Text>
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
  stepContent: { flex: 1, paddingTop: 4, paddingBottom: 20 },
  stepLabel: { fontSize: 13, color: Colors.textHint },
  stepLabelDone: { color: Colors.textPrimary, fontWeight: '600' },
  orderItemsSection: { marginBottom: 12 },
  orderItemRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  orderItemName: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  orderItemQty: { fontSize: 13, color: Colors.textHint, marginHorizontal: 8 },
  orderItemTotal: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  addressSection: { marginBottom: 32 },
  addressText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
