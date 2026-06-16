// FILE: src/screens/common/HelpSupportScreen.tsx
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQSection {
  id: string;
  title: string;
  icon: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQSection[] = [
  {
    id: 'orders',
    title: 'Orders & Delivery',
    icon: 'cart-outline',
    items: [
      {
        id: 'o1',
        question: 'How long does delivery take?',
        answer:
          'Delivery typically takes 2–6 hours depending on your location and the farmer\'s distance. You can track your order in real-time from the Orders section.',
      },
      {
        id: 'o2',
        question: 'Can I cancel my order after placing it?',
        answer:
          'Yes, you can cancel within 1 hour of placing the order for a full refund. After 1 hour, cancellation depends on the farmer\'s acceptance and order status.',
      },
      {
        id: 'o3',
        question: 'What if my delivery is late?',
        answer:
          'If your order is delayed by more than 2 hours from the estimated time, you may be eligible for a partial refund. Please report the issue via the order page.',
      },
      {
        id: 'o4',
        question: 'Can I change my delivery address after ordering?',
        answer:
          'Address changes are not supported after order placement. Please ensure your delivery address is correct before confirming the order.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Refunds',
    icon: 'card-outline',
    items: [
      {
        id: 'p1',
        question: 'What payment methods are supported?',
        answer:
          'We support UPI, credit/debit cards, net banking, and Cash on Delivery (COD) for eligible orders below ₹2,000.',
      },
      {
        id: 'p2',
        question: 'How long do refunds take?',
        answer:
          'Refunds are processed within 3–5 business days to your original payment method. UPI refunds are usually faster (1–2 days).',
      },
      {
        id: 'p3',
        question: 'My payment failed but money was deducted. What do I do?',
        answer:
          'This usually auto-resolves within 2–3 business days. If not, email us at support@agridirect.app with your transaction ID and we\'ll investigate immediately.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: 'person-outline',
    items: [
      {
        id: 'a1',
        question: 'How do I change my phone number?',
        answer:
          'Phone number changes require identity verification. Please contact support@agridirect.app from your registered email to initiate the process.',
      },
      {
        id: 'a2',
        question: 'How do I delete my account?',
        answer:
          'Account deletion can be requested through Settings → Account → Delete Account, or by emailing privacy@agridirect.app. Your data will be deleted within 30 days.',
      },
      {
        id: 'a3',
        question: 'Can I have both a buyer and farmer account?',
        answer:
          'Currently each phone number is associated with one account type. We are working on multi-role support. Please contact support if you need to switch roles.',
      },
    ],
  },
  {
    id: 'farmers',
    title: 'For Farmers',
    icon: 'leaf-outline',
    items: [
      {
        id: 'f1',
        question: 'How do I get verified on AgriDirect?',
        answer:
          'After registering, complete your profile and upload your FSSAI certificate or government ID. Our team reviews verifications within 48 hours.',
      },
      {
        id: 'f2',
        question: 'When and how do I receive payouts?',
        answer:
          'Payouts are processed every Monday for the previous week\'s settled orders, directly to your registered bank account. Ensure your bank details are up to date.',
      },
      {
        id: 'f3',
        question: 'What commission does AgriDirect charge?',
        answer:
          'AgriDirect charges a 5% platform commission on each successful transaction. There are no listing fees or monthly charges.',
      },
    ],
  },
];

const ISSUE_CATEGORIES = ['Order Issue', 'Payment Issue', 'App Bug', 'Other'];

// ─── AccordionItem ────────────────────────────────────────────────────────────

interface AccordionProps {
  item: FAQItem;
}

const AccordionItem: React.FC<AccordionProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      Animated.timing(rotateAnim, {
        toValue: prev ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return !prev;
    });
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={styles.accordionItem}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.8}>
        <Text style={styles.accordionQ}>{item.question}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon name="chevron-down" size={18} color={Colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionBody}>
          <Text style={styles.accordionA}>{item.answer}</Text>
          <View style={styles.helpfulRow}>
            <Text style={styles.helpfulText}>Was this helpful?</Text>
            <TouchableOpacity style={styles.thumbBtn} onPress={() => Toast.show({ type: 'success', text1: 'Thanks for your feedback! 👍' })}>
              <Text style={{ fontSize: 18 }}>👍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.thumbBtn} onPress={() => Toast.show({ type: 'info', text1: 'Sorry to hear that. We\'ll improve this.' })}>
              <Text style={{ fontSize: 18 }}>👎</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const filteredFAQ = FAQ_DATA.map((section) => ({
    ...section,
    items: search.trim()
      ? section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(search.toLowerCase()) ||
            item.answer.toLowerCase().includes(search.toLowerCase()),
        )
      : section.items,
  })).filter((s) => s.items.length > 0);

  const handleSubmit = useCallback(() => {
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select an issue category before submitting.');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Add Description', 'Please describe your issue in at least 10 characters.');
      return;
    }
    Toast.show({ type: 'success', text1: 'Report submitted!', text2: 'We\'ll get back to you within 24 hours.' });
    setSelectedCategory(null);
    setDescription('');
  }, [selectedCategory, description]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Search */}
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={18} color={Colors.textHint} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs..."
            placeholderTextColor={Colors.textHint}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={18} color={Colors.textHint} />
            </TouchableOpacity>
          )}
        </View>

        {/* FAQ sections */}
        {filteredFAQ.map((section) => (
          <View key={section.id} style={styles.faqSection}>
            <View style={styles.faqSectionHeader}>
              <Icon name={section.icon} size={18} color={Colors.primary} />
              <Text style={styles.faqSectionTitle}>{section.title}</Text>
            </View>
            <View style={[styles.faqCard, shadow.sm]}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && <View style={styles.divider} />}
                  <AccordionItem item={item} />
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {filteredFAQ.length === 0 && (
          <View style={styles.noResults}>
            <Icon name="search-outline" size={40} color={Colors.border} />
            <Text style={styles.noResultsText}>No FAQs match your search</Text>
          </View>
        )}

        {/* Contact cards */}
        <Text style={styles.contactTitle}>Still need help?</Text>
        <View style={styles.contactRow}>
          <View style={[styles.contactCard, { backgroundColor: Colors.successLight }]}>
            <Icon name="chatbubble-ellipses-outline" size={24} color={Colors.success} />
            <Text style={[styles.contactCardLabel, { color: Colors.success }]}>Chat</Text>
            <Text style={styles.contactCardSub}>Coming soon</Text>
          </View>
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: Colors.infoLight }]}
            onPress={() => Linking.openURL('tel:+919876543210')}
          >
            <Icon name="call-outline" size={24} color={Colors.info} />
            <Text style={[styles.contactCardLabel, { color: Colors.info }]}>Call</Text>
            <Text style={styles.contactCardSub}>+91 98765 43210</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: Colors.warningLight }]}
            onPress={() => Linking.openURL('mailto:support@agridirect.app')}
          >
            <Icon name="mail-outline" size={24} color={Colors.warning} />
            <Text style={[styles.contactCardLabel, { color: Colors.warning }]}>Email</Text>
            <Text style={styles.contactCardSub}>support@</Text>
          </TouchableOpacity>
        </View>

        {/* Report Problem */}
        <Text style={styles.contactTitle}>Report a Problem</Text>
        <View style={[styles.reportCard, shadow.sm]}>
          <Text style={styles.reportLabel}>Issue Category</Text>
          <View style={styles.chipRow}>
            {ISSUE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.issueChip, selectedCategory === cat && styles.issueChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.issueChipText, selectedCategory === cat && styles.issueChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.reportLabel, { marginTop: 14 }]}>Description</Text>
          <TextInput
            style={styles.descInput}
            placeholder="Describe your issue in detail..."
            placeholderTextColor={Colors.textHint}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.submitText}>Submit Report</Text>
          </TouchableOpacity>
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
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    ...shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, padding: 0 },
  faqSection: { marginBottom: 16 },
  faqSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  faqSectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  faqCard: { backgroundColor: Colors.surface, borderRadius: borderRadius.md, overflow: 'hidden' },
  accordionItem: {},
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  accordionQ: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginRight: 8 },
  accordionBody: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 0 },
  accordionA: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  helpfulText: { fontSize: 12, color: Colors.textHint },
  thumbBtn: { padding: 4 },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: 14 },
  noResults: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  noResultsText: { fontSize: 14, color: Colors.textHint },
  contactTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 12 },
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  contactCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    gap: 6,
  },
  contactCardLabel: { fontSize: 13, fontWeight: '700' },
  contactCardSub: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
  },
  reportLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  issueChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  issueChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  issueChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  issueChipTextActive: { color: Colors.white, fontWeight: '600' },
  descInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: borderRadius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
    backgroundColor: Colors.surfaceSecondary,
  },
  submitBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});

export default HelpSupportScreen;
