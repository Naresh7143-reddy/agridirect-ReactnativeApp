// FILE: src/screens/admin/AdminFarmerVerificationScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { adminApi } from '../../api/admin';
import type { PendingFarmer } from '../../types/admin';

const DOC_CHECKS = [
  { key: 'aadhaar', label: 'Aadhaar Card', icon: '🪪' },
  { key: 'land', label: 'Land Records', icon: '📋' },
  { key: 'bank', label: 'Bank Details', icon: '🏦' },
  { key: 'photo', label: 'Profile Photo', icon: '📷' },
];

// ── FarmerCard sub-component ─────────────────────────────────────────────────
interface FarmerCardProps {
  farmer: PendingFarmer;
  onReview: () => void;
}

const FarmerCard: React.FC<FarmerCardProps> = ({ farmer, onReview }) => {
  const initials = ((farmer as any).name || 'F').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={styles.farmerCard}>
      <View style={styles.farmerAvatar}>
        <Text style={styles.farmerAvatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.farmerName}>{(farmer as any).name}</Text>
        <Text style={styles.farmerMeta}>📞 {(farmer as any).phone}</Text>
        <Text style={styles.farmerMeta}>📍 {(farmer as any).location || (farmer as any).city || 'N/A'}</Text>
        <Text style={styles.farmerMeta}>📅 Joined {new Date((farmer as any).createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
      </View>
      <TouchableOpacity style={styles.reviewBtn} onPress={onReview}>
        <Text style={styles.reviewBtnText}>Review</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const AdminFarmerVerificationScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [farmers, setFarmers] = useState<PendingFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<PendingFarmer | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadFarmers = useCallback(async () => {
    try {
      const res: any = await adminApi.getPendingFarmers({ limit: 50 });
      setFarmers(res.data?.items || []);
    } catch {
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFarmers(); }, [loadFarmers]);

  const handleVerify = useCallback(async () => {
    if (!selectedFarmer) return;
    setActionLoading(true);
    try {
      await adminApi.verifyFarmer((selectedFarmer as any).id);
      setFarmers((prev) => prev.filter((f) => (f as any).id !== (selectedFarmer as any).id));
      setSelectedFarmer(null);
      Alert.alert('Success', 'Farmer verified successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to verify farmer.');
    } finally {
      setActionLoading(false);
    }
  }, [selectedFarmer]);

  const handleReject = useCallback(async () => {
    if (!selectedFarmer || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.rejectFarmer((selectedFarmer as any).id, rejectReason.trim());
      setFarmers((prev) => prev.filter((f) => (f as any).id !== (selectedFarmer as any).id));
      setSelectedFarmer(null);
      setRejecting(false);
      setRejectReason('');
      Alert.alert('Done', 'Farmer rejected.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reject farmer.');
    } finally {
      setActionLoading(false);
    }
  }, [selectedFarmer, rejectReason]);

  const renderFarmer = ({ item }: { item: PendingFarmer }) => (
    <FarmerCard farmer={item} onReview={() => setSelectedFarmer(item)} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Verification</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{farmers.length}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlashList
          data={farmers}
          renderItem={renderFarmer}
          keyExtractor={(f) => (f as any).id}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No pending verifications</Text>
            </View>
          }
        />
      )}

      {/* Review Bottom Sheet */}
      <Modal
        isVisible={selectedFarmer !== null}
        onBackdropPress={() => { setSelectedFarmer(null); setRejecting(false); }}
        style={styles.modal}
        swipeDirection="down"
        onSwipeComplete={() => { setSelectedFarmer(null); setRejecting(false); }}
      >
        {selectedFarmer && (
          <View style={styles.reviewSheet}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Farmer Details */}
              <View style={styles.sheetFarmerHeader}>
                <View style={styles.sheetAvatar}>
                  <Text style={styles.sheetAvatarText}>
                    {((selectedFarmer as any).name || 'F').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.sheetFarmerName}>{(selectedFarmer as any).name}</Text>
                  <Text style={styles.sheetFarmerPhone}>{(selectedFarmer as any).phone}</Text>
                  <Text style={styles.sheetFarmerLocation}>{(selectedFarmer as any).location || 'Location not provided'}</Text>
                </View>
              </View>

              {/* Document Checks */}
              <Text style={styles.sheetSectionTitle}>Document Status</Text>
              {DOC_CHECKS.map((doc) => (
                <View key={doc.key} style={styles.docRow}>
                  <Text style={styles.docIcon}>{doc.icon}</Text>
                  <Text style={styles.docLabel}>{doc.label}</Text>
                  <Text style={styles.docStatus}>✅ Submitted</Text>
                </View>
              ))}

              {/* Extra info */}
              <View style={styles.infoCard}>
                <Text style={styles.infoRow}>🚜 Land Size: {(selectedFarmer as any).landSize || '2.5 acres'}</Text>
                <Text style={styles.infoRow}>🌾 Crops: {(selectedFarmer as any).crops || 'Tomatoes, Spinach'}</Text>
                <Text style={styles.infoRow}>📅 Applied: {new Date((selectedFarmer as any).createdAt || Date.now()).toLocaleDateString('en-IN')}</Text>
              </View>

              {/* Reject reason input */}
              {rejecting && (
                <View style={styles.rejectInputWrap}>
                  <Text style={styles.rejectInputLabel}>Reason for rejection *</Text>
                  <TextInput
                    style={styles.rejectInput}
                    placeholder="Enter rejection reason..."
                    placeholderTextColor={Colors.textHint}
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Action Buttons */}
              {!rejecting ? (
                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => setRejecting(true)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.rejectBtnText}>❌ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.verifyBtn, actionLoading && styles.btnDisabled]}
                    onPress={handleVerify}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.verifyBtnText}>✅ Verify Farmer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setRejecting(false); setRejectReason(''); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectConfirmBtn, (!rejectReason.trim() || actionLoading) && styles.btnDisabled]}
                    onPress={handleReject}
                    disabled={!rejectReason.trim() || actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.rejectConfirmText}>Confirm Rejection</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

export default AdminFarmerVerificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: Colors.white, ...shadow.sm },
  backText: { fontSize: 22, color: Colors.textPrimary, width: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  pendingBadge: { backgroundColor: Colors.error, borderRadius: borderRadius.full, minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  pendingBadgeText: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  listContent: { padding: 14, paddingBottom: 40 },
  farmerCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 14, marginBottom: 12, ...shadow.sm },
  farmerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  farmerAvatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  farmerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  farmerMeta: { fontSize: 12, color: Colors.textSecondary, lineHeight: 20 },
  reviewBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  reviewBtnText: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textHint, marginTop: 4 },
  modal: { justifyContent: 'flex-end', margin: 0 },
  reviewSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%', paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetFarmerHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  sheetAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sheetAvatarText: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  sheetFarmerName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sheetFarmerPhone: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  sheetFarmerLocation: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  sheetSectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  docIcon: { fontSize: 18, marginRight: 10, width: 24 },
  docLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  docStatus: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  infoCard: { backgroundColor: Colors.background, borderRadius: borderRadius.md, padding: 12, marginVertical: 14, gap: 4 },
  infoRow: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22 },
  rejectInputWrap: { marginBottom: 12 },
  rejectInputLabel: { fontSize: 13, fontWeight: '600', color: Colors.error, marginBottom: 6 },
  rejectInput: { backgroundColor: Colors.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: Colors.error, padding: 12, fontSize: 14, color: Colors.textPrimary, height: 80 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  rejectBtn: { flex: 1, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: Colors.error },
  rejectBtnText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
  verifyBtn: { flex: 2, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.primary },
  verifyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  cancelBtn: { flex: 1, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
  rejectConfirmBtn: { flex: 2, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.error },
  rejectConfirmText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
});
