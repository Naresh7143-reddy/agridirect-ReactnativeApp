// FILE: src/screens/common/TermsConditionsScreen.tsx
import React, { useCallback, useRef, useState } from 'react';
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
import { borderRadius } from '../../theme/spacing';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    id: '1',
    title: '1. Introduction',
    content: [
      'Welcome to AgriDirect, a digital marketplace that connects farmers directly with consumers, eliminating intermediaries and ensuring fair pricing for all parties involved.',
      'By downloading, installing, or using the AgriDirect application ("App"), you agree to be bound by these Terms and Conditions ("Terms"). Please read them carefully before using the App.',
      'If you do not agree with any part of these Terms, you must not use AgriDirect. Your continued use of the App constitutes acceptance of these Terms as they may be updated from time to time.',
    ],
  },
  {
    id: '2',
    title: '2. Eligibility',
    content: [
      'To use AgriDirect, you must be at least 18 years of age and a resident of India. By registering an account, you confirm that you meet these requirements.',
      'AgriDirect is currently available only within India and is subject to Indian laws and regulations, including the Information Technology Act 2000 and the Consumer Protection Act 2019.',
      'We reserve the right to suspend or terminate accounts of users found to be underage or operating outside India without prior notice.',
    ],
  },
  {
    id: '3',
    title: '3. Farmer Obligations',
    content: [
      'Farmers registering on AgriDirect must provide accurate information about their products, including but not limited to quality grade, weight, unit, origin, harvest date, and any applicable certifications.',
      'Pricing set by farmers must be fair and transparent. Farmers must not engage in price manipulation, artificial inflation, or collusion with other sellers.',
      'Farmers are responsible for ensuring product availability as listed. Cancellations due to unavailability beyond a 10% threshold may result in account penalties or suspension.',
      'All products must comply with FSSAI standards and applicable food safety regulations. Organic certification claims must be supported by valid documentation.',
    ],
  },
  {
    id: '4',
    title: '4. Buyer Obligations',
    content: [
      'Buyers must provide accurate delivery addresses and be available to receive orders at the specified time. Repeated failed delivery attempts due to buyer unavailability may result in order cancellation without refund.',
      'Buyers must not engage in fraudulent activities, including placing orders with no intention to pay, filing false complaints, or abusing the refund system.',
      'Any attempt to contact farmers directly to bypass the AgriDirect platform is prohibited and may result in account termination.',
    ],
  },
  {
    id: '5',
    title: '5. Payment Terms',
    content: [
      'All payments on AgriDirect are processed through Razorpay, a PCI-DSS compliant payment gateway. AgriDirect does not store your card or bank details.',
      'Cash on Delivery (COD) is available for orders below ₹2,000 in select pin codes. COD orders must be paid in exact change. Delivery partners cannot provide change for amounts above ₹500.',
      'Transaction fees, if applicable, will be clearly communicated before order confirmation. AgriDirect reserves the right to modify payment methods at any time with 7 days\' notice.',
    ],
  },
  {
    id: '6',
    title: '6. Cancellation & Refunds',
    content: [
      'Buyers may cancel an order within 1 hour of placement for a full refund. After this window, cancellation is subject to the order status and farmer approval.',
      'Refunds for valid claims (damaged goods, wrong items, non-delivery) are processed within 3–5 business days to the original payment method.',
      'Please refer to our Refund Policy for a detailed breakdown of eligible refund scenarios and the claims process.',
    ],
  },
  {
    id: '7',
    title: '7. Privacy',
    content: [
      'Your privacy is important to us. Our Privacy Policy, incorporated by reference into these Terms, explains how we collect, use, and protect your personal information.',
      'By using AgriDirect, you consent to the collection and processing of your data as described in the Privacy Policy.',
    ],
  },
  {
    id: '8',
    title: '8. Dispute Resolution',
    content: [
      'In case of any dispute between buyers and farmers, users are encouraged to first contact AgriDirect support at support@agridirect.app or call our helpline.',
      'AgriDirect will investigate all disputes fairly and may request evidence from both parties. Our decision, while not legally binding, will be issued within 7 business days.',
      'Unresolved disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana, India, and governed by Indian law.',
    ],
  },
  {
    id: '9',
    title: '9. Changes to Terms',
    content: [
      'AgriDirect reserves the right to modify these Terms at any time. We will provide at least 7 days\' notice of material changes via in-app notification and/or email.',
      'Your continued use of the App after the effective date of changes constitutes acceptance of the revised Terms.',
    ],
  },
  {
    id: '10',
    title: '10. Contact Us',
    content: [
      'If you have any questions about these Terms and Conditions, please contact us at support@agridirect.app.',
      'Our support team is available Monday through Saturday, 9:00 AM to 6:00 PM IST.',
      'AgriDirect Technologies Pvt. Ltd., 4th Floor, TechHub Building, Hitec City, Hyderabad – 500081, Telangana, India.',
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

const TermsConditionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, number>>({});
  const [activeChip, setActiveChip] = useState('1');

  const scrollToSection = useCallback((id: string) => {
    setActiveChip(id);
    const y = sectionRefs.current[id] ?? 0;
    scrollRef.current?.scrollTo({ y: y - 8, animated: true });
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <Text style={styles.headerSub}>Last updated: June 2026</Text>
        </View>
      </View>

      {/* Section chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsBar}
        contentContainerStyle={styles.chipsContent}
      >
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, activeChip === s.id && styles.chipActive]}
            onPress={() => scrollToSection(s.id)}
          >
            <Text style={[styles.chipText, activeChip === s.id && styles.chipTextActive]}>
              {s.id}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View
            key={section.id}
            onLayout={(e) => {
              sectionRefs.current[section.id] = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.content.map((para, idx) => (
              <Text key={idx} style={styles.paragraph}>
                {para}
              </Text>
            ))}
          </View>
        ))}
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
  chipsBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 52,
  },
  chipsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
});

export default TermsConditionsScreen;
