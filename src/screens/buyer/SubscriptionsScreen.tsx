import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { subscriptionsApi } from '../../api/subscriptions';
import type { Subscription, SubscriptionStatus } from '../../types/subscription';

export default function SubscriptionsScreen() {
  const navigation = useNavigation();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await subscriptionsApi.getMySubscriptions();
      setSubscriptions(res.data || []);
    } catch {
      // Fallback empty list on error
      setSubscriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleStatusChange = async (id: string, currentStatus: SubscriptionStatus) => {
    const newStatus: SubscriptionStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    Alert.alert(
      `${newStatus === 'ACTIVE' ? 'Resume' : 'Pause'} Subscription`,
      `Are you sure you want to ${newStatus.toLowerCase()} this recurring delivery?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdatingId(id);
            try {
              await subscriptionsApi.updateStatus(id, newStatus);
              fetchSubscriptions();
            } catch {
              Alert.alert('Error', 'Could not update subscription status');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (id: string) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to permanently cancel this subscription?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setUpdatingId(id);
            try {
              await subscriptionsApi.cancel(id);
              fetchSubscriptions();
            } catch {
              Alert.alert('Error', 'Could not cancel subscription');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Subscription }) => {
    const isActive = item.status === 'ACTIVE';
    const isPaused = item.status === 'PAUSED';

    return (
      <View style={s.card}>
        <View style={s.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="repeat" size={18} color={Colors.primary} />
            <Text style={s.freq}>{item.frequency.toUpperCase()} DELIVERY</Text>
          </View>
          <View style={[s.badge, { backgroundColor: isActive ? Colors.successLight : Colors.warningLight }]}>
            <Text style={[s.badgeText, { color: isActive ? Colors.success : Colors.warning }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={s.cost}>₹{item.totalCostPerDelivery.toFixed(2)} / delivery</Text>
        <Text style={s.nextDate}>Next Delivery: {item.nextDeliveryDate || 'Scheduled'}</Text>
        <Text style={s.address} numberOfLines={1}>📍 {item.deliveryAddress}</Text>

        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: isActive ? Colors.warning : Colors.primary }]}
            onPress={() => handleStatusChange(item.id, item.status)}
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={s.btnText}>{isActive ? 'Pause' : 'Resume'}</Text>
            )}
          </TouchableOpacity>

          {item.status !== 'CANCELLED' && (
            <TouchableOpacity
              style={[s.btn, s.btnOutline]}
              onPress={() => handleCancel(item.id)}
              disabled={updatingId === item.id}
            >
              <Text style={s.btnOutlineText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Fresh Produce Subscriptions</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubscriptions(); }} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Icon name="calendar-outline" size={64} color={Colors.textHint} />
            <Text style={s.emptyTitle}>No Active Subscriptions</Text>
            <Text style={s.emptySub}>
              Subscribe to daily fresh milk, fruits, or organic veggies for automated deliveries!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  list: { padding: spacing.base, gap: spacing.base },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadow.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  freq: { fontSize: 12, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  cost: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 8 },
  nextDate: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  address: { fontSize: 12, color: Colors.textHint, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, borderRadius: borderRadius.md, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  btnOutline: { borderWidth: 1, borderColor: Colors.error, backgroundColor: 'transparent' },
  btnOutlineText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
