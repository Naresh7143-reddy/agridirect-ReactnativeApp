import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order, OrderStatus } from '../../types/order';
import { Badge } from '../common/Badge';
import { Colors, OrderStatusColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { formatPrice, formatDate, truncateText } from '../../utils/format';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
}

const statusVariantMap: Record<OrderStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  [OrderStatus.PENDING]: 'warning',
  [OrderStatus.ACCEPTED]: 'info',
  [OrderStatus.PACKED]: 'info',
  [OrderStatus.PICKED_UP]: 'info',
  [OrderStatus.IN_TRANSIT]: 'info',
  [OrderStatus.DELIVERED]: 'success',
  [OrderStatus.CANCELLED]: 'error',
  [OrderStatus.REFUNDED]: 'default',
};

const statusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.ACCEPTED]: 'Accepted',
  [OrderStatus.PACKED]: 'Packed',
  [OrderStatus.PICKED_UP]: 'Picked Up',
  [OrderStatus.IN_TRANSIT]: 'In Transit',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.REFUNDED]: 'Refunded',
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const itemSummary = order.items
    .slice(0, 2)
    .map((i) => `${i.productName} x${i.quantity}`)
    .join(', ');
  const extraItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  return (
    <TouchableOpacity
      onPress={() => onPress(order)}
      activeOpacity={0.85}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
        <Badge
          label={statusLabel[order.status]}
          variant={statusVariantMap[order.status]}
          dot
        />
      </View>

      <Text style={styles.items} numberOfLines={2}>
        {truncateText(itemSummary + extraItems, 60)}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(order.createdAt, 'medium')}</Text>
        <Text style={styles.total}>{formatPrice(order.grandTotal)}</Text>
      </View>

      {order.estimatedDelivery && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
        <View style={styles.etaBadge}>
          <Text style={styles.etaText}>
            Est. delivery: {formatDate(order.estimatedDelivery, 'short')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderId: {
    ...typography.label.medium,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  items: {
    ...typography.body.small,
    color: Colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    ...typography.caption,
    color: Colors.textHint,
  },
  total: {
    ...typography.label.medium,
    color: Colors.primary,
    fontWeight: '700',
  },
  etaBadge: {
    marginTop: spacing.xs,
    backgroundColor: Colors.infoLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  etaText: {
    ...typography.caption,
    color: Colors.info,
  },
});
