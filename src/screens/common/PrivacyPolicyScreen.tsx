// FILE: src/screens/common/PrivacyPolicyScreen.tsx
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
    title: '1. Information We Collect',
    content: [
      'We collect information you provide directly, including your name, mobile phone number, email address, delivery addresses, and payment method preferences.',
      'Location data is collected when you grant permission to the App, primarily to calculate delivery routes, suggest nearby farmers, and estimate delivery times. This data is not collected when the App is in the background unless you explicitly grant background location access.',
      'Usage data is collected automatically, including pages visited, features used, search queries, and interaction patterns. This helps us improve the product experience and is collected in an anonymized form.',
    ],
  },
  {
    id: '2',
    title: '2. How We Use Information',
    content: [
      'Your personal information is used to process orders, arrange delivery, send order status notifications, and handle payment transactions.',
      'We use aggregated usage data to personalize your experience, such as showing you products from farmers near your location, recommending categories you frequently browse, and surfacing deals relevant to your preferences.',
      'Your phone number is used for authentication via OTP and for contacting you in case of order-related queries. We will not use it for unsolicited marketing without your explicit consent.',
    ],
  },
  {
    id: '3',
    title: '3. Data Sharing',
    content: [
      'We share necessary details with farmers and delivery partners strictly to fulfill your orders. Farmers receive your name and delivery locality (not full address). Delivery partners receive your full address only at the time of delivery.',
      'We work with trusted third-party service providers including Razorpay (payment processing), Firebase (push notifications and authentication), and Cloudinary (image storage). These partners are bound by their own privacy policies and are not permitted to use your data for their own marketing purposes.',
      'We will never sell, rent, or trade your personal information to third parties for marketing purposes. We do not share your data with advertisers.',
    ],
  },
  {
    id: '4',
    title: '4. Data Security',
    content: [
      'All data transmitted between your device and our servers is encrypted using industry-standard TLS 1.3 encryption. Data at rest is encrypted using AES-256.',
      'We implement access controls ensuring that only authorized team members can access user data, and only to the extent necessary to perform their job functions.',
      'In the event of a data breach that may affect your personal information, we will notify you within 72 hours of becoming aware of the incident, as required by applicable law.',
    ],
  },
  {
    id: '5',
    title: '5. Location Data',
    content: [
      'Location data is used to show you nearby farmers, calculate accurate delivery estimates, and enable real-time order tracking.',
      'You can disable location access at any time through your device settings. However, some features like "Nearby Farmers" and live tracking will not function without location permission.',
      'We do not track your location when the App is not in active use, unless you have explicitly enabled background location for delivery tracking.',
    ],
  },
  {
    id: '6',
    title: '6. Cookies & Analytics',
    content: [
      'Our App uses Firebase Analytics to collect anonymized usage data such as screen views, session duration, and feature interactions. This data does not personally identify you.',
      'We use this information to understand how users interact with the App, identify bugs and performance issues, and prioritize new features.',
      'You may opt out of analytics tracking by contacting us at privacy@agridirect.app.',
    ],
  },
  {
    id: '7',
    title: '7. Children\'s Privacy',
    content: [
      'AgriDirect is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from minors.',
      'If you believe that a child under 18 has provided us with personal information, please contact us immediately at privacy@agridirect.app so we can delete it.',
    ],
  },
  {
    id: '8',
    title: '8. Your Rights',
    content: [
      'You have the right to access, correct, or delete your personal information at any time. You can update most information directly through the App settings.',
      'To request a complete copy of your data or to request account deletion, contact privacy@agridirect.app. We will process your request within 30 days.',
      'You may opt out of marketing communications by adjusting your notification settings within the App or by emailing us. Transactional notifications related to your orders cannot be disabled.',
    ],
  },
  {
    id: '9',
    title: '9. Data Retention',
    content: [
      'We retain your personal data for 3 years from the date of your last transaction, or until you request account deletion, whichever comes first.',
      'Order records may be retained for up to 7 years for tax and legal compliance purposes, even after account deletion, in accordance with Indian accounting regulations.',
      'Anonymized and aggregated analytics data may be retained indefinitely as it cannot be used to identify you.',
    ],
  },
  {
    id: '10',
    title: '10. Contact Us',
    content: [
      'For any privacy-related queries, requests, or concerns, please contact our Data Privacy Officer at privacy@agridirect.app.',
      'We aim to respond to all privacy inquiries within 5 business days.',
      'AgriDirect Technologies Pvt. Ltd., 4th Floor, TechHub Building, Hitec City, Hyderabad – 500081, Telangana, India.',
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

const PrivacyPolicyScreen: React.FC = () => {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
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
  chipsContent: { paddingHorizontal: 16, paddingVertical: 10 },
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

export default PrivacyPolicyScreen;
