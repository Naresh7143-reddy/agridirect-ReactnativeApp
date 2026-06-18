import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Svg, Rect, Text as SvgText, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { deliveryApi } from '../../api/delivery';
import type { DeliveryEarnings, EarningEntry } from '../../types/delivery';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH  = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 120;

function formatINR(n: number) {
  return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function HistoryRow({ item }: { item: EarningEntry }) {
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyIcon}><Text style={styles.historyIconText}>🏍️</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        <Text style={styles.historyOrder} numberOfLines={1}>Order #{item.orderId?.slice(0,8).toUpperCase() ?? '—'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.historyEarnings}>{formatINR(item.amount)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'paid' ? Colors.successLight : Colors.warningLight }]}>
          <Text style={[styles.statusText, { color: item.status === 'paid' ? Colors.success : Colors.warning }]}>
            {item.status === 'paid' ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const DeliveryEarningsScreen: React.FC = () => {
  const navigation  = useNavigation<NativeStackNavigationProp<any>>();
  const [earnings, setEarnings]     = useState<DeliveryEarnings | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res: any = await deliveryApi.getEarnings();
      setEarnings(res.data ?? null);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  // Build last-7-days chart from byDate
  const last7 = (() => {
    if (!earnings?.byDate?.length) return [];
    const sorted = [...earnings.byDate].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-7);
  })();

  const maxVal = Math.max(...last7.map(d => d.amount), 1);
  const barWidth = last7.length > 0 ? (CHART_WIDTH - 20) / last7.length : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
      >
        {/* Summary cards */}
        <View style={styles.statsRow}>
          {[
            { icon: '💰', label: 'Today', value: formatINR(earnings?.today ?? 0) },
            { icon: '📅', label: 'This Week', value: formatINR(earnings?.thisWeek ?? 0) },
            { icon: '🗓️', label: 'This Month', value: formatINR(earnings?.thisMonth ?? 0) },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bar chart */}
        {last7.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Last 7 Days</Text>
            {selectedBar !== null && last7[selectedBar] && (
              <Text style={styles.selectedDayText}>
                {new Date(last7[selectedBar].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: {formatINR(last7[selectedBar].amount)}
              </Text>
            )}
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
              <Line x1={10} y1={CHART_HEIGHT} x2={CHART_WIDTH - 10} y2={CHART_HEIGHT} stroke={Colors.border} strokeWidth={1} />
              {last7.map((d, i) => {
                const barH = Math.max((d.amount / maxVal) * (CHART_HEIGHT - 10), 2);
                const x = 10 + i * barWidth + barWidth * 0.1;
                const y = CHART_HEIGHT - barH;
                const isSelected = selectedBar === i;
                const dayLabel = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' });
                return (
                  <React.Fragment key={d.date}>
                    <Rect
                      x={x} y={y}
                      width={barWidth * 0.75} height={barH}
                      fill={isSelected ? Colors.primary : Colors.secondary}
                      rx={4}
                      onPress={() => setSelectedBar(i === selectedBar ? null : i)}
                    />
                    <SvgText x={x + (barWidth * 0.75) / 2} y={CHART_HEIGHT + 18} fontSize={9} fill={Colors.textHint} textAnchor="middle">
                      {dayLabel}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        )}

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Total Earned</Text>
            <Text style={styles.balanceAmount}>{formatINR(earnings?.total ?? 0)}</Text>
            <View style={styles.splitRow}>
              <Text style={styles.splitPaid}>Paid: {formatINR(earnings?.paid ?? 0)}</Text>
              <Text style={styles.splitPending}>Pending: {formatINR(earnings?.pending ?? 0)}</Text>
            </View>
          </View>
          <View style={styles.withdrawBtn}>
            <View style={styles.comingSoonOverlay}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </View>
        </View>

        {/* History */}
        <Text style={[styles.sectionTitle, { marginBottom: 12, marginTop: 8 }]}>Delivery History</Text>
        {!earnings?.byDate?.length ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No delivery history yet</Text>
          </View>
        ) : (
          [...earnings.byDate]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((item, i) => <HistoryRow key={`${item.orderId}-${i}`} item={item} />)
        )}
      </ScrollView>
    </View>
  );
};

export default DeliveryEarningsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: Colors.white, ...shadow.sm },
  backText: { fontSize: 22, color: Colors.textPrimary, width: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 12, alignItems: 'center', ...shadow.sm },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 10, color: Colors.textHint, marginTop: 2 },
  chartCard: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 16, marginBottom: 16, ...shadow.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  selectedDayText: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginBottom: 8 },
  balanceCard: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadow.sm },
  balanceLabel: { fontSize: 12, color: Colors.textHint },
  balanceAmount: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  splitRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  splitPaid: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  splitPending: { fontSize: 11, color: Colors.warning, fontWeight: '600' },
  withdrawBtn: { backgroundColor: Colors.secondary, borderRadius: borderRadius.lg, paddingHorizontal: 20, paddingVertical: 12, position: 'relative', overflow: 'hidden' },
  withdrawBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  comingSoonOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1, borderRadius: borderRadius.lg },
  comingSoonText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: borderRadius.md, padding: 12, marginBottom: 8, ...shadow.sm },
  historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  historyIconText: { fontSize: 20 },
  historyDate: { fontSize: 11, color: Colors.textHint },
  historyOrder: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  historyEarnings: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  statusBadge: { borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  emptyHistory: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 24, alignItems: 'center', ...shadow.sm },
  emptyHistoryText: { color: Colors.textSecondary, fontSize: 14 },
});
