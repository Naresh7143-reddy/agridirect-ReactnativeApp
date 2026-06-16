// FILE: src/screens/common/SavedAddressesScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';
import { buyerApi } from '../../api/buyer';
import type { Address } from '../../types/buyer';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const labelIcon = (label: string): string => {
  const lower = label.toLowerCase();
  if (lower === 'home') return 'home-outline';
  if (lower === 'office' || lower === 'work') return 'briefcase-outline';
  return 'location-outline';
};

// ─── AddressCard ──────────────────────────────────────────────────────────────

interface CardProps {
  item: Address;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const AddressCard: React.FC<CardProps> = ({ item, onEdit, onDelete, onSetDefault }) => {
  const handleLongPress = useCallback(() => {
    if (item.isDefault) return;
    Alert.alert(
      'Set as Default',
      `Set "${item.label}" as your default delivery address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set Default', onPress: () => onSetDefault(item.id) },
      ],
    );
  }, [item.isDefault, item.id, item.label, onSetDefault]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${item.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ],
    );
  }, [item.id, item.label, onDelete]);

  const fullAddress = [item.line1, item.line2, item.city, item.state, item.pincode]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      style={[styles.card, shadow.sm]}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
      delayLongPress={400}
    >
      <View style={[styles.iconCircle, item.isDefault && styles.iconCircleDefault]}>
        <Icon
          name={labelIcon(item.label)}
          size={20}
          color={item.isDefault ? Colors.primary : Colors.textSecondary}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardLabel}>{item.label}</Text>
          {item.isDefault && (
            <View style={styles.defaultPill}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardAddress} numberOfLines={2}>{fullAddress}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="pencil-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const SavedAddressesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAddresses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await buyerApi.getAddresses();
      // Sort default first
      const sorted = [...res.data].sort((a, b) =>
        a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1,
      );
      setAddresses(sorted);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load addresses' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleEdit = useCallback(
    (id: string) => {
      // Navigate to AddressSelection with the id pre-filled (if your navigator supports it)
      navigation.navigate('AddressSelection', { editAddressId: id });
    },
    [navigation],
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await buyerApi.deleteAddress(id);
      LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      Toast.show({ type: 'success', text1: 'Address deleted' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete address' });
    }
  }, []);

  const handleSetDefault = useCallback(async (id: string) => {
    try {
      await buyerApi.setDefaultAddress(id);
      setAddresses((prev) => {
        const updated = prev
          .map((a) => ({ ...a, isDefault: a.id === id }))
          .sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
        return updated;
      });
      Toast.show({ type: 'success', text1: 'Default address updated' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to set default address' });
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Address }) => (
      <AddressCard
        item={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />
    ),
    [handleEdit, handleDelete, handleSetDefault],
  );

  const AddNewCard = (
    <TouchableOpacity
      style={[styles.addCard, shadow.sm]}
      onPress={() => navigation.navigate('AddressSelection')}
      activeOpacity={0.8}
    >
      <Icon name="add-circle-outline" size={28} color={Colors.primary} />
      <Text style={styles.addText}>Add New Address</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      ) : (
        <FlashList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="location-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>No saved addresses</Text>
              <Text style={styles.emptyText}>Add a delivery address to get started</Text>
            </View>
          }
          ListFooterComponent={AddNewCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAddresses(true)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />

      )}
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
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  iconCircleDefault: { backgroundColor: Colors.successLight },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  defaultPill: {
    backgroundColor: Colors.successLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultText: { fontSize: 11, fontWeight: '600', color: Colors.success },
  cardAddress: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  actionBtn: { padding: 6 },
  addCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    marginTop: 4,
  },
  addText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: Colors.textHint },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});

export default SavedAddressesScreen;
