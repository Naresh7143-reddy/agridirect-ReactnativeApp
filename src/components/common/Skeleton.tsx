import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Shimmer base color and highlight color
const SHIMMER_BASE = '#EBEBEB';
const SHIMMER_HIGHLIGHT = '#F5F5F5';
const SHIMMER_DURATION = 1200;

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 16,
  borderRadius: br = borderRadius.sm,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: SHIMMER_DURATION,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        {
          width: width as number,
          height,
          borderRadius: br,
          backgroundColor: SHIMMER_BASE,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={[SHIMMER_BASE, SHIMMER_HIGHLIGHT, SHIMMER_HIGHLIGHT, SHIMMER_BASE]}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: SCREEN_WIDTH }}
        />
      </Animated.View>
    </View>
  );
};

// --- Composite skeletons ---

export const ProductCardSkeleton: React.FC = () => (
  <View style={[skeletonStyles.card, { backgroundColor: Colors.surface }]}>
    <Skeleton width="100%" height={160} borderRadius={0} />
    <View style={skeletonStyles.cardBody}>
      <Skeleton width="65%" height={14} />
      <View style={{ height: spacing.xs }} />
      <Skeleton width="40%" height={12} />
      <View style={{ height: spacing.sm }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width={80} height={18} />
        <Skeleton width={36} height={36} borderRadius={18} />
      </View>
    </View>
  </View>
);

export const OrderCardSkeleton: React.FC = () => (
  <View style={[skeletonStyles.card, { padding: spacing.base, backgroundColor: Colors.surface }]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
      <Skeleton width={120} height={13} />
      <Skeleton width={70} height={22} borderRadius={borderRadius.full} />
    </View>
    <Skeleton width="80%" height={12} />
    <View style={{ height: spacing.xs }} />
    <Skeleton width="55%" height={12} />
    <View style={{ height: spacing.md }} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Skeleton width={90} height={20} />
      <Skeleton width={70} height={32} borderRadius={borderRadius.sm} />
    </View>
  </View>
);

export const ProfileHeaderSkeleton: React.FC = () => (
  <View style={{ alignItems: 'center', padding: spacing.xl }}>
    <Skeleton width={80} height={80} borderRadius={40} />
    <View style={{ height: spacing.md }} />
    <Skeleton width={140} height={18} />
    <View style={{ height: spacing.xs }} />
    <Skeleton width={100} height={13} />
  </View>
);

export const ListItemSkeleton: React.FC = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md }}>
    <Skeleton width={48} height={48} borderRadius={borderRadius.sm} />
    <View style={{ flex: 1, gap: spacing.xs }}>
      <Skeleton width="70%" height={14} />
      <Skeleton width="45%" height={12} />
    </View>
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardBody: {
    padding: spacing.md,
  },
});
