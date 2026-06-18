import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { deliveryApi } from '../../api/delivery';
import type { DeliveryOrder } from '../../types/delivery';
import type { DeliveryStackParamList } from '../../types/navigation';

type NavP = NativeStackNavigationProp<DeliveryStackParamList>;

const STATUS_COLOR: Record<string, string> = {
  assigned: Colors.warning ?? '#FF9800',
  picked_up: Colors.info ?? '#2196F3',
  in_transit: Colors.primary,
  delivered: Colors.success,
  failed: Colors.error,
};
const STATUS_LABEL: Record<string, string> = {
  assigned:'Assigned', picked_up:'Picked Up', in_transit:'In Transit',
  delivered:'Delivered', failed:'Failed',
};

const TABS = ['Active','Completed'];
const ACTIVE_STATUSES   = ['assigned','picked_up','in_transit'];
const COMPLETE_STATUSES = ['delivered','failed'];

function DeliveryCard({ order, onPress }: { order: DeliveryOrder; onPress: () => void }) {
  const color = STATUS_COLOR[order.status] ?? Colors.textHint;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          <Text style={s.orderNum}>#{order.orderNumber}</Text>
          <Text style={s.buyerName}>{order.buyerName}</Text>
        </View>
        <View style={[s.badge,{backgroundColor: color + '22'}]}>
          <Text style={[s.badgeText,{color}]}>{STATUS_LABEL[order.status]}</Text>
        </View>
      </View>
      <View style={s.divider}/>
      <View style={s.addrRow}>
        <Icon name="location-outline" size={14} color={Colors.primary}/>
        <Text style={s.addrText} numberOfLines={1}>
          {typeof order.dropAddress === 'string'
            ? order.dropAddress
            : `${order.dropAddress.line1}, ${order.dropAddress.city}`}
        </Text>
      </View>
      <View style={s.addrRow}>
        <Icon name="leaf-outline" size={14} color={Colors.success}/>
        <Text style={s.addrText} numberOfLines={1}>Pickup: {order.pickupAddress}</Text>
      </View>
      <View style={s.cardBottom}>
        <Text style={s.fee}>₹{order.deliveryFee.toFixed(0)} earnings</Text>
        {order.distance ? <Text style={s.dist}>{order.distance.toFixed(1)} km</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function DeliveriesScreen() {
  const navigation = useNavigation<NavP>();
  const [tab, setTab]           = useState(0);
  const [orders, setOrders]     = useState<DeliveryOrder[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefresh(true); else setLoading(true);
    try {
      // Merge assigned + available pool so the agent always sees something
      // to pick up — Swiggy/Zomato model.
      const [assigned, available] = await Promise.all([
        deliveryApi.getAssignedOrders().catch(() => ({ data: { items: [] } } as any)),
        deliveryApi.getAvailableOrders().catch(() => ({ data: [] } as any)),
      ]);
      const assignedList = (assigned as any).data?.items ?? (assigned as any).data ?? [];
      const availableList = Array.isArray((available as any).data) ? (available as any).data : [];
      const seen = new Set<string>();
      const merged = [...assignedList, ...availableList].filter((o: any) => {
        if (!o?.id || seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
      setOrders(merged);
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o =>
    tab === 0 ? ACTIVE_STATUSES.includes(o.status) : COMPLETE_STATUSES.includes(o.status)
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>My Deliveries</Text>
      </View>

      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[s.tab, tab===i && s.tabActive]} onPress={() => setTab(i)}>
            <Text style={[s.tabText, tab===i && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={o => o.id}
          estimatedItemSize={130}
          renderItem={({item}) => (
            <DeliveryCard order={item} onPress={() => navigation.navigate('DeliveryOrderDetail',{orderId: item.id})}/>
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary}/>}
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="cube-outline" size={64} color={Colors.border}/>
              <Text style={s.emptyTitle}>No {TABS[tab].toLowerCase()} deliveries</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  header:{padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  headerTitle:{fontSize:20,fontWeight:'800',color:Colors.textPrimary},
  tabs:{flexDirection:'row',backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  tab:{flex:1,paddingVertical:12,alignItems:'center'},
  tabActive:{borderBottomWidth:2,borderBottomColor:Colors.primary},
  tabText:{fontSize:14,color:Colors.textSecondary,fontWeight:'500'},
  tabTextActive:{color:Colors.primary,fontWeight:'700'},
  list:{padding:spacing.base},
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm,marginBottom:spacing.sm},
  cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  cardLeft:{flex:1},
  orderNum:{fontSize:14,fontWeight:'700',color:Colors.textPrimary},
  buyerName:{fontSize:12,color:Colors.textSecondary,marginTop:2},
  badge:{borderRadius:borderRadius.full,paddingHorizontal:10,paddingVertical:4,alignSelf:'flex-start'},
  badgeText:{fontSize:11,fontWeight:'700'},
  divider:{height:1,backgroundColor:Colors.divider,marginVertical:8},
  addrRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  addrText:{flex:1,fontSize:12,color:Colors.textSecondary},
  cardBottom:{flexDirection:'row',justifyContent:'space-between',marginTop:6},
  fee:{fontSize:13,fontWeight:'700',color:Colors.primary},
  dist:{fontSize:12,color:Colors.textSecondary},
  empty:{alignItems:'center',justifyContent:'center',paddingTop:80,gap:12},
  emptyTitle:{fontSize:15,color:Colors.textSecondary,fontWeight:'600'},
});
