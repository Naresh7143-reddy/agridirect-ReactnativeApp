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
import { returnsApi } from '../../api/returns';
import type { ReturnRequest } from '../../types/return';

export default function FarmerReturnsScreen() {
  const navigation = useNavigation();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReturns = useCallback(async () => {
    try {
      const res = await returnsApi.getFarmerReturns();
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

  const handleApprove = async (id: string) => {
    Alert.alert('Approve Return', 'Approve this return request and initiate buyer refund?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve & Refund',
        onPress: async () => {
          setProcessingId(id);
          try {
            await returnsApi.approve(id);
            fetchReturns();
          } catch {
            Alert.alert('Error', 'Could not approve return.');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const handleReject = async (id: string) => {
    Alert.prompt(
      'Reject Return',
      'Please enter the reason for rejecting this return request:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Request',
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason) return;
            setProcessingId(id);
            try {
              await returnsApi.reject(id, reason);
              fetchReturns();
            } catch {
              Alert.alert('Error', 'Could not reject return.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderItem = ({ item }: { item: ReturnRequest }) => {
    const isPending = item.status === 'PENDING';

    return (
      <View style={s.card}>
        <View style={s.rowBetween}>
          <Text style={s.orderId}>Order #{item.orderId.slice(0, 8)}</Text>
          <View style={[s.badge, { backgroundColor: isPending ? Colors.warningLight : Colors.successLight }]}>
            <Text style={[s.badgeText, { color: isPending ? Colors.warning : Colors.success }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={s.buyerName}>Buyer: {item.buyerName || 'Customer'}</Text>
        <Text style={s.reason}>Issue: {item.reason.replace('_', ' ')}</Text>
        <Text style={s.desc}>{item.description}</Text>

        {isPending && (
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: Colors.success }]}
              onPress={() => handleApprove(item.id)}
              disabled={processingId === item.id}
            >
              {processingId === item.id ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={s.btnText}>Approve & Refund</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: Colors.error }]}
              onPress={() => handleReject(item.id)}
              disabled={processingId === item.id}
            >
              <Text style={s.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
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
        <Text style={s.title}>Customer Return Requests</Text>
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
            <Icon name="checkmark-done-circle-outline" size={64} color={Colors.primary} />
            <Text style={s.emptyTitle}>No Return Requests</Text>
            <Text style={s.emptySub}>No pending customer return or refund requests.</Text>
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
  buyerName: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  reason: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 6 },
  desc: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, borderRadius: borderRadius.md, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
