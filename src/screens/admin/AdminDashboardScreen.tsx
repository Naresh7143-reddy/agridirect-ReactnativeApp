// FILE: src/screens/admin/AdminDashboardScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Svg, Path, Circle, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { adminApi } from '../../api/admin';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 40;
const CHART_H = 100;

const KPI_CARDS = [
  { label: 'Total Users', icon: '👥', color: Colors.info, bg: Colors.infoLight, key: 'totalUsers', mockValue: 1248 },
  { label: 'Farmers', icon: '🌾', color: Colors.primary, bg: Colors.successLight, key: 'totalFarmers', mockValue: 87 },
  { label: 'Buyers', icon: '🛒', color: Colors.secondary, bg: Colors.warningLight, key: 'totalBuyers', mockValue: 1124 },
  { label: 'Orders Today', icon: '📦', color: Colors.primaryLight, bg: Colors.successLight, key: 'ordersToday', mockValue: 43 },
  { label: 'Revenue Today', icon: '💰', prefix: '₹', color: Colors.success, bg: Colors.successLight, key: 'revenueToday', mockValue: 18640 },
  { label: 'Deliveries', icon: '🏍️', color: Colors.info, bg: Colors.infoLight, key: 'deliveries', mockValue: 38 },
];

const ACTIVITY = [
  { id: '1', icon: '✅', text: 'Farmer "Ravi Kumar" verified', time: '2m ago', action: 'View' },
  { id: '2', icon: '📦', text: 'Order #AG4821 placed', time: '5m ago', action: null },
  { id: '3', icon: '🆕', text: 'New farmer registered: "GreenLeaf"', time: '12m ago', action: 'Review' },
  { id: '4', icon: '🚚', text: 'Order #AG4819 delivered', time: '18m ago', action: null },
  { id: '5', icon: '⚠️', text: 'Product flagged for review', time: '25m ago', action: 'View' },
];

// Revenue trend (mock data points)
const REVENUE_TREND = [120, 210, 180, 350, 290, 420, 380];

// ── Animated count-up component ────────────────────────────────────────────
interface KpiCardProps {
  card: typeof KPI_CARDS[0];
  onPress: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ card, onPress }) => {
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    Animated.timing(countAnim, { toValue: card.mockValue, duration: 1500, useNativeDriver: false }).start();
    countAnim.addListener(({ value }) => setDisplayValue(Math.floor(value)));
    return () => countAnim.removeAllListeners();
  }, [card.mockValue, countAnim]);

  return (
    <TouchableOpacity style={[styles.kpiCard, { backgroundColor: card.bg }]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.kpiIcon}>{card.icon}</Text>
      <Text style={[styles.kpiValue, { color: card.color }]}>
        {card.prefix || ''}{displayValue.toLocaleString()}
      </Text>
      <Text style={styles.kpiLabel}>{card.label}</Text>
    </TouchableOpacity>
  );
};

// ── Activity Row ─────────────────────────────────────────────────────────────
interface ActivityRowProps {
  item: typeof ACTIVITY[0];
}

const ActivityRow: React.FC<ActivityRowProps> = ({ item }) => (
  <View style={styles.activityRow}>
    <Text style={styles.activityIcon}>{item.icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.activityText}>{item.text}</Text>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
    {item.action && (
      <TouchableOpacity style={styles.activityAction}>
        <Text style={styles.activityActionText}>{item.action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics().then(() => {}).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Build SVG line chart path from REVENUE_TREND
  const maxVal = Math.max(...REVENUE_TREND);
  const pts = REVENUE_TREND.map((v, i) => ({
    x: 20 + (i / (REVENUE_TREND.length - 1)) * (CHART_W - 40),
    y: CHART_H - 10 - ((v / maxVal) * (CHART_H - 20)),
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const QUICK_ACTIONS = [
    { icon: '✅', label: 'Verify Farmers', badge: '3', onPress: () => navigation.navigate('FarmerVerification') },
    { icon: '🏷', label: 'Categories', badge: null, onPress: () => navigation.navigate('Categories') },
    { icon: '📦', label: 'All Orders', badge: null, onPress: () => navigation.navigate('AdminOrders') },
    { icon: '👥', label: 'Users', badge: null, onPress: () => navigation.navigate('UsersManagement') },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={Colors.gradientGreen} style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSub}>AgriDirect Control Panel</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* KPI Cards */}
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <FlatList
          data={KPI_CARDS}
          renderItem={({ item }) => (
            <KpiCard card={item} onPress={() => {}} />
          )}
          keyExtractor={(c) => c.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiRow}
          scrollEnabled
        />

        {/* Revenue Trend */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Revenue Trend (7 days)</Text>
          <Svg width={CHART_W} height={CHART_H}>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((frac, i) => (
              <Line key={i}
                x1={20} y1={CHART_H - frac * (CHART_H - 20) - 10}
                x2={CHART_W - 20} y2={CHART_H - frac * (CHART_H - 20) - 10}
                stroke={Colors.border} strokeWidth={1} strokeDasharray="4,4"
              />
            ))}
            {/* Line */}
            <Path d={pathD} stroke={Colors.primary} strokeWidth={2.5} fill="none" />
            {/* Dots */}
            {pts.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={4} fill={Colors.primary} />
            ))}
          </Svg>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((qa) => (
            <TouchableOpacity key={qa.label} style={styles.quickCard} onPress={qa.onPress} activeOpacity={0.85}>
              <View style={styles.quickIconWrap}>
                <Text style={styles.quickIcon}>{qa.icon}</Text>
                {qa.badge && (
                  <View style={styles.quickBadge}>
                    <Text style={styles.quickBadgeText}>{qa.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.quickLabel}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {ACTIVITY.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16 },
  headerTitle: { color: Colors.white, fontSize: 24, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10, marginTop: 4 },
  kpiRow: { paddingRight: 8, paddingBottom: 4 },
  kpiCard: { width: 140, borderRadius: borderRadius.lg, padding: 16, marginRight: 10, alignItems: 'center', ...shadow.sm },
  kpiIcon: { fontSize: 28, marginBottom: 6 },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  chartCard: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 16, marginBottom: 16, ...shadow.sm },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  quickCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 16, alignItems: 'center', ...shadow.sm },
  quickIconWrap: { position: 'relative', marginBottom: 8 },
  quickIcon: { fontSize: 36 },
  quickBadge: { position: 'absolute', top: -4, right: -8, backgroundColor: Colors.error, borderRadius: borderRadius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  quickBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  quickLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  activityCard: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 4, ...shadow.sm },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  activityIcon: { fontSize: 20, marginRight: 12, width: 28, textAlign: 'center' },
  activityText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  activityTime: { fontSize: 11, color: Colors.textHint, marginTop: 2 },
  activityAction: { backgroundColor: Colors.infoLight, borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  activityActionText: { color: Colors.info, fontSize: 12, fontWeight: '600' },
});
