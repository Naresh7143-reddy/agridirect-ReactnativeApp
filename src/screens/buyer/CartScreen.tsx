// FILE: src/screens/buyer/CartScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  removeItem,
  updateQuantity,
  selectCartItems,
  selectCartTotal,
  selectCartByFarmer,
} from '../../store/cartSlice';
import { buyerApi } from '../../api/buyer';
import type { CartItem } from '../../store/cartSlice';
import type { Address } from '../../types/buyer';

const PLATFORM_FEE = 5;
const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_FEE = 40;

// ── CartItemRow — own component to avoid hook-in-map ─────────────────────────
interface CartItemRowProps {
  item: CartItem;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item }) => {
  const dispatch = useAppDispatch();

  return (
    <View style={styles.itemRow}>
      <FastImage
        source={{ uri: item.image }}
        style={styles.itemImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{item.price}/{item.unit}</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperQty}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
        <TouchableOpacity
          onPress={() => dispatch(removeItem(item.productId))}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── FarmerGroup — renders one farmer's items ──────────────────────────────────
interface FarmerGroupProps {
  farmerId: string;
  items: CartItem[];
}

const FarmerGroup: React.FC<FarmerGroupProps> = ({ items }) => {
  const farmerName = items[0]?.farmerName || 'Farmer';
  return (
    <View style={styles.farmerGroup}>
      <View style={styles.farmerGroupHeader}>
        <Text style={styles.farmerGroupIcon}>🌾</Text>
        <Text style={styles.farmerGroupName}>{farmerName}</Text>
      </View>
      {items.map((item) => <CartItemRow key={item.productId} item={item} />)}
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const cartByFarmer = useAppSelector(selectCartByFarmer);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const savingsAnim = useRef(new Animated.Value(0)).current;

  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = cartTotal + deliveryFee + PLATFORM_FEE;
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  useEffect(() => {
    buyerApi.getAddresses().then((r: any) => {
      setAddresses(r.data || []);
    }).catch(() => {}).finally(() => setLoadingAddresses(false));
  }, []);

  useEffect(() => {
    if (cartTotal >= FREE_DELIVERY_THRESHOLD) {
      Animated.timing(savingsAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [cartTotal, savingsAnim]);

  const shakePromo = useCallback(() => {
    setPromoError(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setPromoError(false), 2000);
  }, [shakeAnim]);

  const handleApplyPromo = useCallback(() => {
    // Demo: any code other than AGRI10 is invalid
    if (promoCode.toUpperCase() !== 'AGRI10') {
      shakePromo();
    }
  }, [promoCode, shakePromo]);

  const handlePlaceOrder = useCallback(() => {
    if (defaultAddress) {
      navigation.navigate('AddressSelection');
    } else {
      navigation.navigate('AddressSelection');
    }
  }, [defaultAddress, navigation]);

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🥦</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add fresh produce from local farmers</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('BuyerTabs', { screen: 'SearchTab' } as any)}>
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const farmerEntries = Array.from(cartByFarmer.entries());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.headerCount}>{cartItems.length} items</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Savings Banner */}
        {cartTotal >= FREE_DELIVERY_THRESHOLD && (
          <Animated.View style={[styles.savingsBanner, { opacity: savingsAnim }]}>
            <Text style={styles.savingsText}>🎉 You saved ₹{DELIVERY_FEE} on delivery!</Text>
          </Animated.View>
        )}

        {/* Cart Items grouped by farmer */}
        {farmerEntries.map(([farmerId, items]) => (
          <FarmerGroup key={farmerId} farmerId={farmerId} items={items} />
        ))}

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Delivery Address</Text>
          {loadingAddresses ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 12 }} />
          ) : defaultAddress ? (
            <View style={styles.addressRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>{defaultAddress.label}</Text>
                <Text style={styles.addressText}>{defaultAddress.line1}{defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}</Text>
                <Text style={styles.addressText}>{defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('AddressSelection')}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addAddressRow} onPress={() => navigation.navigate('AddressSelection')}>
              <Text style={styles.addAddressText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Promo Code */}
        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.cardTitle}>🏷 Promo Code</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.promoInput, promoError && styles.promoInputError]}
              placeholder="Enter promo code"
              placeholderTextColor={Colors.textHint}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.promoApplyBtn} onPress={handleApplyPromo}>
              <Text style={styles.promoApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {promoError && <Text style={styles.promoErrorText}>Invalid promo code. Try AGRI10</Text>}
        </Animated.View>

        {/* Bill Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Total</Text>
            <Text style={styles.billValue}>₹{cartTotal.toFixed(0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            {deliveryFee === 0 ? (
              <View style={styles.freeDeliveryRow}>
                <Text style={styles.billStrike}>₹{DELIVERY_FEE}</Text>
                <Text style={styles.freeText}> FREE</Text>
              </View>
            ) : (
              <Text style={styles.billValue}>₹{deliveryFee}</Text>
            )}
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
            <Text style={styles.billValue}>₹{PLATFORM_FEE}</Text>
          </View>
          {deliveryFee > 0 && (
            <Text style={styles.freeDeliveryHint}>Add ₹{(FREE_DELIVERY_THRESHOLD - cartTotal).toFixed(0)} more for free delivery</Text>
          )}
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(0)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Place Order Button */}
      <View style={styles.stickyBar}>
        <View>
          <Text style={styles.stickyTotal}>₹{grandTotal.toFixed(0)}</Text>
          <Text style={styles.stickyTotalSub}>inclusive of all charges</Text>
        </View>
        <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderText}>Place Order →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: 32 },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textHint, marginTop: 6, textAlign: 'center' },
  shopBtn: { marginTop: 24, backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: 32, paddingVertical: 14 },
  shopBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: Colors.white, ...shadow.sm },
  backText: { fontSize: 22, color: Colors.textPrimary, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  headerCount: { fontSize: 13, color: Colors.textHint },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 100 },
  savingsBanner: { backgroundColor: Colors.successLight, borderRadius: borderRadius.lg, padding: 12, marginBottom: 12, alignItems: 'center' },
  savingsText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  farmerGroup: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, marginBottom: 12, overflow: 'hidden', ...shadow.sm },
  farmerGroupHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 14, paddingVertical: 10 },
  farmerGroupIcon: { fontSize: 16, marginRight: 8 },
  farmerGroupName: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  itemImage: { width: 60, height: 60, borderRadius: borderRadius.sm },
  itemDetails: { flex: 1, marginHorizontal: 10 },
  itemName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  itemPrice: { fontSize: 12, color: Colors.textHint, marginBottom: 6 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn: { width: 26, height: 26, backgroundColor: Colors.primary, borderRadius: borderRadius.xs, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { color: Colors.white, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  stepperQty: { fontSize: 14, fontWeight: '700', color: Colors.primary, minWidth: 24, textAlign: 'center' },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between', height: 60 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 18 },
  card: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 14, marginBottom: 12, ...shadow.sm },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  addressLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginBottom: 2 },
  addressText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  changeText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  addAddressRow: { paddingVertical: 8 },
  addAddressText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  promoRow: { flexDirection: 'row', gap: 8 },
  promoInput: { flex: 1, backgroundColor: Colors.background, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  promoInputError: { borderColor: Colors.error },
  promoApplyBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.md, paddingHorizontal: 16, paddingVertical: 10 },
  promoApplyText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  promoErrorText: { color: Colors.error, fontSize: 12, marginTop: 6 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  billLabel: { fontSize: 14, color: Colors.textSecondary },
  billValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  freeDeliveryRow: { flexDirection: 'row', alignItems: 'center' },
  billStrike: { fontSize: 13, color: Colors.textHint, textDecorationLine: 'line-through' },
  freeText: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  freeDeliveryHint: { fontSize: 11, color: Colors.primary, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  stickyBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, ...shadow.lg },
  stickyTotal: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  stickyTotalSub: { fontSize: 11, color: Colors.textHint },
  placeOrderBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: 24, paddingVertical: 14 },
  placeOrderText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
