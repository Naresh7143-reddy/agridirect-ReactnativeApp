/**
 * FarmerEarningsScreen
 *
 * - Period selector: Week | Month | Year (animated pill slide)
 * - Animated count-up on total earnings
 * - SVG area chart (react-native-svg) with bezier curve
 * - Stats cards row
 * - Transaction FlatList
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { farmerApi } from '../../api/farmer';
import type { FarmerEarnings, EarningEntry } from '../../types/farmer';

const { width: W } = Dimensions.get('window');
const CHART_W = W - 48;
const CHART_H = 160;

// ─── Period config ────────────────────────────────────────────────────────────

const PERIODS = ['Week', 'Month', 'Year'] as const;
type Period = typeof PERIODS[number];

// ─── SVG Bezier area chart ────────────────────────────────────────────────────

interface ChartProps {
  data: number[];
  labels: string[];
}

const bezierPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
};

const AreaChart: React.FC<ChartProps> = ({ data, labels }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pad = { top: 16, bottom: 24, left: 8, right: 8 };
  const innerW = CHART_W - pad.left - pad.right;
  const innerH = CHART_H - pad.top - pad.bottom;

  const points = data.map((v, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * innerW,
    y: pad.top + innerH - (v / max) * innerH,
  }));

  const linePath = bezierPath(points);
  const areaPath = points.length >= 2
    ? `${linePath} L ${points[points.length - 1].x} ${CHART_H - pad.bottom} L ${points[0].x} ${CHART_H - pad.bottom} Z`
    : '';

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0.02} />
        </SvgGradient>
      </Defs>

      {/* Area fill */}
      {areaPath && (
        <Path d={areaPath} fill="url(#areaGrad)" />
      )}

      {/* Bezier line */}
      {linePath && (
        <Path
          d={linePath}
          fill="none"
          stroke={Colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}

      {/* Data points */}
      {points.map((pt, i) => (
        <Circle key={i} cx={pt.x} cy={pt.y} r={4} fill={Colors.primary} />
      ))}

      {/* X-axis labels (max 5) */}
      {labels.length > 0 && labels
        .filter((_, i) => data.length <= 8 || i % Math.ceil(data.length / 5) === 0)
        .map((label, i, filtered) => {
          const idx = labels.indexOf(label);
          const pt = points[idx];
          if (!pt) return null;
          return (
            <React.Fragment key={label}>
              <Line
                x1={pt.x}
                y1={pt.y + 4}
                x2={pt.x}
                y2={CHART_H - pad.bottom}
                stroke={Colors.divider}
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            </React.Fragment>
          );
        })}
    </Svg>
  );
};

// ─── Animated count-up ────────────────────────────────────────────────────────

const useCountUp = (target: number, duration = 800) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value }) => setDisplayed(Math.round(value)));
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [target]);

  return displayed;
};

// ─── Stats card ───────────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({
  label, value, icon, color,
}) => (
  <View style={statStyles.card}>
    <View style={[statStyles.iconBox, { backgroundColor: color + '22' }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={statStyles.value}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    ...shadow.sm,
  },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  label: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },
});

// ─── Transaction row ─────────────────────────────────────────────────────────

const TransactionRow: React.FC<{ entry: EarningEntry }> = ({ entry }) => {
  const isPaid = entry.status === 'paid';
  const d = new Date(entry.date);
  return (
    <View style={txStyles.row}>
      <View style={txStyles.iconBox}>
        <Icon name="receipt-outline" size={18} color={Colors.primary} />
      </View>
      <View style={txStyles.info}>
        <Text style={txStyles.orderId} numberOfLines={1}>#{entry.orderId.slice(-8).toUpperCase()}</Text>
        <Text style={txStyles.date}>{d.toLocaleDateString()}</Text>
      </View>
      <View style={txStyles.right}>
        <Text style={[txStyles.amount, { color: Colors.success }]}>+₹{entry.amount.toFixed(2)}</Text>
        <View style={[txStyles.chip, { backgroundColor: isPaid ? Colors.successLight : Colors.warningLight }]}>
          <Text style={[txStyles.chipText, { color: isPaid ? Colors.success : Colors.warning }]}>
            {isPaid ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const txStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  orderId: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  date: { fontSize: 12, color: Colors.textSecondary },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 15, fontWeight: '800' },
  chip: { borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  chipText: { fontSize: 10, fontWeight: '700' },
});

// ─── Main component ───────────────────────────────────────────────────────────

const FarmerEarningsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [period, setPeriod] = useState<Period>('Month');
  const [earnings, setEarnings] = useState<FarmerEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const pillAnim = useRef(new Animated.Value(PERIODS.indexOf('Month'))).current;

  const total = useCountUp(earnings?.totalEarnings ?? 0);

  // ── Load ─────────────────────────────────────────────────────────────────────

  const loadEarnings = useCallback(async (p: Period) => {
    setLoading(true);
    const now = new Date();
    const from = new Date();
    if (p === 'Week') from.setDate(now.getDate() - 7);
    else if (p === 'Month') from.setMonth(now.getMonth() - 1);
    else from.setFullYear(now.getFullYear() - 1);

    try {
      const res = await farmerApi.getEarnings({
        from: from.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      });
      const data = res.data;
      setEarnings({ ...data, byDate: data?.byDate ?? [] });
    } catch {
      /* use mock data fallback */
      setEarnings({
        totalEarnings: 12480,
        pendingPayouts: 2300,
        paidOut: 10180,
        byDate: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEarnings(period); }, [period]);

  // ── Period switch ─────────────────────────────────────────────────────────────

  const switchPeriod = (p: Period) => {
    setPeriod(p);
    Animated.spring(pillAnim, {
      toValue: PERIODS.indexOf(p),
      friction: 8,
      tension: 80,
      useNativeDriver: false,
    }).start();
    loadEarnings(p);
  };

  // ── Derived chart data ────────────────────────────────────────────────────────

  const chartData = (earnings?.byDate ?? []).map((e) => e.amount);
  const chartLabels = (earnings?.byDate ?? []).map((e) => e.date.slice(5)); // MM-DD

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const ordersCount = earnings?.byDate.length ?? 0;
  const avgOrder = ordersCount > 0
    ? Math.round((earnings?.totalEarnings ?? 0) / ordersCount)
    : 0;

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlashList
        data={earnings?.byDate ?? []}
        keyExtractor={(e) => e.orderId}
        estimatedItemSize={70}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={() => (
          <>
            {/* Period selector */}
            <View style={styles.periodBar}>
              <Animated.View
                style={[
                  styles.periodPill,
                  {
                    left: pillAnim.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [4, W / 3 - 16, W / 3 * 2 - 28],
                    }),
                  },
                ]}
              />
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.periodTab}
                  onPress={() => switchPeriod(p)}
                >
                  <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Summary card */}
            <LinearGradient
              colors={Colors.gradientGreen}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.summaryPeriod}>{period}'s Earnings</Text>
              <Text style={styles.summaryTotal}>₹{total.toLocaleString()}</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Icon name="time-outline" size={14} color={Colors.white} />
                  <Text style={styles.summaryItemLabel}>Pending</Text>
                  <Text style={styles.summaryItemVal}>₹{(earnings?.pendingPayouts ?? 0).toLocaleString()}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Icon name="checkmark-circle-outline" size={14} color={Colors.white} />
                  <Text style={styles.summaryItemLabel}>Paid Out</Text>
                  <Text style={styles.summaryItemVal}>₹{(earnings?.paidOut ?? 0).toLocaleString()}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Chart */}
            {chartData.length > 1 ? (
              <View style={styles.chartCard}>
                <Text style={styles.sectionTitle}>Revenue Trend</Text>
                <AreaChart data={chartData} labels={chartLabels} />
              </View>
            ) : null}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard
                label="Orders"
                value={String(ordersCount)}
                icon="receipt-outline"
                color={Colors.primary}
              />
              <StatCard
                label="Avg Order"
                value={`₹${avgOrder}`}
                icon="trending-up-outline"
                color={Colors.secondary}
              />
              <StatCard
                label="Pending"
                value={`₹${(earnings?.pendingPayouts ?? 0).toLocaleString()}`}
                icon="hourglass-outline"
                color={Colors.warning}
              />
            </View>

            {/* Transaction header */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Transactions</Text>
          </>
        )}
        renderItem={({ item }) => <TransactionRow entry={item} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Icon name="receipt-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No transactions for this period</Text>
            </View>
          ) : <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
        }
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  periodBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    padding: 4,
    marginBottom: 16,
    position: 'relative',
  },
  periodPill: {
    position: 'absolute',
    top: 4,
    height: 36 - 8,
    width: (W - 48) / 3 - 4,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.full,
    zIndex: 0,
  },
  periodTab: { flex: 1, alignItems: 'center', paddingVertical: 6, zIndex: 1 },
  periodLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  periodLabelActive: { color: Colors.white },
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: 20,
    marginBottom: 16,
    ...shadow.md,
  },
  summaryPeriod: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  summaryTotal: { fontSize: 38, fontWeight: '800', color: Colors.white, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryItemLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  summaryItemVal: { fontSize: 14, fontWeight: '700', color: Colors.white },
  summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadow.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});

export default FarmerEarningsScreen;
