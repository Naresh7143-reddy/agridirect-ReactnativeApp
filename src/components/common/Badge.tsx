import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, OrderStatusColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

// ─── Status pill badge ────────────────────────────────────────────────────────

type StatusVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'default'
  | 'primary'
  | 'secondary';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  dot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const STATUS_COLORS: Record<StatusVariant, { bg: string; text: string }> = {
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  error: { bg: Colors.errorLight, text: Colors.error },
  info: { bg: Colors.infoLight, text: Colors.info },
  default: { bg: Colors.divider, text: Colors.textSecondary },
  primary: { bg: Colors.successLight, text: Colors.primary },
  secondary: { bg: '#FFF8E1', text: Colors.secondary },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'default',
  dot = false,
  style,
  textStyle,
}) => {
  const { bg, text } = STATUS_COLORS[variant];
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: text }]} />}
      <Text style={[styles.pillText, { color: text }, textStyle]}>{label}</Text>
    </View>
  );
};

// ─── Order status badge ───────────────────────────────────────────────────────

interface OrderStatusBadgeProps {
  status: string;
  style?: ViewStyle;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, style }) => {
  const colorConfig = OrderStatusColors[status] ?? {
    color: Colors.textSecondary,
    bg: Colors.divider,
  };
  const label = status.replace(/_/g, ' ');
  return (
    <View style={[styles.pill, { backgroundColor: colorConfig.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: colorConfig.color }]} />
      <Text style={[styles.pillText, { color: colorConfig.color }]}>{label}</Text>
    </View>
  );
};

// ─── Count badge (notification dot) ──────────────────────────────────────────

interface CountBadgeProps {
  count: number;
  max?: number;
  style?: ViewStyle;
}

export const CountBadge: React.FC<CountBadgeProps> = ({ count, max = 99, style }) => {
  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);
  const isSmall = label.length === 1;

  return (
    <View
      style={[
        styles.countBadge,
        isSmall ? styles.countBadgeSingle : styles.countBadgeMulti,
        style,
      ]}
    >
      <Text style={styles.countText}>{label}</Text>
    </View>
  );
};

// ─── Verified badge (green shield / tick) ─────────────────────────────────────

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 'md', style }) => {
  const dim = size === 'sm' ? 16 : 20;
  const fontSize = size === 'sm' ? 9 : 11;
  return (
    <View
      style={[
        styles.verifiedBadge,
        { width: dim, height: dim, borderRadius: dim / 2 },
        style,
      ]}
    >
      <Text style={[styles.verifiedTick, { fontSize }]}>✓</Text>
    </View>
  );
};

// ─── Generic Badge (backward-compatible) ─────────────────────────────────────

export interface BadgeProps {
  label: string;
  variant?: StatusVariant;
  dot?: boolean;
  count?: number;
  verified?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant, dot, style }) => (
  <StatusBadge label={label} variant={variant} dot={dot} style={style} />
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  countBadge: {
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
  },
  countBadgeSingle: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  countBadgeMulti: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
  },
  countText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  verifiedBadge: {
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTick: {
    color: Colors.white,
    fontWeight: '700',
    lineHeight: 14,
  },
});
