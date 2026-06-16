/**
 * OfflineBanner
 *
 * Slides in from the top when the device loses connectivity and slides
 * back out when the connection is restored. Mounts inside the root layout
 * so it appears over every screen.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNetworkState } from '../../hooks/useNetworkState';
import { Colors } from '../../theme/colors';

const BANNER_HEIGHT = 36;

export const OfflineBanner: React.FC = () => {
  const { isConnected } = useNetworkState();
  const slideAnim = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const wasConnected = useRef(true);

  useEffect(() => {
    const goingOffline  = wasConnected.current && !isConnected;
    const comingOnline  = !wasConnected.current && isConnected;
    wasConnected.current = isConnected;

    if (goingOffline) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }).start();
    } else if (comingOnline) {
      Animated.timing(slideAnim, {
        toValue: -BANNER_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isConnected, slideAnim]);

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="none"
    >
      <Icon name="wifi-outline" size={14} color={Colors.white} />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 9999,
  },
  text: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
