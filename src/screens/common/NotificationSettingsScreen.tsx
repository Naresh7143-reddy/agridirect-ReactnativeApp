// FILE: src/screens/common/NotificationSettingsScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';
import { appStorage } from '../../utils/storage';

// ─── AnimatedToggle ───────────────────────────────────────────────────────────

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

const AnimatedToggle: React.FC<ToggleProps> = ({ value, onValueChange, disabled }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#BDBDBD', Colors.primary],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
    >
      <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrefsState {
  master: boolean;
  // Orders
  newOrder: boolean;
  accepted: boolean;
  packed: boolean;
  outForDelivery: boolean;
  delivered: boolean;
  cancelled: boolean;
  // Payments
  paymentConfirmed: boolean;
  refundProcessed: boolean;
  // Marketing
  offersDeals: boolean;
  nearbyFarmers: boolean;
  newsletter: boolean;
}

const DEFAULT_PREFS: PrefsState = {
  master: true,
  newOrder: true,
  accepted: true,
  packed: true,
  outForDelivery: true,
  delivered: true,
  cancelled: true,
  paymentConfirmed: true,
  refundProcessed: true,
  offersDeals: false,
  nearbyFarmers: false,
  newsletter: false,
};

// ─── ToggleRow ────────────────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, value, onToggle, disabled }) => (
  <View style={[styles.toggleRow, disabled && { opacity: 0.4 }]}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <AnimatedToggle value={value} onValueChange={onToggle} disabled={disabled} />
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState<PrefsState>(() => {
    const saved = appStorage.getString('notif_prefs');
    if (saved) {
      try {
        return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_PREFS;
      }
    }
    return DEFAULT_PREFS;
  });

  const update = useCallback(
    (key: keyof PrefsState) => (v: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: v };
        appStorage.set('notif_prefs', JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const masterOff = !prefs.master;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Master toggle */}
        <View style={[styles.masterCard, shadow.md]}>
          <View style={styles.masterLeft}>
            <View style={styles.masterIconCircle}>
              <Icon name="notifications" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.masterLabel}>All Notifications</Text>
              <Text style={styles.masterSubtitle}>
                {prefs.master ? 'You will receive all enabled notifications' : 'All notifications are muted'}
              </Text>
            </View>
          </View>
          <AnimatedToggle value={prefs.master} onValueChange={update('master')} />
        </View>

        {/* Orders section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders</Text>
          <View style={[styles.sectionCard, shadow.sm]}>
            <ToggleRow label="New Order" value={prefs.newOrder} onToggle={update('newOrder')} disabled={masterOff} />
            <View style={styles.divider} />
            <ToggleRow label="Order Accepted" value={prefs.accepted} onToggle={update('accepted')} disabled={masterOff} />
            <View style={styles.divider} />
            <ToggleRow label="Order Packed" value={prefs.packed} onToggle={update('packed')} disabled={masterOff} />
            <View style={styles.divider} />
            <ToggleRow label="Out for Delivery" value={prefs.outForDelivery} onToggle={update('outForDelivery')} disabled={masterOff} />
            <View style={styles.divider} />
            <ToggleRow label="Delivered" value={prefs.delivered} onToggle={update('delivered')} disabled={masterOff} />
            <View style={styles.divider} />
            <ToggleRow label="Cancelled" value={prefs.cancelled} onToggle={update('cancelled')} disabled={masterOff} />
          </View>
        </View>

        {/* Payments section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments</Text>
          <View style={[styles.sectionCard, shadow.sm]}>
            <ToggleRow label="Payment Confirmed" value={prefs.paymentConfirmed} onToggle={update('paymentConfirmed')} disabled={masterOff} />
            <View style={styles.divider} />
            <ToggleRow label="Refund Processed" value={prefs.refundProcessed} onToggle={update('refundProcessed')} disabled={masterOff} />
          </View>
        </View>

        {/* Marketing section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketing</Text>
          <Text style={styles.sectionSubtitle}>Promotional and discovery notifications</Text>
          <View style={[styles.sectionCard, shadow.sm]}>
            <ToggleRow label="Offers & Deals" value={prefs.offersDeals} onToggle={update('offersDeals')} disabled={masterOff} />
            <View style={styles.divider} />
            <ToggleRow label="Nearby Farmers" value={prefs.nearbyFarmers} onToggle={update('nearbyFarmers')} disabled={masterOff} />
            <View style={styles.divider} />
            <ToggleRow label="Newsletter" value={prefs.newsletter} onToggle={update('newsletter')} disabled={masterOff} />
          </View>
        </View>

        <Text style={styles.footerNote}>
          Settings are saved automatically and take effect immediately.
        </Text>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 16, paddingBottom: 48 },
  masterCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  masterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  masterIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  masterLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  masterSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: Colors.textHint, marginBottom: 8 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: borderRadius.md, overflow: 'hidden' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleLabel: { fontSize: 15, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: 16 },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  footerNote: {
    fontSize: 12,
    color: Colors.textHint,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default NotificationSettingsScreen;
