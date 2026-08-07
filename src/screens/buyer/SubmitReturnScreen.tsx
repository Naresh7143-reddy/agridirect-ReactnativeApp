import React, { useState } from 'react';
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
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { returnsApi } from '../../api/returns';
import type { ReturnReason } from '../../types/return';

type RouteParams = {
  SubmitReturn: { orderId: string };
};

const REASONS: { label: string; value: ReturnReason }[] = [
  { label: 'Spoiled / Rotten Produce', value: 'SPOILED' },
  { label: 'Damaged Packaging / Item', value: 'DAMAGED' },
  { label: 'Wrong Item Delivered', value: 'WRONG_ITEM' },
  { label: 'Quality / Freshness Issue', value: 'QUALITY_ISSUE' },
  { label: 'Other', value: 'OTHER' },
];

export default function SubmitReturnScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'SubmitReturn'>>();
  const orderId = route.params?.orderId || '';

  const [reason, setReason] = useState<ReturnReason>('SPOILED');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a brief description of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      await returnsApi.submit({
        orderId,
        reason,
        description: description.trim(),
      });
      Alert.alert('Return Submitted', 'Your return request has been submitted to the farmer for inspection.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Submission Failed', e?.response?.data?.message || 'Could not submit return request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Request Return / Refund</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.sectionTitle}>Select Issue Reason</Text>
        {REASONS.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[s.reasonCard, reason === r.value && s.reasonCardSelected]}
            onPress={() => setReason(r.value)}
          >
            <Icon
              name={reason === r.value ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={reason === r.value ? Colors.primary : Colors.textHint}
            />
            <Text style={[s.reasonText, reason === r.value && s.reasonTextSelected]}>{r.label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Describe the Issue</Text>
        <TextInput
          style={s.textArea}
          multiline
          numberOfLines={4}
          placeholder="Explain the quality issue, freshness, or damage..."
          placeholderTextColor={Colors.textHint}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[s.submitBtn, submitting && s.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={s.submitText}>Submit Return Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: spacing.base },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12 },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  reasonText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  reasonTextSelected: { color: Colors.primary, fontWeight: '700' },
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: borderRadius.md,
    padding: 14,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 110,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    ...shadow.sm,
  },
  disabledBtn: { opacity: 0.6 },
  submitText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
