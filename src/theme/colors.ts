export const Colors = {
  // Brand - Rich Emerald & Organic Greens
  primary: '#1B5E20',
  primaryLight: '#2E7D32',
  primaryDark: '#0D3B10',
  primaryMuted: '#E8F5E9',
  secondary: '#F57F17',
  secondaryLight: '#FBC02D',
  secondaryDark: '#E65100',
  accent: '#00C853',
  accentLight: '#B9F6CA',

  // Backgrounds
  background: '#F6F8F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#EFF3EA',
  surfaceElevated: '#FFFFFF',

  // Semantic
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  warning: '#EF6C00',
  warningLight: '#FFF3E0',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  info: '#0277BD',
  infoLight: '#E1F5FE',

  // Text
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textHint: '#9CA3AF',
  textDisabled: '#D1D5DB',
  textInverse: '#FFFFFF',

  // UI & Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#2E7D32',
  divider: '#F3F4F6',
  shadow: 'rgba(17, 24, 39, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.16)',
  overlay: 'rgba(15, 23, 42, 0.55)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gradients (tuples for LinearGradient)
  gradientGreen: ['#154A18', '#1B5E20', '#2E7D32'] as [string, string, string],
  gradientGold: ['#E65100', '#F57F17', '#FBC02D'] as [string, string, string],
  gradientSurface: ['#FFFFFF', '#F6F8F5'] as [string, string],
  gradientHero: ['#0D3B10', '#1B5E20', '#388E3C'] as [string, string, string],
  gradientAccent: ['#00C853', '#69F0AE'] as [string, string],

  // Order status
  statusPending: '#EF6C00',
  statusPendingBg: '#FFF3E0',
  statusAccepted: '#0277BD',
  statusAcceptedBg: '#E1F5FE',
  statusPacked: '#7B1FA2',
  statusPackedBg: '#F3E5F5',
  statusPickedUp: '#00838F',
  statusPickedUpBg: '#E0F7FA',
  statusDelivered: '#2E7D32',
  statusDeliveredBg: '#E8F5E9',
  statusCancelled: '#C62828',
  statusCancelledBg: '#FFEBEE',

  // Neumorphic / Elevation
  neumorphicLight: '#FFFFFF',
  neumorphicDark: 'rgba(0, 0, 0, 0.06)',
  neumorphicInsetBg: '#EEF2EC',
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

