export const Colors = {
  // Brand
  primary: '#1B5E20',
  primaryLight: '#2E7D32',
  primaryDark: '#154A18',
  secondary: '#F9A825',
  secondaryLight: '#FBC02D',
  secondaryDark: '#F57F17',
  accent: '#00C853',

  // Backgrounds
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F0',

  // Semantic
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  warning: '#F57C00',
  warningLight: '#FFF3E0',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  info: '#1565C0',
  infoLight: '#E3F2FD',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#616161',
  textHint: '#9E9E9E',
  textDisabled: '#BDBDBD',
  textInverse: '#FFFFFF',

  // UI
  border: '#E0E0E0',
  borderFocus: '#2E7D32',
  divider: '#F5F5F5',
  shadow: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.5)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gradients (as tuples for LinearGradient)
  gradientGreen: ['#1B5E20', '#2E7D32', '#43A047'] as [string, string, string],
  gradientGold: ['#F57F17', '#F9A825', '#FBC02D'] as [string, string, string],
  gradientSurface: ['#FFFFFF', '#FAFAF7'] as [string, string],

  // Order status
  statusPending: '#FF8F00',
  statusPendingBg: '#FFF8E1',
  statusAccepted: '#1565C0',
  statusAcceptedBg: '#E3F2FD',
  statusPacked: '#6A1B9A',
  statusPackedBg: '#F3E5F5',
  statusPickedUp: '#00838F',
  statusPickedUpBg: '#E0F7FA',
  statusDelivered: '#2E7D32',
  statusDeliveredBg: '#E8F5E9',
  statusCancelled: '#C62828',
  statusCancelledBg: '#FFEBEE',

  // Neumorphic
  neumorphicLight: '#FFFFFF',
  neumorphicDark: 'rgba(0,0,0,0.10)',
  neumorphicInsetBg: '#F0F0ED',
} as const;

export type ColorKey = keyof typeof Colors;

// Order status map for easy lookup
export const OrderStatusColors: Record<string, { color: string; bg: string }> = {
  PENDING: { color: Colors.statusPending, bg: Colors.statusPendingBg },
  ACCEPTED: { color: Colors.statusAccepted, bg: Colors.statusAcceptedBg },
  PACKED: { color: Colors.statusPacked, bg: Colors.statusPackedBg },
  PICKED_UP: { color: Colors.statusPickedUp, bg: Colors.statusPickedUpBg },
  DELIVERED: { color: Colors.statusDelivered, bg: Colors.statusDeliveredBg },
  CANCELLED: { color: Colors.statusCancelled, bg: Colors.statusCancelledBg },
};
