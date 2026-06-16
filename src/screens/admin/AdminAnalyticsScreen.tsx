import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { adminApi } from '../../api/admin';
import { formatPrice } from '../../utils/format';
import type { AdminAnalytics } from '../../types/admin';

interface KpiProps { icon: string; label: string; value: string; color: string }

function KpiCard({ icon, label, value, color }: KpiProps) {
  return (
    <View style={[s.kpiCard, { borderLeftColor: color }]}>
      <View style={[s.kpiIcon, { backgroundColor: color + '22' }]}>
        <Icon name={icon} size={20} color={color}/>
      </View>
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function AdminAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefresh(true); else setLoading(true);
    try {
      const res = await adminApi.getAnalytics();
      setAnalytics(res.data);
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;
  if (!analytics) return <View style={s.center}><Text style={s.err}>Could not load analytics</Text></View>;

  const a = analytics;

  return (
    <ScrollView
      style={s.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary}/>}
    >
      <Text style={s.sectionTitle}>Today</Text>
      <View style={s.kpiGrid}>
        <KpiCard icon="cash-outline"    label="Revenue Today"  value={formatPrice(a.todayRevenue)} color={Colors.primary}/>
        <KpiCard icon="receipt-outline" label="Orders Today"   value={String(a.todayOrders)}       color="#2196F3"/>
      </View>

      <Text style={s.sectionTitle}>Platform Overview</Text>
      <View style={s.kpiGrid}>
        <KpiCard icon="people-outline"       label="Total Users"    value={String(a.totalUsers)}          color="#9C27B0"/>
        <KpiCard icon="leaf-outline"         label="Farmers"        value={String(a.totalFarmers)}        color={Colors.success}/>
        <KpiCard icon="cart-outline"         label="Buyers"         value={String(a.totalBuyers)}         color="#FF9800"/>
        <KpiCard icon="bicycle-outline"      label="Delivery"       value={String(a.totalDeliveryAgents)} color="#00BCD4"/>
        <KpiCard icon="bag-outline"          label="Active Products"value={String(a.activeProducts)}      color="#3F51B5"/>
        <KpiCard icon="trending-up-outline"  label="Total Revenue"  value={formatPrice(a.totalRevenue)}   color={Colors.primary}/>
      </View>

      <Text style={s.sectionTitle}>Pending Actions</Text>
      <View style={s.pendingCard}>
        <View style={s.pendingRow}>
          <View style={s.pendingLeft}>
            <Icon name="shield-outline" size={20} color={Colors.warning ?? '#FF9800'}/>
            <Text style={s.pendingLabel}>Farmer Verifications</Text>
          </View>
          <View style={[s.countBadge,{backgroundColor:(Colors.warning ?? '#FF9800')+'22'}]}>
            <Text style={[s.countText,{color: Colors.warning ?? '#FF9800'}]}>{a.pendingFarmerApprovals}</Text>
          </View>
        </View>
        <View style={s.pendingRow}>
          <View style={s.pendingLeft}>
            <Icon name="cube-outline" size={20} color="#9C27B0"/>
            <Text style={s.pendingLabel}>Product Approvals</Text>
          </View>
          <View style={[s.countBadge,{backgroundColor:'#9C27B022'}]}>
            <Text style={[s.countText,{color:'#9C27B0'}]}>{a.pendingProductApprovals}</Text>
          </View>
        </View>
      </View>

      {a.ordersByStatus && Object.keys(a.ordersByStatus).length > 0 && (
        <>
          <Text style={s.sectionTitle}>Orders by Status</Text>
          <View style={s.statusCard}>
            {Object.entries(a.ordersByStatus).map(([status, count]) => (
              <View key={status} style={s.statusRow}>
                <Text style={s.statusLabel}>{status}</Text>
                <Text style={s.statusCount}>{count}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={s.sectionTitle}>This Month</Text>
      <View style={s.kpiGrid}>
        <KpiCard icon="person-add-outline" label="New Users"  value={String(a.newUsersThisMonth)} color="#FF5722"/>
        <KpiCard icon="receipt-outline"    label="Total Orders" value={String(a.totalOrders)}     color="#607D8B"/>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  err:{color:Colors.textSecondary},
  scroll:{padding:spacing.base,paddingBottom:40},
  sectionTitle:{fontSize:15,fontWeight:'800',color:Colors.textPrimary,marginTop:spacing.base,marginBottom:spacing.sm},
  kpiGrid:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm},
  kpiCard:{flex:1,minWidth:'45%',backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.md,...shadow.sm,borderLeftWidth:4},
  kpiIcon:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',marginBottom:8},
  kpiValue:{fontSize:20,fontWeight:'800',color:Colors.textPrimary},
  kpiLabel:{fontSize:11,color:Colors.textSecondary,marginTop:2},
  pendingCard:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm,gap:spacing.sm},
  pendingRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:6},
  pendingLeft:{flexDirection:'row',alignItems:'center',gap:10},
  pendingLabel:{fontSize:14,color:Colors.textPrimary,fontWeight:'500'},
  countBadge:{borderRadius:borderRadius.full,paddingHorizontal:12,paddingVertical:4},
  countText:{fontSize:14,fontWeight:'800'},
  statusCard:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm},
  statusRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:1,borderBottomColor:Colors.divider},
  statusLabel:{fontSize:13,color:Colors.textSecondary},
  statusCount:{fontSize:13,fontWeight:'700',color:Colors.textPrimary},
});
