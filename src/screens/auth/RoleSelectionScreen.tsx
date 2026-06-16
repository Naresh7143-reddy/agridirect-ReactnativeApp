/**
 * RoleSelectionScreen
 *
 * User picks FARMER / BUYER / DELIVERY before entering their phone number.
 * Each card is animated:
 *   Selected   → scale 1.05 + green border + checkmark badge (spring)
 *   Unselected → scale 1.0 + no border
 * CTA button transitions ghost → filled green once a role is chosen.
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import type { AuthScreenProps } from '../../types/navigation';

const { width: W } = Dimensions.get('window');

// ─── Role configuration ───────────────────────────────────────────────────────

type RoleKey = 'FARMER' | 'BUYER' | 'DELIVERY';

interface RoleConfig {
  key: RoleKey;
  title: string;
  description: string;
  lottie: any;
  gradient: [string, string];
  icon: string;
}

const ROLES: RoleConfig[] = [
  {
    key: 'FARMER',
    title: 'I am a Farmer',
    description: 'List your produce and sell directly to buyers — no middlemen.',
    lottie: require('../../assets/lottie/farmer.json'),
    gradient: ['#E8F5E9', '#C8E6C9'],
    icon: 'leaf',
  },
  {
    key: 'BUYER',
    title: 'I am a Buyer',
    description: 'Shop fresh produce harvested today, delivered to your door.',
    lottie: require('../../assets/lottie/buyer.json'),
    gradient: ['#FFF8E1', '#FFE082'],
    icon: 'cart',
  },
  {
    key: 'DELIVERY',
    title: 'I am a Delivery Agent',
    description: 'Pick up orders and earn per delivery on your own schedule.',
    lottie: require('../../assets/lottie/delivery.json'),
    gradient: ['#E3F2FD', '#90CAF9'],
    icon: 'bicycle',
  },
];

// ─── Animated role card ───────────────────────────────────────────────────────

interface RoleCardProps {
  config: RoleConfig;
  isSelected: boolean;
  onPress: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ config, isSelected, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeRotate = useRef(new Animated.Value(-45)).current;

  useEffect(() => {
    if (isSelected) {
      // Scale up + show border
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.05,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      // Checkmark badge springs in from top-right
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(badgeRotate, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Scale back + hide border + hide badge
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.spring(badgeScale, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 2.5],
  });

  const badgeRotateDeg = badgeRotate.interpolate({
    inputRange: [-45, 0],
    outputRange: ['-45deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        cardStyles.wrapper,
        { transform: [{ scale }] },
      ]}
    >
      <Animated.View
        style={[
          cardStyles.card,
          { borderColor, borderWidth },
          isSelected && shadow.md,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.9}
          style={cardStyles.touch}
        >
          {/* Gradient background strip */}
          <LinearGradient
            colors={config.gradient}
            style={cardStyles.lottieContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LottieView
              source={config.lottie}
              style={cardStyles.lottie}
              autoPlay
              loop
              speed={0.8}
            />
          </LinearGradient>

          {/* Text section */}
          <View style={cardStyles.textSection}>
            <Text style={cardStyles.title}>{config.title}</Text>
            <Text style={cardStyles.description}>{config.description}</Text>
          </View>

          {/* Arrow */}
          <Icon
            name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
            size={24}
            color={isSelected ? Colors.primary : Colors.textHint}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Checkmark badge — top right corner */}
      <Animated.View
        style={[
          cardStyles.badge,
          {
            transform: [
              { scale: badgeScale },
              { rotate: badgeRotateDeg },
            ],
          },
        ]}
      >
        <View style={cardStyles.badgeInner}>
          <Icon name="checkmark" size={14} color={Colors.white} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    position: 'relative',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
  },
  touch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  lottieContainer: {
    width: 70,
    height: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lottie: {
    width: 60,
    height: 60,
  },
  textSection: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  badgeInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});

// ─── Animated CTA button ──────────────────────────────────────────────────────

interface CTAButtonProps {
  enabled: boolean;
  onPress: () => void;
  label?: string;
}

const CTAButton: React.FC<CTAButtonProps> = ({ enabled, onPress, label }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: enabled ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [enabled]);

  const backgroundColor = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surface, Colors.primary],
  });
  const textColor = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.white],
  });
  const borderColor = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  const handlePressIn = () => {
    if (!enabled) return;
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!enabled}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            ctaStyles.btn,
            { backgroundColor, borderColor },
          ]}
        >
          <Animated.Text style={[ctaStyles.text, { color: textColor }]}>
            {label ?? 'Continue'}
          </Animated.Text>
          <Icon
            name="arrow-forward"
            size={18}
            color={enabled ? Colors.white : Colors.border}
          />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ctaStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

// ─── Wave emoji animation ─────────────────────────────────────────────────────

const WaveEmoji: React.FC = () => {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -0.5, duration: 300, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0.8, duration: 350, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 300, useNativeDriver: true }),
        // pause
        Animated.delay(2000),
      ]),
    ).start();
  }, []);

  const rotateDeg = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  return (
    <Animated.Text
      style={{ fontSize: 28, transform: [{ rotate: rotateDeg }] }}
    >
      👋
    </Animated.Text>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

type Props = AuthScreenProps<'RoleSelection'>;

const RoleSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);

  // If we arrived here with an already-verified phone + Firebase idToken
  // (e.g. user tried to log in but isn't registered yet), skip straight to
  // the role-specific registration screen — no need to re-enter the phone
  // number or redo OTP, which felt like a confusing "back to login" loop.
  const verifiedPhone = route.params?.phone;
  const verifiedIdToken = route.params?.idToken;
  const isCompletingRegistration = Boolean(verifiedPhone && verifiedIdToken);

  const handleSelect = useCallback((role: RoleKey) => {
    setSelectedRole((prev) => (prev === role ? null : role));
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedRole) return;

    if (isCompletingRegistration && verifiedPhone && verifiedIdToken) {
      const regScreen =
        selectedRole === 'FARMER' ? 'FarmerRegistration'
        : selectedRole === 'BUYER' ? 'BuyerRegistration'
        : 'DeliveryRegistration';
      navigation.navigate(regScreen as any, {
        phone: verifiedPhone,
        idToken: verifiedIdToken,
      });
      return;
    }

    navigation.navigate('PhoneLogin', { role: selectedRole });
  }, [navigation, selectedRole, isCompletingRegistration, verifiedPhone, verifiedIdToken]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {isCompletingRegistration ? 'Almost there' : 'I am a'}
          </Text>
          <WaveEmoji />
        </View>
        <Text style={styles.subtitle}>
          {isCompletingRegistration
            ? "We didn't find an account for this number — pick your role to finish creating one. No need to re-enter your phone or OTP."
            : 'Choose your role to personalise your experience'}
        </Text>
      </View>

      {/* Role cards */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ROLES.map((role) => (
          <RoleCard
            key={role.key}
            config={role}
            isSelected={selectedRole === role.key}
            onPress={() => handleSelect(role.key)}
          />
        ))}
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <CTAButton
          enabled={selectedRole !== null}
          onPress={handleContinue}
          label={isCompletingRegistration ? 'Continue registration' : undefined}
        />
        {!isCompletingRegistration && (
          <Text style={styles.loginHint}>
            Already have an account?{' '}
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate('PhoneLogin', undefined)}
            >
              Sign in
            </Text>
          </Text>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    gap: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  loginHint: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default RoleSelectionScreen;
