// FILE: src/screens/common/RefundPolicyScreen.tsx
import React from 'react';
import {
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

// ─── Data ─────────────────────────────────────────────────────────────────────

interface RefundItem {
  label: string;
  icon: string;
}

const FULL_REFUND: RefundItem[] = [
  { label: 'Product not delivered', icon: 'close-circle-outline' },
  { label: 'Wrong item sent', icon: 'swap-horizontal-outline' },
  { label: 'Damaged or spoiled product', icon: 'warning-outline' },
  { label: 'Order cancelled within 1 hour', icon: 'time-outline' },
];

const PARTIAL_REFUND: RefundItem[] = [
  { label: 'Item quality below description', icon: 'star-half-outline' },
  { label: 'Partial order missing', icon: 'partly-sunny-outline' },
  { label: 'Delivered late by more than 2 hours', icon: 'hourglass-outline' },
];

const NO_REFUND: RefundItem[] = [
  { label: 'Buyer not available at delivery time', icon: 'person-remove-outline' },
  { label: 'Perishable items after 24 hours', icon: 'leaf-outline' },
  { label: 'Change of mind after delivery', icon: 'refresh-outline' },
];

interface Step {
  num: number;
  title: string;
  desc: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    num: 1,
    title: 'Go to your order',
    desc: 'Navigate to Orders → tap the relevant order → tap "Report Issue"',
    icon: 'receipt-outline',
  },
  {
    num: 2,
    title: 'Describe the problem',
    desc: 'Select the issue type, upload a photo if applicable, and add a description.',
    icon: 'create-outline',
  },
  {
    num: 3,
    title: 'Review by our team',
    desc: 'Our team reviews your request and responds within 24 hours.',
    icon: 'search-outline',
  },
  {
    num: 4,
    title: 'Refund credited',
    desc: 'Approved refunds are credited to your original payment method in 3–5 business days.',
    icon: 'checkmark-circle-outline',
  },
];

// ─── RefundCard ───────────────────────────────────────────────────────────────

interface CardSectionProps {
  title: string;
  subtitle: string;
  items: RefundItem[];
  tintColor: string;
  bgColor: string;
  pillLabel: string;
}

const RefundCardSection: React.FC<CardSectionProps> = ({
  title,
  subtitle,
  items,
  tintColor,
  bgColor,
  pillLabel,
}) => (
  <View style={[styles.refundSection, shadow.sm]}>
    <View style={styles.refundHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.refundTitle, { color: tintColor }]}>{title}</Text>
        <Text style={styles.refundSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.pill, { backgroundColor: bgColor }]}>
        <Text style={[styles.pillText, { color: tintColor }]}>{pillLabel}</Text>
      </View>
    </View>
    {items.map((item, idx) => (
      <View key={idx} style={styles.refundRow}>
        <Icon name={item.icon} size={18} color={tintColor} style={{ marginRight: 10 }} />
        <Text style={styles.refundRowText}>{item.label}</Text>
      </View>
    ))}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const RefundPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Refund Policy</Text>
          <Text style={styles.headerSub}>Last updated: June 2026</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <Text style={styles.intro}>
          We want every AgriDirect experience to be fresh and fair. Below is our clear refund
          policy so you know exactly what to expect.
        </Text>

        {/* Full Refund */}
        <RefundCardSection
          title="Full Refund"
          subtitle="100% of your payment returned"
          items={FULL_REFUND}
          tintColor={Colors.success}
          bgColor={Colors.successLight}
          pillLabel="100%"
        />

        {/* Partial Refund */}
        <RefundCardSection
          title="Partial Refund"
          subtitle="A portion of your payment returned"
          items={PARTIAL_REFUND}
          tintColor={Colors.warning}
          bgColor={Colors.warningLight}
          pillLabel="Partial"
        />

        {/* No Refund */}
        <RefundCardSection
          title="No Refund"
          subtitle="These scenarios are not eligible"
          items={NO_REFUND}
          tintColor={Colors.error}
          bgColor={Colors.errorLight}
          pillLabel="Not Eligible"
        />

        {/* How to raise */}
        <Text style={styles.howTitle}>How to Raise a Refund</Text>
        {STEPS.map((step) => (
          <View key={step.num} style={[styles.stepCard, shadow.sm]}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNum}>{step.num}</Text>
            </View>
            <Icon name={step.icon} size={22} color={Colors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

        {/* Timeline summary */}
        <View style={[styles.timelineCard, shadow.sm]}>
          <Icon name="time-outline" size={22} color={Colors.info} />
          <Text style={styles.timelineText}>
            Refunds take <Text style={styles.timelineBold}>3–5 business days</Text> to reflect in
            your account, depending on your bank or payment provider.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  scroll: { padding: 16 },
  intro: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  refundSection: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 14,
  },
  refundHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  refundTitle: { fontSize: 16, fontWeight: '700' },
  refundSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  refundRowText: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  howTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 10,
  },
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNum: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  stepTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  stepDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoLight,
    borderRadius: borderRadius.md,
    padding: 14,
    marginTop: 6,
    gap: 10,
  },
  timelineText: { fontSize: 14, color: Colors.textPrimary, flex: 1, lineHeight: 20 },
  timelineBold: { fontWeight: '700', color: Colors.info },
});

export default RefundPolicyScreen;
