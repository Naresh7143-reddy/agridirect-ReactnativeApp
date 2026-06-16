/**
 * OfflineScreen
 *
 * Full-screen offline error state:
 * - Large wifi-off illustration
 * - "No Internet Connection" title
 * - Auto-retry countdown (10s) with circular Animated progress
 * - Manual "Retry" button
 * - Uses useNetworkState to auto-dismiss when back online
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Circle } from 'react-native-svg';
import { useNetworkState } from '../../hooks/useNetworkState';
import { Colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

const COUNTDOWN_S = 10;
const RING_SIZE   = 80;
const RING_R      = (RING_SIZE - 8) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

// ─── Wifi animation (3 pulsing arcs) ─────────────────────────────────────────

const WifiIcon: React.FC = () => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.wifiWrap, { opacity: pulse }]}>
      <Icon name="wifi-outline" size={80} color={Colors.textHint} />
      <View style={styles.wifiSlash}>
        <Icon name="close" size={24} color={Colors.error} />
      </View>
    </Animated.View>
  );
};

// ─── Countdown ring ───────────────────────────────────────────────────────────

const CountdownRing: React.FC<{ seconds: number; total: number }> = ({ seconds, total }) => {
  const progress = seconds / total;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isUrgent = seconds <= 3;

  return (
    <View style={ringStyles.wrap}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute' }}>
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          stroke={Colors.divider} strokeWidth={6} fill="none"
        />
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          stroke={isUrgent ? Colors.error : Colors.primary}
          strokeWidth={6} fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <Text style={[ringStyles.count, isUrgent && { color: Colors.error }]}>{seconds}</Text>
      <Text style={ringStyles.label}>sec</Text>
    </View>
  );
};

const ringStyles = StyleSheet.create({
  wrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 20, fontWeight: '800', color: Colors.primary, lineHeight: 22 },
  label: { fontSize: 9, color: Colors.textHint },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

interface Props {
  onRetry?: () => void;
}

const OfflineScreen: React.FC<Props> = ({ onRetry }) => {
  const [countdown, setCountdown] = useState(COUNTDOWN_S);
  const [isRetrying, setIsRetrying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isConnected, retry } = useNetworkState();

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_S);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleRetry();
          return COUNTDOWN_S;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCountdown]);

  // Auto-dismiss when connection restored
  useEffect(() => {
    if (isConnected) {
      if (timerRef.current) clearInterval(timerRef.current);
      onRetry?.();
    }
  }, [isConnected]);

  const handleRetry = async () => {
    setIsRetrying(true);
    retry();
    setTimeout(() => { setIsRetrying(false); startCountdown(); }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <WifiIcon />

      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.subtitle}>
        Please check your Wi-Fi or mobile data connection and try again.
      </Text>

      <View style={styles.retryRow}>
        <CountdownRing seconds={countdown} total={COUNTDOWN_S} />
        <View style={styles.retryLabel}>
          <Text style={styles.retryLabelText}>Auto-retry in</Text>
          <Text style={styles.retryLabelTime}>{countdown}s</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.retryBtn, isRetrying && styles.retryBtnLoading]}
        onPress={handleRetry}
        disabled={isRetrying}
        activeOpacity={0.85}
      >
        <Icon name={isRetrying ? 'sync' : 'refresh'} size={18} color={Colors.white} />
        <Text style={styles.retryBtnText}>{isRetrying ? 'Checking…' : 'Retry Now'}</Text>
      </TouchableOpacity>

      <View style={styles.offlineNote}>
        <Icon name="information-circle-outline" size={16} color={Colors.primary} />
        <Text style={styles.offlineNoteText}>
          Offline mode: you can browse recently viewed products.
        </Text>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
  },
  wifiWrap: { position: 'relative', marginBottom: 24 },
  wifiSlash: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 36,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  retryLabel: { gap: 2 },
  retryLabelText: { fontSize: 12, color: Colors.textSecondary },
  retryLabelTime: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 28,
  },
  retryBtnLoading: { opacity: 0.7 },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  offlineNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  offlineNoteText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});

export default OfflineScreen;
