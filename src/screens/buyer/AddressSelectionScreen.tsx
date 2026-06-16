// FILE: src/screens/buyer/AddressSelectionScreen.tsx
//
// Buyer's delivery address picker. Flow:
//   1. Loads saved addresses from /api/buyer/addresses
//   2. Lets user pick one OR add a new one with two options:
//        a) "Use current GPS location" — auto-fills city/state/pincode via
//           Geolocation + reverse-geocode (OpenStreetMap Nominatim, no key)
//        b) "Type address manually" — modal form with all fields
//   3. POSTs the new address, refreshes list, auto-selects it
//   4. Confirm → navigates to OrderConfirmation with the chosen addressId

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { buyerApi } from '../../api/buyer';
import type { Address, AddAddressRequest } from '../../types/buyer';
import type { BuyerStackParamList } from '../../navigation/types';

// ─── Reverse geocode helper (free OpenStreetMap) ──────────────────────────────

interface ReverseGeocoded {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocoded> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'AgriDirect/1.0' } });
  if (!res.ok) throw new Error('Reverse geocode failed');
  const data = await res.json();
  const a = data.address || {};
  const line1 = [a.house_number, a.road || a.neighbourhood || a.suburb]
    .filter(Boolean).join(' ') || data.display_name?.split(',').slice(0, 2).join(',') || '';
  const city = a.city || a.town || a.village || a.county || '';
  const state = a.state || '';
  const pincode = a.postcode || '';
  return { line1, city, state, pincode };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const AddressSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  // Add-address modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [form, setForm] = useState<{
    label: string; line1: string; line2: string;
    city: string; state: string; pincode: string;
    lat?: number; lng?: number;
  }>({
    label: 'Home', line1: '', line2: '',
    city: '', state: '', pincode: '',
  });

  const loadAddresses = useCallback(async (autoSelectNewest = false) => {
    try {
      const r: any = await buyerApi.getAddresses();
      const list: Address[] = r.data || [];
      setAddresses(list);
      if (autoSelectNewest && list.length) {
        setSelectedId(list[list.length - 1].id);
      } else if (!selectedId) {
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedId(def.id);
      }
    } catch {/* silent */}
    finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => { loadAddresses(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Swiggy/Zomato-style auto-fetch: on first mount, if user has no saved
  // addresses yet, immediately ask for location permission and open the
  // pre-filled form. No tapping required.
  const autoTriggered = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (autoTriggered.current) return;
    if (addresses.length === 0) {
      autoTriggered.current = true;
      handleUseGps();
    }
  }, [loading, addresses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add via GPS ────────────────────────────────────────────────────────────

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission',
        message: 'AgriDirect needs your location to deliver your order.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleUseGps = useCallback(async () => {
    const ok = await requestLocationPermission();
    if (!ok) {
      Alert.alert('Permission required', 'Please allow location access in app settings.');
      return;
    }
    setGpsBusy(true);
    Geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geo = await reverseGeocode(latitude, longitude);
          setForm((f) => ({
            ...f,
            line1: geo.line1 || f.line1,
            city: geo.city || f.city,
            state: geo.state || f.state,
            pincode: geo.pincode || f.pincode,
            lat: latitude,
            lng: longitude,
          }));
          setModalOpen(true);
        } catch (e: any) {
          Alert.alert('Could not get address', e?.message ?? 'Try entering manually.');
          setModalOpen(true);
        } finally { setGpsBusy(false); }
      },
      (err) => {
        setGpsBusy(false);
        const msg = err?.message || '';
        let friendly = 'Could not get your location. ';
        if (msg.toLowerCase().includes('no location provider') || msg.toLowerCase().includes('disabled')) {
          friendly += 'Please turn ON Location (GPS) in your phone settings, then try again.';
        } else if (msg.toLowerCase().includes('timeout')) {
          friendly += 'GPS timed out. Step outside or near a window and try again.';
        } else {
          friendly += msg;
        }
        Alert.alert('Location unavailable', friendly + '\n\nYou can also tap "Type address manually" below.', [
          { text: 'OK', onPress: () => setModalOpen(true) },
        ]);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  // ── Save new address ───────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!form.line1.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      Alert.alert('Missing fields', 'Please fill address line, city, state and pincode.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: AddAddressRequest = {
        label: form.label || 'Home',
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        lat: form.lat,
        lng: form.lng,
        setAsDefault: addresses.length === 0,
      };
      await buyerApi.addAddress(payload);
      setModalOpen(false);
      setForm({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '' });
      await loadAddresses(true);
    } catch (e: any) {
      Alert.alert('Could not save', e?.response?.data?.message ?? e?.message ?? 'Try again.');
    } finally { setSubmitting(false); }
  }, [form, addresses.length, loadAddresses]);

  const handleConfirm = () => {
    if (!selectedId) return;
    navigation.navigate('OrderConfirmation', { addressId: selectedId, paymentMethod: 'COD' });
  };

  const renderAddress = ({ item }: { item: Address }) => {
    const isSelected = selectedId === item.id;
    return (
      <TouchableOpacity
        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
        onPress={() => setSelectedId(item.id)}
        activeOpacity={0.85}
      >
        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.labelRow}>
            <Text style={styles.addressLabelText}>{item.label}</Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.addressLine}>{item.line1}{item.line2 ? `, ${item.line2}` : ''}</Text>
          <Text style={styles.addressLine}>{item.city}, {item.state} — {item.pincode}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Address</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* GPS quick action */}
      <TouchableOpacity
        style={styles.gpsCard}
        onPress={handleUseGps}
        activeOpacity={0.85}
        disabled={gpsBusy}
      >
        {gpsBusy ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={styles.gpsIcon}>📍</Text>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.gpsTitle}>{gpsBusy ? 'Getting your location…' : 'Use current location'}</Text>
          <Text style={styles.gpsSub}>Auto-fill from GPS — fastest</Text>
        </View>
        <Text style={styles.gpsChev}>›</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlashList
          data={addresses}
          renderItem={renderAddress}
          keyExtractor={(a) => a.id}
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No saved addresses yet</Text>
              <Text style={styles.emptySub}>Tap below to add your first delivery address</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addAddressCard}
              onPress={() => setModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addAddressIcon}>＋</Text>
              <Text style={styles.addAddressText}>Type address manually</Text>
            </TouchableOpacity>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, !selectedId && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selectedId}
        >
          <Text style={styles.confirmBtnText}>Confirm This Location →</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add Address Modal ──────────────────────────────────────────────── */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Add Address</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
              {/* Label pills */}
              <Text style={styles.fieldLabel}>Label</Text>
              <View style={styles.pillRow}>
                {['Home', 'Office', 'Other'].map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.pill, form.label === l && styles.pillSelected]}
                    onPress={() => setForm((f) => ({ ...f, label: l }))}
                  >
                    <Text style={[styles.pillText, form.label === l && styles.pillTextSelected]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Address line 1 *</Text>
              <TextInput
                style={styles.input}
                value={form.line1}
                onChangeText={(v) => setForm((f) => ({ ...f, line1: v }))}
                placeholder="House / flat / street"
                placeholderTextColor={Colors.textHint}
              />

              <Text style={styles.fieldLabel}>Address line 2</Text>
              <TextInput
                style={styles.input}
                value={form.line2}
                onChangeText={(v) => setForm((f) => ({ ...f, line2: v }))}
                placeholder="Landmark / area (optional)"
                placeholderTextColor={Colors.textHint}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>City *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.city}
                    onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                    placeholder="City"
                    placeholderTextColor={Colors.textHint}
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Pincode *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.pincode}
                    onChangeText={(v) => setForm((f) => ({ ...f, pincode: v.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="6-digit"
                    placeholderTextColor={Colors.textHint}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>State *</Text>
              <TextInput
                style={styles.input}
                value={form.state}
                onChangeText={(v) => setForm((f) => ({ ...f, state: v }))}
                placeholder="State"
                placeholderTextColor={Colors.textHint}
              />

              <TouchableOpacity
                style={[styles.gpsInsideModal, gpsBusy && { opacity: 0.6 }]}
                onPress={handleUseGps}
                disabled={gpsBusy}
              >
                {gpsBusy ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.gpsInsideText}>📍 Auto-fill from GPS</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>Save Address</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default AddressSelectionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: Colors.white, ...shadow.sm },
  backText: { fontSize: 22, color: Colors.textPrimary, width: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },

  gpsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 16, padding: 16, borderRadius: borderRadius.lg,
    backgroundColor: Colors.successLight, borderWidth: 1.5, borderColor: Colors.primary,
  },
  gpsIcon: { fontSize: 28 },
  gpsTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  gpsSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  gpsChev:  { fontSize: 22, color: Colors.primary, fontWeight: '700' },

  listContent: { padding: 16, paddingBottom: 120 },
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 14, marginBottom: 12, borderWidth: 2, borderColor: Colors.border, ...shadow.sm },
  addressCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.successLight },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  radioCircleActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addressLabelText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  defaultBadge: { backgroundColor: Colors.primary, borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  defaultBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '600' },
  addressLine: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  addAddressCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', paddingVertical: 18, marginBottom: 12 },
  addAddressIcon: { fontSize: 20, color: Colors.primary, marginRight: 8 },
  addAddressText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  emptyText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  emptySub:  { color: Colors.textHint, fontSize: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: Colors.white, ...shadow.lg },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingVertical: 15, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: Colors.border },
  confirmBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },

  /* modal */
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 16, paddingBottom: 24, maxHeight: '88%',
  },
  modalHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 8 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  modalClose: { fontSize: 22, color: Colors.textSecondary },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  row: { flexDirection: 'row' },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  pillSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  pillTextSelected: { color: Colors.white },

  gpsInsideModal: {
    marginTop: 18, paddingVertical: 12, alignItems: 'center',
    borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  gpsInsideText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },

  saveBtn: {
    marginTop: 16, backgroundColor: Colors.primary,
    borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
