// FILE: src/screens/buyer/OrderConfirmationScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { useAppSelector } from '../../store';
import { selectCartItems, selectCartTotal } from '../../store/cartSlice';
import { buyerApi } from '../../api/buyer';
import { ordersApi } from '../../api/orders';
import type { Address } from '../../types/buyer';
import type { BuyerStackParamList } from '../../navigation/types';

// Razorpay native module — dynamic require so the app doesn't crash if the
// native module isn't linked yet on first install.
let RazorpayCheckout: any = null;
try { RazorpayCheckout = require('react-native-razorpay').default; } catch {}

// Public Razorpay test key. Replace with prod key from env before Play Store
// release. Test mode: no real charge, accepts test cards/UPI.
const RAZORPAY_KEY = 'rzp_test_1DP5mmOlF5G5ag';

type PaymentMethod = 'COD' | 'UPI' | 'CARD';
const PLATFORM_FEE = 5;
const DELIVERY_FEE = 40;
const FREE_THRESHOLD = 500;

export const OrderConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const route = useRoute<RouteProp<BuyerStackParamList, 'OrderConfirmation'>>();
  const { addressId } = route.params;

  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);

  const [address, setAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [placing, setPlacing] = useState(false);
  const tabIndicator = useRef(new Animated.Value(0)).current;

  const deliveryFee = cartTotal >= FREE_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = cartTotal + deliveryFee + PLATFORM_FEE;

  useEffect(() => {
    buyerApi.getAddresses().then((r: any) => {
      const list: Address[] = r.data || [];
      const found = list.find((a) => a.id === addressId) || list[0];
      setAddress(found || null);
    }).catch(() => {});
  }, [addressId]);

  const selectPayment = (method: PaymentMethod, index: number) => {
    setPaymentMethod(method);
    Animated.timing(tabIndicator, {
      toValue: index,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Opens Razorpay checkout for UPI/Card. Resolves with the paymentId on
  // success, rejects on cancel/failure.
  const openRazorpay = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!RazorpayCheckout) {
        reject(new Error('Payment SDK not available. Please use Cash on Delivery.'));
        return;
      }
      RazorpayCheckout.open({
        key: RAZORPAY_KEY,
        amount: Math.round(grandTotal * 100), // paise
        currency: 'INR',
        name: 'AgriDirect',
        description: `Order — ${cartItems.length} item${cartItems.length === 1 ? '' : 's'}`,
        prefill: {
          name: address ? address.label : '',
          contact: '',
          email: '',
        },
        theme: { color: Colors.primary as string },
        method: paymentMethod === 'UPI' ? { upi: true } : undefined,
      })
        .then((data: any) => resolve(data.razorpay_payment_id ?? 'paid'))
        .catch((err: any) => reject(new Error(err?.description || err?.message || 'Payment cancelled')));
    });
  }, [grandTotal, cartItems.length, address, paymentMethod]);

  const handlePay = useCallback(async () => {
    if (paymentMethod === 'UPI' || paymentMethod === 'CARD') {
      try {
        await openRazorpay();
      } catch (e: any) {
        Alert.alert('Payment Failed', e?.message ?? 'Try again or pick Cash on Delivery.');
        return;
      }
    }
    setPlacing(true);
    try {
      const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        // Belt-and-braces: never send NaN/null. Cart should already be clean
        // post-fix in cartSlice, but if for any reason it isn't, fall back
        // to minOrderQuantity or 1 so the backend gets a valid number.
        quantity: Number.isFinite(item.quantity) && item.quantity > 0
          ? item.quantity
          : (item.minOrderQuantity || 1),
        pricePerUnit: Number.isFinite(item.price) ? item.price : 0,
        unit: item.unit || 'kg',
      }));
      const res: any = await ordersApi.place({
        items: orderItems as any,
        addressId,
        paymentMethod,
        deliveryFee,
      } as any);
      const order = res.data;
      navigation.navigate('PaymentSuccess', {
        orderId: order.id,
        amount: grandTotal,
        orderNumber: order.orderNumber,
      });
    } catch (e: any) {
      Alert.alert('Order Failed', e?.message || 'Something went wrong. Please try again.');
    } finally {
      setPlacing(false);
    }
  }, [paymentMethod, cartItems, addressId, deliveryFee, grandTotal, navigation]);

  const TAB_WIDTH = 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Items Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛒 Items ({cartItems.length})</Text>
          {cartItems.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {/* Payment Method Tabs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💳 Payment Method</Text>
          <View style={styles.tabBar}>
            {(['COD', 'UPI', 'CARD'] as PaymentMethod[]).map((method, i) => (
              <TouchableOpacity key={method} style={styles.tab} onPress={() => selectPayment(method, i)}>
                <Text style={[styles.tabText, paymentMethod === method && styles.tabTextActive]}>
                  {method === 'COD' ? '💵 Cash' : method === 'UPI' ? '📱 UPI' : '💳 Card'}
                </Text>
              </TouchableOpacity>
            ))}
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  left: tabIndicator.interpolate({ inputRange: [0, 1, 2], outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2] }),
                  width: TAB_WIDTH,
                },
              ]}
            />
          </View>

          {paymentMethod === 'UPI' && (
            <View style={styles.upiOptions}>
              <View style={styles.upiRow}>
                <View style={styles.upiIcon}><Text style={styles.upiIconText}>G</Text></View>
                <Text style={styles.upiLabel}>Google Pay</Text>
              </View>
              <View style={styles.upiRow}>
                <View style={[styles.upiIcon, { backgroundColor: '#6739B7' }]}><Text style={styles.upiIconText}>P</Text></View>
                <Text style={styles.upiLabel}>PhonePe</Text>
              </View>
              <Text style={styles.upiNote}>⚠ UPI payments require Razorpay integration</Text>
            </View>
          )}
          {paymentMethod === 'CARD' && (
            <Text style={styles.upiNote}>⚠ Card payments require Razorpay integration</Text>
          )}
        </View>

        {/* Bill Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Total</Text>
            <Text style={styles.billValue}>₹{cartTotal.toFixed(0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={deliveryFee === 0 ? styles.freeText : styles.billValue}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
            <Text style={styles.billValue}>₹{PLATFORM_FEE}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(0)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        {address && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📍 Delivering to</Text>
            <Text style={styles.addressLabel}>{address.label}</Text>
            <Text style={styles.addressText}>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</Text>
            <Text style={styles.addressText}>{address.city}, {address.state} — {address.pincode}</Text>
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={placing}>
          {placing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.payBtnText}>
              {paymentMethod === 'COD' ? `Confirm Order · ₹${grandTotal.toFixed(0)}` : `Pay ₹${grandTotal.toFixed(0)}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderConfirmationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: Colors.white, ...shadow.sm },
  backText: { fontSize: 22, color: Colors.textPrimary, width: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 14, marginBottom: 12, ...shadow.sm },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  itemName: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  itemQty: { fontSize: 13, color: Colors.textHint, marginHorizontal: 8 },
  itemTotal: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  tabBar: { flexDirection: 'row', position: 'relative', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12 },
  tab: { width: 100, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: -1, height: 2, backgroundColor: Colors.primary, borderRadius: 1 },
  upiOptions: { gap: 10 },
  upiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  upiIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#1A73E8', alignItems: 'center', justifyContent: 'center' },
  upiIconText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  upiLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  upiNote: { fontSize: 12, color: Colors.warning, marginTop: 8 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  billLabel: { fontSize: 14, color: Colors.textSecondary },
  billValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  freeText: { fontSize: 14, color: Colors.accent, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  addressLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 2 },
  addressText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: Colors.white, ...shadow.lg },
  payBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingVertical: 15, alignItems: 'center' },
  payBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
