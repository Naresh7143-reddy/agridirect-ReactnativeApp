import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { formatPrice } from '../../utils/format';
import type { Order, OrderStatus } from '../../types/order';
import type { BuyerStackParamList } from '../../navigation/types';

type RouteP = RouteProp<BuyerStackParamList, 'OrderDetail'>;
type NavP   = NativeStackNavigationProp<BuyerStackParamList>;

const STATUS_STEPS: OrderStatus[] = [
  'PENDING' as OrderStatus, 'ACCEPTED' as OrderStatus, 'PACKED' as OrderStatus,
  'PICKED_UP' as OrderStatus, 'IN_TRANSIT' as OrderStatus, 'DELIVERED' as OrderStatus,
];
const STATUS_LABELS: Record<string, string> = {
  PENDING:'Order Placed', ACCEPTED:'Accepted by Farmer', PACKED:'Packed & Ready',
  PICKED_UP:'Picked Up', IN_TRANSIT:'Out for Delivery', DELIVERED:'Delivered', CANCELLED:'Cancelled',
};
const STATUS_ICONS: Record<string, string> = {
  PENDING:'receipt-outline', ACCEPTED:'checkmark-circle-outline', PACKED:'cube-outline',
  PICKED_UP:'bicycle-outline', IN_TRANSIT:'car-outline', DELIVERED:'home-outline', CANCELLED:'close-circle-outline',
};

export default function OrderDetailScreen() {
  const route = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const { orderId } = route.params;

  const [order, setOrder]     = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await ordersApi.getOrderById(orderId);
      setOrder(res.data);
    } catch { Alert.alert('Error', 'Could not load order details'); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try { await ordersApi.cancel(orderId); load(); }
        catch { Alert.alert('Error', 'Could not cancel order'); }
      }},
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;
  if (!order)  return <View style={s.center}><Text style={s.err}>Order not found</Text></View>;

  const stepIndex   = STATUS_STEPS.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === 'CANCELLED';
  const canCancel   = ['PENDING','ACCEPTED'].includes(order.status);
  const canTrack    = ['PICKED_UP','IN_TRANSIT'].includes(order.status);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Details</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.orderNum}>{order.orderNumber}</Text>
            <View style={[s.badge,{backgroundColor: isCancelled ? Colors.errorLight : Colors.successLight}]}>
              <Text style={[s.badgeText,{color: isCancelled ? Colors.error : Colors.primary}]}>
                {STATUS_LABELS[order.status] ?? order.status}
              </Text>
            </View>
          </View>
          <Text style={s.date}>{new Date(order.createdAt).toLocaleString('en-IN')}</Text>
        </View>

        {!isCancelled && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Order Progress</Text>
            {STATUS_STEPS.map((step, i) => {
              const done = i <= stepIndex;
              const current = i === stepIndex;
              return (
                <View key={step} style={s.stepRow}>
                  <View style={s.stepLeft}>
                    <View style={[s.stepDot, done && s.stepDotDone, current && s.stepDotCurrent]}>
                      <Icon name={STATUS_ICONS[step]} size={13} color={done ? Colors.white : Colors.textHint}/>
                    </View>
                    {i < STATUS_STEPS.length - 1 && <View style={[s.stepLine, done && s.stepLineDone]}/>}
                  </View>
                  <Text style={[s.stepLabel, current && s.stepLabelCurrent]}>{STATUS_LABELS[step]}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={s.card}>
          <Text style={s.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map(item => (
            <View key={item.id} style={s.itemRow}>
              {item.productImage
                ? <FastImage source={{uri: item.productImage}} style={s.itemImg} resizeMode={FastImage.resizeMode.cover}/>
                : <View style={[s.itemImg,s.itemImgPlaceholder]}><Icon name="leaf" size={20} color={Colors.primary}/></View>
              }
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{item.productName}</Text>
                <Text style={s.itemSub}>by {item.farmerName ?? 'Farmer'}</Text>
                <Text style={s.itemSub}>{item.quantity} {item.unit} × {formatPrice(item.pricePerUnit)}</Text>
              </View>
              <Text style={s.itemTotal}>{formatPrice(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Price Details</Text>
          <View style={s.priceRow}><Text style={s.priceLabel}>Subtotal</Text><Text style={s.priceVal}>{formatPrice(order.totalAmount ?? 0)}</Text></View>
          <View style={s.priceRow}><Text style={s.priceLabel}>Delivery Fee</Text><Text style={s.priceVal}>{formatPrice(order.deliveryFee ?? 0)}</Text></View>
          {(order.discount ?? 0) > 0 && <View style={s.priceRow}><Text style={[s.priceLabel,{color:Colors.success}]}>Discount</Text><Text style={[s.priceVal,{color:Colors.success}]}>-{formatPrice(order.discount ?? 0)}</Text></View>}
          <View style={[s.priceRow,s.totalRow]}><Text style={s.totalLabel}>Total Paid</Text><Text style={s.totalVal}>{formatPrice(order.grandTotal ?? 0)}</Text></View>
          <View style={s.priceRow}><Text style={s.priceLabel}>Payment</Text><Text style={s.priceVal}>{order.paymentMethod} • {order.paymentStatus}</Text></View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Delivery Address</Text>
          <Text style={s.addrText}>{order.deliveryAddress?.line1 ?? ''}</Text>
          {order.deliveryAddress?.line2 ? <Text style={s.addrText}>{order.deliveryAddress.line2}</Text> : null}
          <Text style={s.addrText}>{order.deliveryAddress?.city ?? ''}{order.deliveryAddress?.state ? `, ${order.deliveryAddress.state}` : ''}{order.deliveryAddress?.pincode ? ` - ${order.deliveryAddress.pincode}` : ''}</Text>
        </View>

        {order.deliveryAgentName ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Delivery Agent</Text>
            <View style={s.agentRow}>
              <Icon name="person-circle" size={36} color={Colors.primary}/>
              <Text style={s.agentName}>{order.deliveryAgentName}</Text>
            </View>
          </View>
        ) : null}

        <View style={s.actions}>
          {canTrack && (
            <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('OrderTracking',{orderId})}>
              <Icon name="navigate" size={18} color={Colors.white}/>
              <Text style={s.primaryBtnText}>Track Order</Text>
            </TouchableOpacity>
          )}
          {order.status === 'DELIVERED' && (
            <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('RateReview',{orderId})}>
              <Icon name="star" size={18} color={Colors.white}/>
              <Text style={s.primaryBtnText}>Rate & Review</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
              <Text style={s.cancelBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  err:{color:Colors.textSecondary},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  back:{padding:4},
  headerTitle:{fontSize:17,fontWeight:'700',color:Colors.textPrimary},
  scroll:{padding:spacing.base,gap:spacing.md},
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  orderNum:{fontSize:15,fontWeight:'700',color:Colors.textPrimary},
  badge:{borderRadius:borderRadius.full,paddingHorizontal:10,paddingVertical:4},
  badgeText:{fontSize:12,fontWeight:'600'},
  date:{fontSize:12,color:Colors.textSecondary,marginTop:4},
  sectionTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:spacing.sm},
  stepRow:{flexDirection:'row',alignItems:'flex-start',marginBottom:2},
  stepLeft:{alignItems:'center',width:28},
  stepDot:{width:26,height:26,borderRadius:13,backgroundColor:Colors.divider,alignItems:'center',justifyContent:'center'},
  stepDotDone:{backgroundColor:Colors.primary},
  stepDotCurrent:{backgroundColor:Colors.primary,...shadow.sm},
  stepLine:{width:2,height:22,backgroundColor:Colors.divider,marginVertical:2},
  stepLineDone:{backgroundColor:Colors.primary},
  stepLabel:{marginLeft:spacing.sm,fontSize:13,color:Colors.textSecondary,paddingTop:4},
  stepLabelCurrent:{color:Colors.primary,fontWeight:'600'},
  itemRow:{flexDirection:'row',alignItems:'center',gap:spacing.sm,paddingVertical:spacing.xs,borderBottomWidth:1,borderBottomColor:Colors.divider},
  itemImg:{width:52,height:52,borderRadius:borderRadius.sm,backgroundColor:Colors.background},
  itemImgPlaceholder:{alignItems:'center',justifyContent:'center'},
  itemInfo:{flex:1},
  itemName:{fontSize:13,fontWeight:'600',color:Colors.textPrimary},
  itemSub:{fontSize:11,color:Colors.textSecondary,marginTop:2},
  itemTotal:{fontSize:13,fontWeight:'700',color:Colors.primary},
  priceRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:4},
  priceLabel:{fontSize:13,color:Colors.textSecondary},
  priceVal:{fontSize:13,color:Colors.textPrimary,fontWeight:'500'},
  totalRow:{borderTopWidth:1,borderTopColor:Colors.divider,marginTop:6,paddingTop:8},
  totalLabel:{fontSize:15,fontWeight:'700',color:Colors.textPrimary},
  totalVal:{fontSize:15,fontWeight:'700',color:Colors.primary},
  addrText:{fontSize:13,color:Colors.textSecondary,lineHeight:20},
  agentRow:{flexDirection:'row',alignItems:'center',gap:spacing.sm},
  agentName:{fontSize:14,fontWeight:'600',color:Colors.textPrimary},
  actions:{gap:spacing.sm,paddingBottom:spacing.xl},
  primaryBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:Colors.primary,borderRadius:borderRadius.lg,padding:spacing.base},
  primaryBtnText:{color:Colors.white,fontWeight:'700',fontSize:15},
  cancelBtn:{borderWidth:1,borderColor:Colors.error,borderRadius:borderRadius.lg,padding:spacing.base,alignItems:'center'},
  cancelBtnText:{color:Colors.error,fontWeight:'600'},
});
