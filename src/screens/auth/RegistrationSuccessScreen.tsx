/**
 * RegistrationSuccessScreen
 *
 * - Confetti burst (gold + green) fires on mount
 * - Lottie success checkmark (plant-grow.json used as stand-in — swap for a
 *   dedicated success animation when available)
 * - Profile card slides up from below via a spring Animated.Value
 * - Role badge + verification status badge
 * - "Go to Dashboard" — gestureEnabled: false (set in AuthNavigator)
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import type { AuthScreenProps } from '../../types/navigation';

const { width: W } = Dimensions.get('window');

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  string,
  {
    badge: string;
    emoji: string;
    subtitle: string;
    verificationNote: string;
    dashboardLabel: string;
    gradient: [string, string];
  }
> = {
  FARMER: {
    badge: 'Farmer',
    emoji: '🌾',
    subtitle: 'Your account has been created successfully.',
    verificationNote:
      'Our team will review your details and notify you once your account is approved.',
    dashboardLabel: 'Go to Dashboard',
    gradient: [Colors.successLight, Colors.background],
  },
  BUYER: {
    badge: 'Buyer',
    emoji: '🛒',
    subtitle: 'Welcome to AgriDirect! Shop fresh produce directly from farmers.',
    verificationNote: 'Your account is ready — start exploring!',
    dashboardLabel: 'Start Shopping',
    gradient: [Colors.warningLight, Colors.background],
  },
  DELIVERY: {
    badge: 'Delivery Agent',
    emoji: '🚲',
    subtitle: 'You\'re all set! Start accepting deliveries in your area.',
    verificationNote: 'You\'ll receive assignments once our team verifies your details.',
    dashboardLabel: 'Go to Dashboard',
    gradient: [Colors.infoLight, Colors.background],
  },
};

// ─── Badge component ──────────────────────────────────────────────────────────

const RoleBadge: React.FC<{ label: string; emoji: string }> = ({ label, emoji }) => (
  <View style={badgeStyles.wrap}>
    <Text style={badgeStyles.text}>
      {label} {emoji}
    </Text>
  </View>
);

const VerificationBadge: React.FC = () => (
  <View style={badgeStyles.verWrap}>
    <Text style={badgeStyles.verText}>⏳ Pending Verification</Text>
  </View>
);

const badgeStyles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  verWrap: {
    alignSelf: 'center',
    backgroundColor: Colors.warningLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: Colors.warning,
  },
  verText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Props = AuthScreenProps<'RegistrationSuccess'>;

const RegistrationSuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { name, role } = route.params;
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.FARMER;

  // ── Animated values ──────────────────────────────────────────────────────────
  const cardTranslateY = useRef(new Animated.Value(120)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const lottieOpacity = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon>(null);
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    // 1. Fire confetti immediately
    setTimeout(() => confettiRef.current?.start(), 100);

    // 2. Fade in Lottie
    Animated.timing(lottieOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => lottieRef.current?.play());

    // 3. Card slides up with spring
    Animated.parallel([
      Animated.spring(cardTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDashboard = () => {
    // AppNavigator is already watching isAuthenticated in Redux.
    // register() called setCredentials which set isAuthenticated=true,
    // so AppNavigator will switch to RoleNavigator automatically.
    // We just need a tiny delay for the state to propagate.
    setTimeout(() => {}, 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Lottie checkmark */}
      <Animated.View style={[styles.lottieWrap, { opacity: lottieOpacity }]}>
        <LottieView
          ref={lottieRef}
          source={require('../../assets/lottie/plant-grow.json')}
          style={styles.lottie}
          autoPlay
          loop={false}
          speed={0.9}
        />
      </Animated.View>

      {/* Heading */}
      <Text style={styles.heading}>
        Welcome, {name}! 🎉
      </Text>
      <Text style={styles.subtitle}>{config.subtitle}</Text>

      {/* Profile card */}
      <Animated.View
        style={[
          styles.card,
          shadow.lg,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }],
          },
        ]}
      >
        {/* Avatar initials */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.trim().charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.cardName}>{name}</Text>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <RoleBadge label={config.badge} emoji={config.emoji} />
        </View>
        {(role === 'FARMER' || role === 'DELIVERY') && (
          <View style={styles.badgeRow}>
            <VerificationBadge />
          </View>
        )}

        {/* Note */}
        <Text style={styles.note}>{config.verificationNote}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Info row */}
        <View style={styles.infoRow}>
          <Icon name="checkmark-circle" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>Account created successfully</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="shield-checkmark-outline" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>Firebase-verified phone number</Text>
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View
        style={[
          styles.ctaWrap,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }],
          },
        ]}
      >
        <Button onPress={handleDashboard} fullWidth size="lg">
          {config.dashboardLabel}
        </Button>
      </Animated.View>

      {/* Confetti — fires on mount */}
      <ConfettiCannon
        ref={confettiRef}
        count={160}
        origin={{ x: W / 2, y: -10 }}
        autoStart={false}
        fadeOut
        explosionSpeed={350}
        fallSpeed={3000}
        colors={[
          Colors.secondary,   // gold
          Colors.accent,      // green
          '#FFD700',
          Colors.primary,
          Colors.white,
          Colors.secondaryLight,
        ]}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 36,
  },
  lottieWrap: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: Colors.successLight,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  badgeRow: {
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ctaWrap: {
    width: '100%',
  },
});

export default RegistrationSuccessScreen;
