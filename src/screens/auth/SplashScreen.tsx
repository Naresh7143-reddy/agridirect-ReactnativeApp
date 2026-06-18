/**
 * SplashScreen
 *
 * Flow:
 *  1. Logo scales in + tagline fades in
 *  2. Lottie plant-grow plays underneath
 *  3. 8 golden particles float upward in parallel
 *  4. After 2.5 s → check token + onboarding flag → route
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';

import { Colors } from '../../theme/colors';
import {
  getAuthToken,
  isOnboardingDone,
  getUserData,
} from '../../utils/storage';
import type { AuthScreenProps } from '../../types/navigation';
import type { UserRole } from '../../types/auth';

const { width: W, height: H } = Dimensions.get('window');

// ─── Particle config ──────────────────────────────────────────────────────────

interface ParticleConfig {
  x: number;     // horizontal start position
  size: number;  // diameter
  delay: number; // ms before animation starts
  duration: number;
}

const PARTICLES: ParticleConfig[] = [
  { x: W * 0.12, size: 8,  delay: 0,    duration: 2200 },
  { x: W * 0.25, size: 5,  delay: 300,  duration: 2600 },
  { x: W * 0.38, size: 10,            delay: 150,  duration: 2000 },
  { x: W * 0.52, size: 6,  delay: 500,  duration: 2400 },
  { x: W * 0.65, size: 9,  delay: 80,   duration: 1900 },
  { x: W * 0.75, size: 5,  delay: 420,  duration: 2700 },
  { x: W * 0.85, size: 7,  delay: 260,  duration: 2100 },
  { x: W * 0.93, size: 4,  delay: 600,  duration: 2500 },
];

// ─── Single particle ──────────────────────────────────────────────────────────

const Particle: React.FC<ParticleConfig> = ({ x, size, delay, duration }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -(H * 0.55),
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.9, duration: 300, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: duration - 300, useNativeDriver: true }),
          ]),
          Animated.timing(scale, { toValue: 1.4, duration, useNativeDriver: true }),
        ]),
        // reset instantly
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        particleStyles.dot,
        {
          left: x,
          width: size,
          height: size,
          borderRadius: size / 2,
          bottom: H * 0.12,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    />
  );
};

const particleStyles = StyleSheet.create({
  dot: {
    position: 'absolute',
    backgroundColor: Colors.secondary,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

type Props = AuthScreenProps<'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  // Logo animations
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(12)).current;
  const lottieRef = useRef<LottieView>(null);

  // ── Navigation decision ────────────────────────────────────────────────────

  const decideRoute = useCallback(() => {
    const token = getAuthToken();
    const onboardingDone = isOnboardingDone();

    if (token) {
      // Token exists — AppNavigator already has isAuthenticated=true from
      // redux-persist rehydration and will mount the correct RoleNavigator.
      // Do NOT navigate here; navigating to PhoneLogin causes a splash loop
      // when login completes and AuthNavigator remounts starting at Splash.
      return;
    } else if (onboardingDone) {
      navigation.replace('AuthChoice');
    } else {
      navigation.replace('Onboarding');
    }
  }, [navigation]);

  // ── Entry animations ───────────────────────────────────────────────────────

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    lottieRef.current?.play();

    // Logo scales in (spring)
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();

    // Logo fades in
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Tagline fades in + slides up after 700 ms
    const taglineTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(taglineY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 700);

    // Route decision after 2.5 s
    const navTimer = setTimeout(decideRoute, 2500);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(navTimer);
      StatusBar.setBarStyle('dark-content');
    };
  }, [decideRoute, logoOpacity, logoScale, taglineOpacity, taglineY]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Lottie plant grow (bottom half) ─────────────────────────────── */}
      <LottieView
        ref={lottieRef}
        source={require('../../assets/lottie/plant-grow.json')}
        style={styles.lottie}
        autoPlay
        loop={false}
        resizeMode="cover"
        speed={0.9}
      />

      {/* ── Golden particles ─────────────────────────────────────────────── */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* ── Logo + wordmark ──────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        {/* Leaf icon circle */}
        <View style={styles.iconCircle}>
          <Text style={styles.leafEmoji}>🌿</Text>
        </View>

        <Text style={styles.appName}>AgriDirect</Text>
      </Animated.View>

      {/* ── Tagline ───────────────────────────────────────────────────────── */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          },
        ]}
      >
        Farm Fresh. Delivered Direct.
      </Animated.Text>

      {/* ── Version footer ────────────────────────────────────────────────── */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    position: 'absolute',
    bottom: 0,
    width: W,
    height: H * 0.45,
    opacity: 0.35,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  leafEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.8,
    fontStyle: 'italic',
    marginTop: 4,
  },
  version: {
    position: 'absolute',
    bottom: 32,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});

export default SplashScreen;
