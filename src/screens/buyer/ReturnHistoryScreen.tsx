import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { returnsApi } from '../../api/returns';
import type { ReturnRequest } from '../../types/return';

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: Colors.warningLight, text: Colors.warning },
  APPROVED: { bg: Colors.successLight, text: Colors.success },
  REFUNDED: { bg: Colors.successLight, text: Colors.success },
  REJECTED: { bg: Colors.errorLight || '#FFEBEE', text: Colors.error },
};

export default function ReturnHistoryScreen() {
  const navigation = useNavigation();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReturns = useCallback(async () => {
    try {
      const res = await returnsApi.getBuyerReturns();
      setReturns(res.data || []);
    } catch {
      setReturns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const renderItem = ({ item }: { item: ReturnRequest }) => {
    const style = STATUS_COLOR[item.status] || { bg: Colors.border, text: Colors.textSecondary };

    return (
      <View style={s.card}>
        <View style={s.rowBetween}>
          <Text style={s.orderId}>Order #{item.orderId.slice(0, 8)}</Text>
          <View style={[s.badge, { backgroundColor: style.bg }]}>
            <Text style={[s.badgeText, { color: style.text }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={s.reason}>Reason: {item.reason.replace('_', ' ')}</Text>
        <Text style={s.desc}>{item.description}</Text>

        {item.refundAmount > 0 && (
          <Text style={s.refundText}>Refund Amount: ₹{item.refundAmount.toFixed(2)}</Text>
        )}

        {item.status === 'REJECTED' && !!item.rejectionReason && (
          <Text style={s.rejectionText}>Farmer Note: {item.rejectionReason}</Text>
        )}
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
        <Text style={s.title}>My Returns & Refunds</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={returns}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReturns(); }} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Icon name="swap-horizontal-outline" size={64} color={Colors.textHint} />
            <Text style={s.emptyTitle}>No Returns Requested</Text>
            <Text style={s.emptySub}>Your return and refund requests will appear here.</Text>
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  reason: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 8 },
  desc: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  refundText: { fontSize: 14, fontWeight: '800', color: Colors.success, marginTop: 8 },
  rejectionText: { fontSize: 12, color: Colors.error, marginTop: 6, fontStyle: 'italic' },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
