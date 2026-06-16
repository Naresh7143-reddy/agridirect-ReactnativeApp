// FILE: src/screens/delivery/DeliveryEarningsScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Svg, Rect, Text as SvgText, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { deliveryApi } from '../../api/delivery';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 120;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MOCK_DAILY = [120, 210, 85, 310, 190, 440, 280];

const MOCK_HISTORY = [
  { id: '1', from: 'Green Valley Farm', to: 'Anna Nagar', distance: '4.2 km', earnings: 72, status: 'Delivered' },
  { id: '2', from: 'Organic Roots', to: 'T. Nagar', distance: '3.8 km', earnings: 64, status: 'Delivered' },
  { id: '3', from: 'Fresh Farm Co.', to: 'Velachery', distance: '7.1 km', earnings: 98, status: 'Delivered' },
  { id: '4', from: 'Village Fresh', to: 'Adyar', distance: '5.5 km', earnings: 80, status: 'Delivered' },
  { id: '5', from: 'Farm to You', to: 'Guindy', distance: '6.2 km', earnings: 88, status: 'Delivered' },
];

interface HistoryItem {
  id: string; from: string; to: string; distance: string; earnings: number; status: string;
}

const HistoryRow: React.FC<{ item: HistoryItem }> = ({ item }) => (
  <View style={styles.historyRow}>
    <View style={styles.historyIcon}><Text style={styles.historyIconText}>🏍️</Text></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.historyFrom} numberOfLines={1}>{item.from}</Text>
      <Text style={styles.historyTo} numberOfLines={1}>→ {item.to}</Text>
      <Text style={styles.historyDist}>{item.distance}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.historyEarnings}>₹{item.earnings}</Text>
      <View style={styles.deliveredBadge}>
        <Text style={styles.deliveredBadgeText}>{item.status}</Text>
      </View>
    </View>
  </View>
);

export const DeliveryEarningsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [earnings, setEarnings] = useState<any>(null);

  useEffect(() => {
    deliveryApi.getEarnings().then((r: any) => {
      setEarnings(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const maxDaily = Math.max(...MOCK_DAILY);
  const barWidth = (CHART_WIDTH - 20) / 7;

  const todayStats = [
    { label: 'Deliveries', value: '5', icon: '📦' },
    { label: 'Distance', value: '26 km', icon: '📍' },
    { label: 'Earned', value: '₹340', icon: '💰' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Today Stats */}
        <View style={styles.statsRow}>
          {todayStats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Weekly Earnings</Text>
          {selectedDay !== null && (
            <Text style={styles.selectedDayText}>{DAYS[selectedDay]}: ₹{MOCK_DAILY[selectedDay]}</Text>
          )}
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
            {/* Baseline */}
            <Line
              x1={10} y1={CHART_HEIGHT} x2={CHART_WIDTH - 10} y2={CHART_HEIGHT}
              stroke={Colors.border} strokeWidth={1}
            />
            {MOCK_DAILY.map((val, i) => {
              const barH = (val / maxDaily) * (CHART_HEIGHT - 10);
              const x = 10 + i * barWidth + barWidth * 0.1;
              const y = CHART_HEIGHT - barH;
              const isSelected = selectedDay === i;
              return (
                <React.Fragment key={i}>
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth * 0.75}
                    height={barH}
                    fill={isSelected ? Colors.primary : Colors.secondary}
                    rx={4}
                    onPress={() => setSelectedDay(i === selectedDay ? null : i)}
                  />
                  <SvgText
                    x={x + (barWidth * 0.75) / 2}
                    y={CHART_HEIGHT + 18}
                    fontSize={10}
                    fill={Colors.textHint}
                    textAnchor="middle"
                  >
                    {DAYS[i]}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* Withdrawal Card */}
        <View style={styles.withdrawCard}>
          <View>
            <Text style={styles.withdrawLabel}>Available Balance</Text>
            <Text style={styles.withdrawBalance}>₹{earnings?.availableBalance || '1,240'}</Text>
            <Text style={styles.withdrawSub}>Next payout: Monday</Text>
          </View>
          <TouchableOpacity style={styles.withdrawBtn} onPress={() => {}}>
            <View style={styles.comingSoonOverlay}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery History */}
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Delivery History</Text>
        {MOCK_HISTORY.map((item) => (
          <HistoryRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
};

export default DeliveryEarningsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: Colors.white, ...shadow.sm },
  backText: { fontSize: 22, color: Colors.textPrimary, width: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 14, alignItems: 'center', ...shadow.sm },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textHint, marginTop: 2 },
  chartCard: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 16, marginBottom: 16, ...shadow.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  selectedDayText: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginBottom: 8 },
  withdrawCard: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadow.sm },
  withdrawLabel: { fontSize: 12, color: Colors.textHint },
  withdrawBalance: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  withdrawSub: { fontSize: 11, color: Colors.textHint, marginTop: 2 },
  withdrawBtn: { backgroundColor: Colors.secondary, borderRadius: borderRadius.lg, paddingHorizontal: 20, paddingVertical: 12, position: 'relative', overflow: 'hidden' },
  withdrawBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  comingSoonOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1, borderRadius: borderRadius.lg },
  comingSoonText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: borderRadius.md, padding: 12, marginBottom: 8, ...shadow.sm },
  historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  historyIconText: { fontSize: 20 },
  historyFrom: { fontSize: 12, color: Colors.textHint },
  historyTo: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  historyDist: { fontSize: 11, color: Colors.textHint, marginTop: 2 },
  historyEarnings: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  deliveredBadge: { backgroundColor: Colors.successLight, borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  deliveredBadgeText: { color: Colors.success, fontSize: 10, fontWeight: '600' },
});
