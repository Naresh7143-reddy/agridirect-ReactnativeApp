import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, ScrollView,
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

type RouteP = RouteProp<DeliveryStackParamList, 'DeliveryOrderDetail'>;
type NavP   = NativeStackNavigationProp<DeliveryStackParamList>;

const NEXT_STATUS: Record<string, { status: string; label: string; color: string }> = {
  assigned:   { status:'picked_up',  label:'Mark Picked Up',    color: Colors.primary },
  picked_up:  { status:'in_transit', label:'Start Delivery',    color: Colors.primary },
  in_transit: { status:'delivered',  label:'Mark Delivered',    color: Colors.success },
};

export default function DeliveryOrderDetailScreen() {
  const route = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const { orderId } = route.params;

  const [order, setOrder]     = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating]= useState(false);

  const load = useCallback(async () => {
    try {
      const res = await deliveryApi.getOrderById(orderId);
      setOrder(res.data);
    } catch { Alert.alert('Error', 'Could not load order'); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
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
        } catch { Alert.alert('Error', 'Could not update status'); }
        finally { setUpdating(false); }
      }},
    ]);
  };

  const callPerson = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;
  if (!order)  return <View style={s.center}><Text>Order not found</Text></View>;

  const next = NEXT_STATUS[order.status];

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Delivery #{order.orderNumber}</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Status */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Status</Text>
          <View style={[s.statusBadge,{backgroundColor: Colors.primary + '22'}]}>
            <Text style={[s.statusText,{color: Colors.primary}]}>{order.status.replace('_',' ').toUpperCase()}</Text>
          </View>
        </View>

        {/* Pickup */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.sectionTitle}>Pickup (Farmer)</Text>
            <TouchableOpacity style={s.callBtn} onPress={() => callPerson(order.farmerPhone)}>
              <Icon name="call" size={14} color={Colors.white}/>
              <Text style={s.callText}>Call</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.name}>{order.farmerName}</Text>
          <Text style={s.addr}>{order.pickupAddress}</Text>
        </View>

        {/* Drop */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.sectionTitle}>Delivery (Buyer)</Text>
            <TouchableOpacity style={s.callBtn} onPress={() => callPerson(order.buyerPhone)}>
              <Icon name="call" size={14} color={Colors.white}/>
              <Text style={s.callText}>Call</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.name}>{order.buyerName}</Text>
          {typeof order.dropAddress === 'string'
            ? <Text style={s.addr}>{order.dropAddress}</Text>
            : <>
                <Text style={s.addr}>{order.dropAddress.line1}, {order.dropAddress.city}</Text>
                <Text style={s.addr}>{order.dropAddress.state} - {order.dropAddress.pincode}</Text>
              </>
          }
        </View>

        {/* Earnings */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Your Earnings</Text>
          <Text style={s.earning}>₹{order.deliveryFee.toFixed(2)}</Text>
          {order.distance ? <Text style={s.dist}>{order.distance.toFixed(1)} km distance</Text> : null}
        </View>

        {/* Estimated delivery */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Estimated Delivery</Text>
          <Text style={s.addr}>{new Date(order.estimatedDelivery).toLocaleString('en-IN')}</Text>
        </View>
      </ScrollView>

      {/* Action button */}
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
                  <Icon name="checkmark-circle" size={20} color={Colors.white}/>
                  <Text style={s.actionText}>{next.label}</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  back:{padding:4},
  headerTitle:{fontSize:16,fontWeight:'700',color:Colors.textPrimary},
  scroll:{padding:spacing.base,gap:spacing.md},
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm},
  sectionTitle:{fontSize:13,fontWeight:'700',color:Colors.textSecondary,marginBottom:6,textTransform:'uppercase',letterSpacing:0.5},
  statusBadge:{alignSelf:'flex-start',borderRadius:borderRadius.full,paddingHorizontal:14,paddingVertical:6},
  statusText:{fontSize:13,fontWeight:'800'},
  rowBetween:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  callBtn:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:Colors.success,borderRadius:borderRadius.full,paddingHorizontal:12,paddingVertical:6},
  callText:{color:Colors.white,fontSize:12,fontWeight:'700'},
  name:{fontSize:15,fontWeight:'700',color:Colors.textPrimary,marginBottom:4},
  addr:{fontSize:13,color:Colors.textSecondary,lineHeight:20},
  earning:{fontSize:26,fontWeight:'800',color:Colors.primary},
  dist:{fontSize:13,color:Colors.textSecondary,marginTop:4},
  footer:{padding:spacing.base,backgroundColor:Colors.surface,borderTopWidth:1,borderTopColor:Colors.border},
  actionBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderRadius:borderRadius.lg,padding:spacing.base},
  actionText:{color:Colors.white,fontWeight:'700',fontSize:16},
  disabledBtn:{opacity:0.6},
});
