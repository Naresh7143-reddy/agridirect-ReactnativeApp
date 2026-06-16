// FILE: src/screens/delivery/DeliveryNavigationScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Modal from 'react-native-modal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { deliveryApi } from '../../api/delivery';

type DeliveryStackParamList = {
  DeliveryNavigation: { orderId: string; pickupLat: number; pickupLng: number; dropLat: number; dropLng: number };
  DeliveryOrderDetail: { orderId: string };
};

type Phase =
  | 'GOING_TO_FARM'
  | 'ARRIVED_AT_FARM'
  | 'PICKED_UP'
  | 'GOING_TO_DROP'
  | 'ARRIVED_AT_DROP'
  | 'DELIVERED';

const PHASE_STEPS: { phase: Phase; label: string; action: string; deliveryStatus: string }[] = [
  { phase: 'GOING_TO_FARM', label: 'Going to farm', action: 'Arrived at Farm', deliveryStatus: 'ACCEPTED' },
  { phase: 'ARRIVED_AT_FARM', label: 'At farm — pickup produce', action: 'Order Picked Up', deliveryStatus: 'PICKED_UP' },
  { phase: 'PICKED_UP', label: 'Going to customer', action: 'Arrived at Delivery', deliveryStatus: 'IN_TRANSIT' },
  { phase: 'ARRIVED_AT_DROP', label: 'At delivery location', action: 'Delivered Successfully', deliveryStatus: 'DELIVERED' },
];

export const DeliveryNavigationScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DeliveryStackParamList>>();
  const route = useRoute<RouteProp<DeliveryStackParamList, 'DeliveryNavigation'>>();
  const { orderId } = route.params;

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [done, setDone] = useState(false);
  const confettiRef = useRef<any>(null);
  const earningsAnim = useRef(new Animated.Value(0)).current;

  const currentStep = PHASE_STEPS[phaseIndex];

  useEffect(() => {
    if (done) {
      confettiRef.current?.start();
      Animated.timing(earningsAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [done, earningsAnim]);

  const handleAction = useCallback(async () => {
    setUpdating(true);
    setShowConfirm(false);
    try {
      await deliveryApi.updateOrderStatus(orderId, currentStep.deliveryStatus as any);
      if (phaseIndex >= PHASE_STEPS.length - 1) {
        setDone(true);
      } else {
        setPhaseIndex((prev) => prev + 1);
      }
    } catch (e: any) {
      Alert.alert('Update Failed', e?.message || 'Please try again.');
    } finally {
      setUpdating(false);
    }
  }, [orderId, currentStep, phaseIndex]);

  if (done) {
    return (
      <View style={styles.successScreen}>
        <ConfettiCannon
          ref={confettiRef}
          count={100}
          origin={{ x: 200, y: 0 }}
          colors={[Colors.primary, Colors.secondary, Colors.accent, Colors.white]}
          autoStart={false}
          fadeOut
        />
        <Animated.View style={[styles.earningsCard, { opacity: earningsAnim, transform: [{ scale: earningsAnim }] }]}>
          <Text style={styles.deliveredIcon}>🎉</Text>
          <Text style={styles.deliveredTitle}>Delivery Complete!</Text>
          <Text style={styles.deliveredSub}>Great job! Order delivered successfully.</Text>
          <View style={styles.earningsBox}>
            <Text style={styles.earningsLabel}>You Earned</Text>
            <Text style={styles.earningsValue}>₹72</Text>
            <Text style={styles.earningsDetail}>₹40 base + ₹32 distance bonus</Text>
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        {/* Turn instruction overlay */}
        <View style={styles.turnCard}>
          <Text style={styles.turnArrow}>↰</Text>
          <View>
            <Text style={styles.turnInstruction}>Turn left in 200m</Text>
            <Text style={styles.turnStreet}>Farm Road, Sector 4</Text>
          </View>
        </View>
        <Text style={styles.mapIcon}>🗺️</Text>
        <View style={styles.routeLine} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Phase indicator */}
      <View style={styles.phaseRow}>
        {PHASE_STEPS.map((step, i) => (
          <View key={step.phase} style={[styles.phaseDot, i <= phaseIndex && styles.phaseDotActive]} />
        ))}
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.navInfo}>
          <View>
            <Text style={styles.phaseLabel}>{currentStep?.label}</Text>
            <Text style={styles.distanceText}>~1.2 km • 5 min away</Text>
          </View>
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaTime}>5 min</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, updating && styles.actionBtnDisabled]}
          onPress={() => setShowConfirm(true)}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.actionBtnText}>{currentStep?.action} ✓</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        isVisible={showConfirm}
        onBackdropPress={() => setShowConfirm(false)}
        style={styles.modal}
      >
        <View style={styles.confirmSheet}>
          <Text style={styles.confirmTitle}>Confirm Action</Text>
          <Text style={styles.confirmMessage}>Are you sure you want to mark: "{currentStep?.action}"?</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfirm(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleAction}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DeliveryNavigationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapPlaceholder: { flex: 1, backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  turnCard: { position: 'absolute', top: 60, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 14, ...shadow.md },
  turnArrow: { fontSize: 32, color: Colors.primary },
  turnInstruction: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  turnStreet: { fontSize: 13, color: Colors.textHint },
  mapIcon: { fontSize: 64, opacity: 0.3 },
  routeLine: { position: 'absolute', width: 4, height: '50%', backgroundColor: Colors.primary, opacity: 0.4, borderRadius: 2 },
  backBtn: { position: 'absolute', top: 60, left: 16, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: borderRadius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  backBtnText: { fontSize: 20 },
  phaseRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: Colors.white },
  phaseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  phaseDotActive: { backgroundColor: Colors.primary },
  bottomBar: { backgroundColor: Colors.white, padding: 16, paddingBottom: 32, ...shadow.lg },
  navInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  phaseLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  distanceText: { fontSize: 13, color: Colors.textHint, marginTop: 2 },
  etaBox: { alignItems: 'center', backgroundColor: Colors.successLight, borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 8 },
  etaLabel: { fontSize: 11, color: Colors.textHint },
  etaTime: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingVertical: 15, alignItems: 'center' },
  actionBtnDisabled: { backgroundColor: Colors.border },
  actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  successScreen: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', padding: 24 },
  earningsCard: { alignItems: 'center', width: '100%' },
  deliveredIcon: { fontSize: 72 },
  deliveredTitle: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginTop: 12 },
  deliveredSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  earningsBox: { backgroundColor: Colors.successLight, borderRadius: borderRadius.xl, padding: 24, marginTop: 24, alignItems: 'center', width: '100%' },
  earningsLabel: { fontSize: 13, color: Colors.textHint },
  earningsValue: { fontSize: 48, fontWeight: '800', color: Colors.primary, marginTop: 4 },
  earningsDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: 48, paddingVertical: 14, marginTop: 32 },
  doneBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  modal: { justifyContent: 'flex-end', margin: 0 },
  confirmSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  confirmActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 15 },
  confirmBtn: { flex: 1, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.primary },
  confirmBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
