import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { formatPrice } from '../../utils/format';
import type { Order } from '../../types/order';
import type { AdminStackParamList } from '../../types/navigation';

type NavP = NativeStackNavigationProp<AdminStackParamList>;

const STATUS_COLOR: Record<string,string> = {
  PENDING:'#FF9800', ACCEPTED:'#2196F3', PACKED:'#9C27B0',
  PICKED_UP:'#00BCD4', IN_TRANSIT:'#3F51B5', DELIVERED:'#4CAF50',
  CANCELLED:'#F44336', REFUNDED:'#607D8B',
};

export default function AdminOrdersScreen() {
  const navigation = useNavigation<NavP>();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const [search, setSearch]     = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefresh(true); else setLoading(true);
    try {
      const res = await ordersApi.getAllOrders({ page: 0, limit: 50 });
      setOrders(res.data?.items ?? []);
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? orders.filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        (o.buyerName ?? '').toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>All Orders</Text>
        <Text style={s.sub}>{orders.length} total</Text>
      </View>

      <View style={s.searchWrap}>
        <Icon name="search-outline" size={18} color={Colors.textHint}/>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search order ID or buyer..."
          placeholderTextColor={Colors.textHint}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color={Colors.textHint}/>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={o => o.id}
          estimatedItemSize={90}
          renderItem={({ item }) => {
            const color = STATUS_COLOR[item.status] ?? Colors.textHint;
            return (
              <TouchableOpacity
                style={s.card}
                onPress={() => navigation.navigate('AdminOrderDetail',{orderId: item.id})}
                activeOpacity={0.85}
              >
                <View style={s.cardRow}>
                  <View>
                    <Text style={s.orderNum}>{item.orderNumber}</Text>
                    <Text style={s.buyer}>{item.buyerName ?? 'Buyer'}</Text>
                  </View>
                  <View style={[s.badge,{backgroundColor: color+'22'}]}>
                    <Text style={[s.badgeText,{color}]}>{item.status}</Text>
                  </View>
                </View>
                <View style={s.cardFooter}>
                  <Text style={s.amount}>{formatPrice(item.grandTotal)}</Text>
                  <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary}/>}
          ListEmptyComponent={<View style={s.center}><Text style={s.empty}>No orders found</Text></View>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:60},
  header:{padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  title:{fontSize:20,fontWeight:'800',color:Colors.textPrimary},
  sub:{fontSize:12,color:Colors.textSecondary,marginTop:2},
  searchWrap:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:Colors.surface,margin:spacing.sm,borderRadius:borderRadius.lg,paddingHorizontal:spacing.md,paddingVertical:10,borderWidth:1,borderColor:Colors.border},
  searchInput:{flex:1,fontSize:14,color:Colors.textPrimary,padding:0},
  list:{padding:spacing.sm},
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm,marginBottom:spacing.sm},
  cardRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  orderNum:{fontSize:14,fontWeight:'700',color:Colors.textPrimary},
  buyer:{fontSize:12,color:Colors.textSecondary,marginTop:2},
  badge:{borderRadius:borderRadius.full,paddingHorizontal:8,paddingVertical:3,alignSelf:'flex-start'},
  badgeText:{fontSize:11,fontWeight:'700'},
  cardFooter:{flexDirection:'row',justifyContent:'space-between',marginTop:8,paddingTop:6,borderTopWidth:1,borderTopColor:Colors.divider},
  amount:{fontSize:14,fontWeight:'700',color:Colors.primary},
  date:{fontSize:11,color:Colors.textSecondary},
  empty:{color:Colors.textSecondary,fontSize:14},
});
