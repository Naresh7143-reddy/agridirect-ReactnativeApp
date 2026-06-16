import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { formatPrice } from '../../utils/format';
import type { Order, OrderStatus } from '../../types/order';
import type { AdminStackParamList } from '../../types/navigation';

type RouteP = RouteProp<AdminStackParamList, 'AdminOrderDetail'>;
type NavP   = NativeStackNavigationProp<AdminStackParamList>;

const ALL_STATUSES: OrderStatus[] = ['PENDING','ACCEPTED','PACKED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED'] as OrderStatus[];

export default function AdminOrderDetailScreen() {
  const route = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const { orderId } = route.params;

  const [order, setOrder]     = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try { const res = await ordersApi.getOrderById(orderId); setOrder(res.data); }
    catch { Alert.alert('Error','Could not load order'); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = (status: OrderStatus) => {
    Alert.alert('Change Status', `Set order to "${status}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        setUpdating(true);
        try {
          await ordersApi.updateStatus(orderId, status);
          Toast.show({ type:'success', text1:'Status updated' });
          load();
        } catch { Toast.show({ type:'error', text1:'Failed to update status' }); }
        finally { setUpdating(false); }
      }},
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;
  if (!order)  return <View style={s.center}><Text>Order not found</Text></View>;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{order.orderNumber}</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <Text style={s.sectionTitle}>Order Info</Text>
          <Row label="Buyer" value={order.buyerName ?? '-'}/>
          <Row label="Phone" value={order.buyerPhone ?? '-'}/>
          <Row label="Status" value={order.status}/>
          <Row label="Payment" value={`${order.paymentMethod} • ${order.paymentStatus}`}/>
          <Row label="Total" value={formatPrice(order.grandTotal)}/>
          <Row label="Date" value={new Date(order.createdAt).toLocaleString('en-IN')}/>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Items</Text>
          {order.items.map(item => (
            <View key={item.id} style={s.itemRow}>
              <Text style={s.itemName} numberOfLines={1}>{item.productName}</Text>
              <Text style={s.itemQty}>{item.quantity} {item.unit}</Text>
              <Text style={s.itemAmt}>{formatPrice(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Delivery Address</Text>
          <Text style={s.addr}>{order.deliveryAddress.line1}</Text>
          {order.deliveryAddress.line2 ? <Text style={s.addr}>{order.deliveryAddress.line2}</Text> : null}
          <Text style={s.addr}>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Change Status</Text>
          <View style={s.statusGrid}>
            {ALL_STATUSES.map(st => (
              <TouchableOpacity
                key={st}
                style={[s.statusBtn, order.status === st && s.statusBtnActive]}
                onPress={() => order.status !== st && handleStatusChange(st)}
                disabled={updating || order.status === st}
              >
                <Text style={[s.statusBtnText, order.status === st && s.statusBtnTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowVal}>{value}</Text>
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
  sectionTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:spacing.sm},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:5,borderBottomWidth:1,borderBottomColor:Colors.divider},
  rowLabel:{fontSize:13,color:Colors.textSecondary},
  rowVal:{fontSize:13,fontWeight:'600',color:Colors.textPrimary,flex:1,textAlign:'right'},
  itemRow:{flexDirection:'row',alignItems:'center',paddingVertical:5,borderBottomWidth:1,borderBottomColor:Colors.divider},
  itemName:{flex:1,fontSize:13,color:Colors.textPrimary},
  itemQty:{fontSize:12,color:Colors.textSecondary,marginHorizontal:8},
  itemAmt:{fontSize:13,fontWeight:'700',color:Colors.primary},
  addr:{fontSize:13,color:Colors.textSecondary,lineHeight:20},
  statusGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  statusBtn:{borderWidth:1,borderColor:Colors.border,borderRadius:borderRadius.sm,paddingHorizontal:10,paddingVertical:6},
  statusBtnActive:{backgroundColor:Colors.primary,borderColor:Colors.primary},
  statusBtnText:{fontSize:12,color:Colors.textSecondary},
  statusBtnTextActive:{color:Colors.white,fontWeight:'700'},
});
