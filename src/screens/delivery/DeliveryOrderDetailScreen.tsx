import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { deliveryApi } from '../../api/delivery';
import type { DeliveryOrder } from '../../types/delivery';
import type { DeliveryStackParamList } from '../../types/navigation';
import AdvancedMapView from '../../components/map/AdvancedMapView';

type RouteP = RouteProp<DeliveryStackParamList, 'DeliveryOrderDetail'>;
type NavP   = NativeStackNavigationProp<DeliveryStackParamList>;

const NEXT_STATUS: Record<string, { status: string; label: string; color: string }> = {
  assigned:   { status:'picked_up',  label:'Mark Picked Up',    color: Colors.primary },
  packed:     { status:'picked_up',  label:'Mark Picked Up',    color: Colors.primary },
  picked_up:  { status:'in_transit', label:'Start Delivery',    color: Colors.primary },
  in_transit: { status:'delivered',  label:'Mark Delivered',    color: Colors.success },
};

export default function DeliveryOrderDetailScreen() {
  const route = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const { orderId } = route.params;
  const initialData = (route.params as any)?.initialOrder ?? (route.params as any)?.order ?? null;

  const [order, setOrder]     = useState<DeliveryOrder | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [updating, setUpdating]= useState(false);

  const load = useCallback(async () => {
    if (!order) setLoading(true);
    try {
      const res = await deliveryApi.getOrderById(orderId);
      const fetched = res?.data ?? res;
      if (fetched) setOrder(fetched);
    } catch {
      if (!order) {
        Alert.alert('Error', 'Could not load order details');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, order]);

  useEffect(() => { load(); }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status.toLowerCase()];
    if (!next) return;

    if (next.status === 'delivered') {
      navigation.navigate('DeliveryNavigation', {
          orderId: order.orderId,
          pickupLat: order.pickupLat ?? 0,
          pickupLng: order.pickupLng ?? 0,
          dropLat: order.dropLat ?? 0,
          dropLng: order.dropLng ?? 0,
        });
      return;
    }

    Alert.alert('Update Status', `Mark as "${next.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        setUpdating(true);
        try {
          await deliveryApi.updateOrderStatus(orderId, next.status as any);
          load();
        } catch (err: any) {
          const msg = err?.message || err?.response?.data?.message || 'Could not update status';
          if (msg.includes('PACKED') || msg.includes('packed')) {
            Alert.alert(
              'Waiting for Farmer',
              'Farmer has not marked this order as PACKED yet. Please ask the farmer to tap "Mark as Packed" on their AgriDirect app before pickup.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('Update Failed', msg);
          }
        }
        finally { setUpdating(false); }
      }},
    ]);
  };

  const callPerson = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;
  if (!order)  return <View style={s.center}><Text>Order not found</Text></View>;

  const next = NEXT_STATUS[order.status.toLowerCase()];

  return (
    <View style={s.root}>
      {/* Full Screen Map */}
      <View style={StyleSheet.absoluteFill}>
        <AdvancedMapView
          mode="navigation"
          style={StyleSheet.absoluteFill}
          pickupLocation={{ latitude: order.pickupLat || 13.0827, longitude: order.pickupLng || 80.2707, title: order.farmerName || 'Farmer Pickup' }}
          dropoffLocation={{ latitude: order.dropLat || 13.075, longitude: order.dropLng || 80.28, title: order.buyerName || 'Buyer Dropoff' }}
          driverLocation={{ latitude: order.pickupLat ? (order.pickupLat + 0.003) : 13.08, longitude: order.pickupLng ? (order.pickupLng + 0.002) : 80.275 }}
          vehicleType="BIKE"
          theme="swiggy"
        />
      </View>

      {/* Floating Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.floatingBack}>
        <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Floating Navigation Button */}
      <TouchableOpacity 
        style={s.floatingNavBtn}
        onPress={() => {
          navigation.navigate('DeliveryNavigation', {
            orderId: order.orderId,
            pickupLat: order.pickupLat ?? 13.0827,
            pickupLng: order.pickupLng ?? 80.2707,
            dropLat: order.dropLat ?? 13.075,
            dropLng: order.dropLng ?? 80.28,
          });
        }}
      >
        <Icon name="navigate-circle" size={22} color={Colors.white} />
        <Text style={s.floatingNavText}>Turn-by-Turn</Text>
      </TouchableOpacity>

      {/* Bottom Sheet Overlay */}
      <View style={s.bottomSheet}>
        <View style={s.dragHandle} />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetContent}>
          <View style={s.rowBetween}>
            <Text style={s.orderNumHeader}>Delivery #{order.orderNumber}</Text>
            <View style={[s.statusBadge,{backgroundColor: Colors.primary + '22'}]}>
              <Text style={[s.statusText,{color: Colors.primary}]}>{order.status.replace('_',' ').toUpperCase()}</Text>
            </View>
          </View>

          {/* Earnings row */}
          <View style={s.earningsRow}>
            <View>
              <Text style={s.sectionTitle}>Your Earnings</Text>
              <Text style={s.earning}>₹{order.deliveryFee?.toFixed(0) || 0}</Text>
            </View>
            {order.distance ? (
              <View style={s.distanceBadge}>
                <Icon name="bicycle" size={16} color={Colors.white} />
                <Text style={s.distanceText}>{order.distance.toFixed(1)} km</Text>
              </View>
            ) : null}
          </View>

          {/* Pickup */}
          <View style={s.locationCard}>
            <View style={s.locationIconWrap}>
              <Icon name="storefront" size={20} color={Colors.primary} />
            </View>
            <View style={s.locationInfo}>
              <Text style={s.sectionTitle}>Pickup (Farmer)</Text>
              <Text style={s.name}>{order.farmerName}</Text>
              <Text style={s.addr} numberOfLines={2}>{order.pickupAddress}</Text>
            </View>
            <TouchableOpacity style={s.callCircleBtn} onPress={() => callPerson(order.farmerPhone)}>
              <Icon name="call" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={s.dottedLine} />

          {/* Drop */}
          <View style={s.locationCard}>
            <View style={[s.locationIconWrap, { backgroundColor: Colors.error + '22' }]}>
              <Icon name="home" size={20} color={Colors.error} />
            </View>
            <View style={s.locationInfo}>
              <Text style={s.sectionTitle}>Dropoff (Buyer)</Text>
              <Text style={s.name}>{order.buyerName}</Text>
              <Text style={s.addr} numberOfLines={2}>
                {typeof order.dropAddress === 'string'
                  ? order.dropAddress
                  : `${order.dropAddress?.line1}, ${order.dropAddress?.city}`
                }
              </Text>
            </View>
            <TouchableOpacity style={[s.callCircleBtn, { backgroundColor: Colors.error }]} onPress={() => callPerson(order.buyerPhone)}>
              <Icon name="call" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Action button pinned to bottom */}
        {next && (
          <View style={s.footer}>
            <TouchableOpacity
              style={[s.actionBtn,{backgroundColor: next.color}, updating && s.disabledBtn]}
              onPress={handleStatusUpdate}
              disabled={updating}
            >
              {updating
                ? <ActivityIndicator color={Colors.white} size="small"/>
                : <>
                    <Icon name="checkmark-done-circle" size={22} color={Colors.white}/>
                    <Text style={s.actionText}>{next.label}</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  floatingBack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    backgroundColor: Colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.md,
  },
  floatingNavBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    ...shadow.md,
  },
  floatingNavText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
    minHeight: '40%',
    ...shadow.lg,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: 20,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  orderNumHeader: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: borderRadius.lg,
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  earning: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  distanceText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  locationInfo: {
    flex: 1,
  },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  addr: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, paddingRight: 10 },
  callCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  dottedLine: {
    width: 2,
    height: 30,
    backgroundColor: Colors.border,
    marginLeft: 19,
    marginVertical: 4,
    borderStyle: 'dashed',
  },
  footer: { padding: spacing.lg, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: borderRadius.lg, paddingVertical: 16 },
  actionText: { color: Colors.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  disabledBtn: { opacity: 0.6 },
});
