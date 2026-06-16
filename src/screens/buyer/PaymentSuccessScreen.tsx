// FILE: src/screens/buyer/PaymentSuccessScreen.tsx
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Clipboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HapticFeedback from 'react-native-haptic-feedback';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { useAppDispatch } from '../../store';
import { clearCart } from '../../store/cartSlice';
import type { BuyerStackParamList } from '../../navigation/types';

export const PaymentSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const route = useRoute<RouteProp<BuyerStackParamList, 'PaymentSuccess'>>();
  const { orderId, amount, orderNumber } = route.params;
  const dispatch = useAppDispatch();
  const confettiRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(clearCart());
    // Animate in
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    setTimeout(() => confettiRef.current?.start(), 300);
  }, [dispatch, scaleAnim, fadeAnim]);

  const handleCopyOrderNumber = useCallback(() => {
    Clipboard.setString(orderNumber);
    HapticFeedback.trigger('impactMedium', { enableVibrateFallback: true, ignoreAndroidSystemSettings: false });
  }, [orderNumber]);

  return (
    <View style={styles.container}>
      <ConfettiCannon
        ref={confettiRef}
        count={120}
        origin={{ x: -10, y: 0 }}
        colors={[Colors.primary, Colors.secondary, Colors.accent, Colors.white, '#F9A825']}
        autoStart={false}
        fadeOut
      />

      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>✅</Text>
        </View>

        <Text style={styles.successTitle}>Order Placed! 🎉</Text>
        <Text style={styles.successSubtitle}>Your fresh produce is on its way</Text>

        {/* Order Number */}
        <View style={styles.orderCard}>
          <Text style={styles.orderLabel}>Order Number</Text>
          <View style={styles.orderNumberRow}>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
            <TouchableOpacity onPress={handleCopyOrderNumber} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>📋 Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.amountText}>Total Paid: ₹{amount.toFixed(0)}</Text>
        </View>

        {/* ETA */}
        <View style={styles.etaCard}>
          <Text style={styles.etaIcon}>🚚</Text>
          <View>
            <Text style={styles.etaTitle}>Estimated Delivery</Text>
            <Text style={styles.etaTime}>Today by 6 PM</Text>
          </View>
        </View>
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttonGroup, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.navigate('OrderTracking', { orderId })}
        >
          <Text style={styles.trackBtnText}>Track Order →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.navigate('BuyerTabs', { screen: 'HomeTab' } as any)}
        >
          <Text style={styles.continueBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default PaymentSuccessScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...shadow.md },
  iconText: { fontSize: 52 },
  successTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  successSubtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  orderCard: { width: '100%', backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 18, marginTop: 24, ...shadow.md, alignItems: 'center' },
  orderLabel: { fontSize: 12, color: Colors.textHint, marginBottom: 6 },
  orderNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderNumber: { fontSize: 20, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },
  copyBtn: { backgroundColor: Colors.infoLight, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  copyBtnText: { color: Colors.info, fontSize: 12, fontWeight: '600' },
  amountText: { fontSize: 14, color: Colors.textSecondary, marginTop: 10, fontWeight: '500' },
  etaCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 16, marginTop: 12, width: '100%', ...shadow.sm },
  etaIcon: { fontSize: 32 },
  etaTitle: { fontSize: 12, color: Colors.textHint },
  etaTime: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  buttonGroup: { width: '100%', marginTop: 32, gap: 12 },
  trackBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingVertical: 15, alignItems: 'center' },
  trackBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  continueBtn: { borderRadius: borderRadius.lg, paddingVertical: 15, alignItems: 'center', borderWidth: 2, borderColor: Colors.primary },
  continueBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
});
