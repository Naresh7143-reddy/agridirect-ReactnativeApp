/**
 * OrderDetailBottomSheet
 * 
 * Modal bottom sheet that slides up to show order details
 * Prevents navigation crashes and provides smooth UX
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import { Colors, OrderStatusColors } from '../theme/colors';
import { borderRadius, shadow, spacing } from '../theme/spacing';
import { ordersApi } from '../api/orders';
import { formatPrice } from '../utils/format';
import type { Order, OrderStatus } from '../types/order';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrderDetailBottomSheetProps {
  visible: boolean;
  orderId: string | null;
  initialOrder?: Order | null;
  onClose: () => void;
  onTrackPress?: (orderId: string) => void;
  onRatePress?: (orderId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  ACCEPTED: 'Accepted',
  PACKED: 'Packed & Ready',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  ON_THE_WAY: 'On The Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const OrderDetailBottomSheet: React.FC<OrderDetailBottomSheetProps> = ({
  visible,
  orderId,
  initialOrder,
  onClose,
  onTrackPress,
  onRatePress,
}) => {
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);

  useEffect(() => {
    if (visible && orderId) {
      if (initialOrder) {
        // Use initial order data immediately
        setOrder(initialOrder);
        setLoading(false);
      } else {
        // Load from API if no initial data
        loadOrder();
      }
    }
  }, [visible, orderId, initialOrder]);

  const loadOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const res: any = await ordersApi.getOrderById(orderId);
      const fetched = res?.data ?? res;
      if (fetched) {
        setOrder(fetched);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors = OrderStatusColors[status as OrderStatus];
    return statusColors || { color: Colors.textSecondary, bg: Colors.divider };
  };

  if (!visible) return null;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      style={styles.modal}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={250}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={250}
      useNativeDriverForBackdrop
      propagateSwipe
    >
      <View style={styles.sheetContainer}>
        {/* Drag Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        ) : !order ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={64} color={Colors.error} />
            <Text style={styles.errorText}>Order not found</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadOrder}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Order Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.orderNumber}>
                    #{order.orderNumber || `Order ${(order.id || '').slice(-6)}`}
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(
                      // Handle various date formats
                      typeof order.createdAt === 'number' 
                        ? order.createdAt 
                        : !isNaN(Number(order.createdAt))
                          ? Number(order.createdAt)
                          : order.createdAt
                    ).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status).bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(order.status).color },
                    ]}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryBottom}>
                <Text style={styles.itemCount}>
                  {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.totalAmount}>
                  ₹{((order as any).grandTotal || order.totalAmount || 0).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Delivery OTP (if not delivered/cancelled) */}
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (order.deliveryOtp || order.otp) && (
              <View style={styles.otpCard}>
                <View style={styles.otpHeader}>
                  <Icon name="shield-checkmark" size={20} color={Colors.primary} />
                  <Text style={styles.otpTitle}>Delivery OTP</Text>
                </View>
                <Text style={styles.otpSubtitle}>
                  Share this code with delivery agent
                </Text>
                <View style={styles.otpCodeBox}>
                  <Text style={styles.otpCode}>
                    {order.deliveryOtp || order.otp}
                  </Text>
                </View>
              </View>
            )}

            {/* Items List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              {(order.items && Array.isArray(order.items) ? order.items : []).map((item, idx) => {
                if (!item) return null;
                const itemKey = item.id || (item as any).productId || `item-${idx}`;
                const unitPrice = Number((item as any).priceAtOrder || item.pricePerUnit || (item as any).unitPrice || (item as any).price || (item as any).price_at_order || 0);
                const itemTotal = Number(item.total || (item as any).totalPrice || (item as any).subtotal || (unitPrice * (item.quantity || 1))) || 0;

                return (
                  <View key={itemKey} style={styles.itemRow}>
                    {item.productImage ? (
                      <FastImage
                        source={{ uri: item.productImage }}
                        style={styles.itemImage}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    ) : (
                      <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                        <Icon name="leaf" size={20} color={Colors.primary} />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.productName || 'Product'}
                      </Text>
                      <Text style={styles.itemDetails}>
                        {item.quantity || 0} {item.unit || 'unit'} × {formatPrice(unitPrice)}
                      </Text>
                      {item.farmerName && (
                        <Text style={styles.itemFarmer}>by {item.farmerName}</Text>
                      )}
                    </View>
                    <Text style={styles.itemTotal}>{formatPrice(itemTotal)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Price Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Details</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(order.totalAmount || 0)}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Fee</Text>
                <Text style={styles.priceValue}>
                  {formatPrice((order as any).deliveryFee || 0)}
                </Text>
              </View>
              {((order as any).discount || 0) > 0 && (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, styles.discountText]}>Discount</Text>
                  <Text style={[styles.priceValue, styles.discountText]}>
                    -{formatPrice((order as any).discount || 0)}
                  </Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatPrice((order as any).grandTotal || order.totalAmount || 0)}
                </Text>
              </View>
            </View>

            {/* Delivery Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              {typeof order.deliveryAddress === 'string' ? (
                <Text style={styles.addressText}>{order.deliveryAddress}</Text>
              ) : (
                <>
                  <Text style={styles.addressText}>
                    {order.deliveryAddress?.line1 || ''}
                  </Text>
                  {order.deliveryAddress?.line2 && (
                    <Text style={styles.addressText}>
                      {order.deliveryAddress.line2}
                    </Text>
                  )}
                  <Text style={styles.addressText}>
                    {[
                      order.deliveryAddress?.city,
                      order.deliveryAddress?.state,
                      order.deliveryAddress?.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(order.status) && onTrackPress && (
                <TouchableOpacity
                  style={styles.trackButton}
                  onPress={() => {
                    onClose();
                    onTrackPress(order.id);
                  }}
                >
                  <Icon name="navigate" size={18} color={Colors.white} />
                  <Text style={styles.trackButtonText}>Track Order</Text>
                </TouchableOpacity>
              )}

              {order.status === 'DELIVERED' && onRatePress && (
                <TouchableOpacity
                  style={styles.rateButton}
                  onPress={() => {
                    onClose();
                    onRatePress(order.id);
                  }}
                >
                  <Icon name="star" size={18} color={Colors.white} />
                  <Text style={styles.rateButtonText}>Rate & Review</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  otpCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  otpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  otpSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  otpCodeBox: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  otpCode: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 6,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.surface,
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemFarmer: {
    fontSize: 11,
    color: Colors.textHint,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  discountText: {
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    marginHorizontal: 16,
    gap: 12,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.warning,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default OrderDetailBottomSheet;
