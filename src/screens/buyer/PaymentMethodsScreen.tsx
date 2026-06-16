/**
 * PaymentMethodsScreen
 *
 * Displays saved payment methods (cards + UPI IDs).
 * Razorpay handles actual charging — methods stored locally for display.
 * Add Card / Add UPI are stubs until react-native-razorpay is installed.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedCard {
  id: string;
  last4: string;
  brand: 'Visa' | 'Mastercard' | 'RuPay' | 'Amex';
  expiry: string;
  isDefault: boolean;
}

interface SavedUPI {
  id: string;
  upiId: string;
  app: string;
  isDefault: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CARDS: SavedCard[] = [
  { id: 'c1', last4: '1111', brand: 'Visa',       expiry: '12/26', isDefault: true  },
  { id: 'c2', last4: '4444', brand: 'Mastercard', expiry: '08/25', isDefault: false },
];

const MOCK_UPI: SavedUPI[] = [
  { id: 'u1', upiId: 'user@googlepay',   app: 'Google Pay',  isDefault: false },
  { id: 'u2', upiId: 'user@ybl',         app: 'PhonePe',     isDefault: false },
];

const BRAND_COLORS: Record<string, string> = {
  Visa:       '#1A1F71',
  Mastercard: '#EB001B',
  RuPay:      '#0077A3',
  Amex:       '#007BC1',
};

// ─── Card row ─────────────────────────────────────────────────────────────────

interface CardRowProps {
  card: SavedCard;
  onDelete: () => void;
  onSetDefault: () => void;
}

const CardRow: React.FC<CardRowProps> = ({ card, onDelete, onSetDefault }) => (
  <View style={rowStyles.row}>
    <View style={[rowStyles.brandCircle, { backgroundColor: BRAND_COLORS[card.brand] ?? Colors.primary }]}>
      <Text style={rowStyles.brandText}>{card.brand.slice(0, 1)}</Text>
    </View>
    <View style={rowStyles.info}>
      <Text style={rowStyles.title}>{card.brand} •••• {card.last4}</Text>
      <Text style={rowStyles.sub}>Expires {card.expiry}</Text>
    </View>
    {card.isDefault && (
      <View style={rowStyles.defaultBadge}>
        <Text style={rowStyles.defaultText}>Default</Text>
      </View>
    )}
    <TouchableOpacity onPress={onSetDefault} style={rowStyles.iconBtn}>
      <Icon name="star-outline" size={18} color={card.isDefault ? Colors.secondary : Colors.textHint} />
    </TouchableOpacity>
    <TouchableOpacity onPress={onDelete} style={rowStyles.iconBtn}>
      <Icon name="trash-outline" size={18} color={Colors.error} />
    </TouchableOpacity>
  </View>
);

// ─── UPI row ──────────────────────────────────────────────────────────────────

interface UPIRowProps {
  upi: SavedUPI;
  onDelete: () => void;
}

const UPIRow: React.FC<UPIRowProps> = ({ upi, onDelete }) => (
  <View style={rowStyles.row}>
    <View style={[rowStyles.brandCircle, { backgroundColor: Colors.primary }]}>
      <Icon name="phone-portrait-outline" size={18} color={Colors.white} />
    </View>
    <View style={rowStyles.info}>
      <Text style={rowStyles.title}>{upi.app}</Text>
      <Text style={rowStyles.sub}>{upi.upiId}</Text>
    </View>
    <TouchableOpacity onPress={onDelete} style={rowStyles.iconBtn}>
      <Icon name="trash-outline" size={18} color={Colors.error} />
    </TouchableOpacity>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...shadow.sm,
  },
  brandCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 18, fontWeight: '800', color: Colors.white },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  defaultBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  defaultText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  iconBtn: { padding: 4 },
});

// ─── Add UPI modal ────────────────────────────────────────────────────────────

// (react-native-razorpay not installed — stub)

// ─── Main component ───────────────────────────────────────────────────────────

const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [cards, setCards] = useState<SavedCard[]>(MOCK_CARDS);
  const [upis, setUpis] = useState<SavedUPI[]>(MOCK_UPI);

  const deleteCard = (id: string) => {
    Alert.alert('Remove Card', 'Remove this card from your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setCards((prev) => prev.filter((c) => c.id !== id));
          Toast.show({ type: 'success', text1: 'Card removed' });
        },
      },
    ]);
  };

  const setDefaultCard = (id: string) => {
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
    Toast.show({ type: 'success', text1: 'Default card updated' });
  };

  const deleteUPI = (id: string) => {
    Alert.alert('Remove UPI', 'Remove this UPI ID?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setUpis((prev) => prev.filter((u) => u.id !== id));
        },
      },
    ]);
  };

  const addCard = () => {
    Alert.alert(
      'Add Card',
      'Card management requires react-native-razorpay installation.\n\nTest card: 4111 1111 1111 1111',
    );
  };

  const addUPI = () => {
    Alert.alert('Add UPI ID', 'Enter your UPI ID (e.g. name@upi)', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        onPress: (id?: string) => {
          if (id?.includes('@')) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setUpis((prev) => [...prev, { id: Date.now().toString(), upiId: id, app: 'UPI', isDefault: false }]);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlashList
        data={[]}
        keyExtractor={() => ''}
        renderItem={() => null}
        estimatedItemSize={80}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={() => (
          <>
            {/* Cards section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved Cards</Text>
              <TouchableOpacity onPress={addCard}>
                <Text style={styles.addLink}>+ Add Card</Text>
              </TouchableOpacity>
            </View>
            {cards.map((card) => (
              <CardRow
                key={card.id}
                card={card}
                onDelete={() => deleteCard(card.id)}
                onSetDefault={() => setDefaultCard(card.id)}
              />
            ))}
            {cards.length === 0 && (
              <Text style={styles.emptyText}>No saved cards</Text>
            )}

            {/* UPI section */}
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>UPI IDs</Text>
              <TouchableOpacity onPress={addUPI}>
                <Text style={styles.addLink}>+ Add UPI</Text>
              </TouchableOpacity>
            </View>
            {upis.map((upi) => (
              <UPIRow key={upi.id} upi={upi} onDelete={() => deleteUPI(upi.id)} />
            ))}
            {upis.length === 0 && (
              <Text style={styles.emptyText}>No saved UPI IDs</Text>
            )}

            {/* Security note */}
            <View style={styles.securityNote}>
              <Icon name="shield-checkmark-outline" size={16} color={Colors.primary} />
              <Text style={styles.securityText}>
                Payment details are encrypted and processed securely via Razorpay. We never store your full card number.
              </Text>
            </View>
          </>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    ...shadow.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 20, paddingBottom: 48 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  addLink: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  emptyText: { fontSize: 13, color: Colors.textHint, textAlign: 'center', paddingVertical: 12 },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.successLight, borderRadius: borderRadius.md, padding: 14, marginTop: 24, borderWidth: 1, borderColor: Colors.primary },
  securityText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});

export default PaymentMethodsScreen;
