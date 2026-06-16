/**
 * InvoiceScreen
 *
 * AgriDirect invoice view for a delivered order:
 * - Letterhead with logo
 * - "PAID" green stamp
 * - Order details table
 * - Items breakdown
 * - Total section
 * - Payment method + transaction ID
 * - Order ID displayed in a styled code box (QR stub — react-native-qrcode-svg not installed)
 * - Share button (built-in Share API)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ordersApi } from '../../api/orders';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import type { Order } from '../../types/order';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹${n.toFixed(2)}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'long', year: 'numeric',
});

// ─── Divider ──────────────────────────────────────────────────────────────────

const Divider: React.FC<{ dashed?: boolean }> = ({ dashed }) => (
  <View style={[dvStyles.line, dashed && dvStyles.dashed]} />
);
const dvStyles = StyleSheet.create({
  line: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  dashed: { borderStyle: 'dashed', borderColor: Colors.border, borderWidth: 1, backgroundColor: 'transparent', height: 0 },
});

// ─── Main component ───────────────────────────────────────────────────────────

type InvoiceRoute = RouteProp<{ InvoiceScreen: { orderId: string } }, 'InvoiceScreen'>;

const InvoiceScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<InvoiceRoute>();
  const orderId = route.params?.orderId ?? '';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getOrderById(orderId)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleShare = async () => {
    if (!order) return;
    await Share.share({
      title: `Invoice ${order.orderNumber}`,
      message: `AgriDirect Invoice\nOrder: ${order.orderNumber}\nDate: ${fmtDate(order.createdAt)}\nTotal: ${fmt(order.grandTotal)}\n\nThank you for shopping with AgriDirect!`,
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: Colors.textSecondary }}>Order not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Icon name="share-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Letterhead */}
        <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.letterhead}>
          <Text style={styles.lhLogo}>🌾 AgriDirect</Text>
          <Text style={styles.lhTagline}>Farm to Table, Directly</Text>
        </LinearGradient>

        {/* Invoice body */}
        <View style={styles.body}>
          {/* PAID stamp */}
          <View style={styles.paidStamp}>
            <Text style={styles.paidText}>PAID</Text>
          </View>

          {/* Invoice meta */}
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Invoice No</Text>
              <Text style={styles.metaValue}>INV-{order.orderNumber}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{fmtDate(order.createdAt)}</Text>
            </View>
          </View>

          <Divider />

          {/* Delivery address */}
          <Text style={styles.sectionTitle}>Delivered To</Text>
          <Text style={styles.addressText}>
            {[
              order.deliveryAddress.line1,
              order.deliveryAddress.line2,
              order.deliveryAddress.city,
              order.deliveryAddress.state,
              order.deliveryAddress.pincode,
            ].filter(Boolean).join(', ')}
          </Text>

          <Divider />

          {/* Items */}
          <Text style={styles.sectionTitle}>Items</Text>
          {/* Column headers */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Item</Text>
            <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>Amount</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 2 }]} numberOfLines={2}>{item.productName}</Text>
              <Text style={[styles.td, { width: 50, textAlign: 'center' }]}>{item.quantity} {item.unit}</Text>
              <Text style={[styles.td, { width: 70, textAlign: 'right' }]}>{fmt(item.total)}</Text>
            </View>
          ))}

          <Divider dashed />

          {/* Totals */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Items Total</Text>
            <Text style={styles.totalVal}>{fmt(order.totalAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee</Text>
            <Text style={styles.totalVal}>{order.deliveryFee === 0 ? 'Free' : fmt(order.deliveryFee)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalVal, { color: Colors.success }]}>-{fmt(order.discount)}</Text>
            </View>
          )}
          <Divider />
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandLabel}>TOTAL PAID</Text>
            <Text style={styles.grandVal}>{fmt(order.grandTotal)}</Text>
          </View>

          <Divider />

          {/* Payment info */}
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Method</Text>
            <Text style={styles.totalVal}>{order.paymentMethod}</Text>
          </View>
          {order.paymentId && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Transaction ID</Text>
              <Text style={[styles.totalVal, styles.txIdText]} numberOfLines={1}>{order.paymentId}</Text>
            </View>
          )}

          <Divider />

          {/* Order ID QR stub */}
          <Text style={styles.sectionTitle}>Order Reference</Text>
          <View style={styles.qrStub}>
            <Icon name="qr-code-outline" size={48} color={Colors.border} />
            <Text style={styles.qrNote}>QR code requires react-native-qrcode-svg</Text>
            <Text style={styles.orderIdCode}>{order.orderNumber}</Text>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Thank you for supporting Indian farmers! 🌾{'\n'}
            For queries: support@agridirect.app
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 48 },
  letterhead: { padding: 24, alignItems: 'center' },
  lhLogo: { fontSize: 24, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  lhTagline: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  body: { backgroundColor: Colors.surface, margin: 16, borderRadius: borderRadius.xl, padding: 20, ...shadow.md },
  paidStamp: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderWidth: 3,
    borderColor: Colors.success,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: '15deg' }],
    opacity: 0.8,
  },
  paidText: { fontSize: 18, fontWeight: '800', color: Colors.success, letterSpacing: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaLabel: { fontSize: 11, color: Colors.textHint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  addressText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 19, marginBottom: 4 },
  tableHeader: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
  th: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  td: { fontSize: 13, color: Colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalVal: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  txIdText: { fontSize: 11, color: Colors.textHint, maxWidth: 160 },
  grandTotalRow: { paddingVertical: 6 },
  grandLabel: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  grandVal: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  qrStub: { alignItems: 'center', paddingVertical: 16, backgroundColor: Colors.surfaceSecondary, borderRadius: borderRadius.md, marginBottom: 4, gap: 6 },
  qrNote: { fontSize: 11, color: Colors.textHint },
  orderIdCode: { fontSize: 14, fontWeight: '700', color: Colors.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  footer: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 12 },
});

export default InvoiceScreen;
