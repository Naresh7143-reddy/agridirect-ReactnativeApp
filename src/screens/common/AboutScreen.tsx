// FILE: src/screens/common/AboutScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';

// ─── Counter ──────────────────────────────────────────────────────────────────

interface CounterProps {
  targetValue: number;
  label: string;
  suffix?: string;
  delay?: number;
}

const Counter: React.FC<CounterProps> = ({ targetValue, label, suffix = '', delay = 0 }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const displayRef = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(animValue, {
        toValue: targetValue,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [animValue, targetValue, delay]);

  const animatedText = animValue.interpolate({
    inputRange: [0, targetValue],
    outputRange: ['0', String(targetValue)],
  });

  return (
    <View style={styles.counterItem}>
      <Animated.Text style={styles.counterValue}>
        {/* Animated.Text doesn't directly support interpolation for numbers cleanly,
            so we use a listener approach */}
        <AnimatedNumber value={animValue} suffix={suffix} />
      </Animated.Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
};

// Separate component to render animated numeric values
interface AnimatedNumberProps {
  value: Animated.Value;
  suffix: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, suffix }) => {
  const [display, setDisplay] = React.useState(0);
  useEffect(() => {
    const id = value.addListener(({ value: v }) => setDisplay(Math.floor(v)));
    return () => value.removeListener(id);
  }, [value]);
  return <>{`${display}${suffix}`}</>;
};

// ─── TeamMember ───────────────────────────────────────────────────────────────

interface TeamMemberProps {
  initials: string;
  name: string;
  role: string;
  color: string;
}

const TeamMember: React.FC<TeamMemberProps> = ({ initials, name, role, color }) => (
  <View style={styles.memberCard}>
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
    <Text style={styles.memberName}>{name}</Text>
    <Text style={styles.memberRole}>{role}</Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const APP_VERSION = 'v1.0.0';

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();

  const heroScale = useRef(new Animated.Value(0.8)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [heroScale, heroOpacity]);

  return (
    <View style={styles.container}>
      {/* Back button overlay */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={Colors.gradientGreen} style={styles.hero}>
          <Animated.View style={{ transform: [{ scale: heroScale }], opacity: heroOpacity, alignItems: 'center' }}>
            <Text style={styles.heroEmoji}>🌾</Text>
            <Text style={styles.heroTitle}>AgriDirect</Text>
            <View style={styles.versionPill}>
              <Text style={styles.versionText}>{APP_VERSION}</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Mission */}
          <View style={[styles.missionCard, shadow.md]}>
            <Icon name="leaf" size={20} color={Colors.primary} />
            <Text style={styles.missionText}>
              {'"Connecting farmers directly to tables, eliminating middlemen, ensuring fair prices for all."'}
            </Text>
          </View>

          {/* Impact counters */}
          <Text style={styles.sectionTitle}>Our Impact</Text>
          <View style={[styles.countersCard, shadow.sm]}>
            <Counter targetValue={500} label="Farmers" suffix="+" delay={0} />
            <View style={styles.counterDivider} />
            <Counter targetValue={10000} label="Buyers" suffix="+" delay={200} />
            <View style={styles.counterDivider} />
            <Counter targetValue={25000} label="Orders" suffix="+" delay={400} />
            <View style={styles.counterDivider} />
            <Counter targetValue={20} label="Cities" suffix="+" delay={600} />
          </View>

          {/* Founder */}
          <Text style={styles.sectionTitle}>Founder</Text>
          <View style={[styles.founderCard, shadow.sm]}>
            <View style={[styles.avatar, { backgroundColor: '#1B5E20', width: 72, height: 72, borderRadius: 36 }]}>
              <Text style={[styles.avatarText, { fontSize: 22 }]}>GN</Text>
            </View>
            <Text style={styles.founderName}>Godi Naresh Reddy</Text>
            <Text style={styles.founderRole}>Founder & CEO</Text>
            <Text style={styles.founderBio}>
              Built AgriDirect to give Indian farmers direct access to buyers — cutting middlemen,
              keeping more profit in farmers' hands, and bringing fresh produce to every kitchen.
            </Text>
          </View>

          {/* Social */}
          <Text style={styles.sectionTitle}>Connect</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#24292E' }]}
              onPress={() => Linking.openURL('https://github.com/Naresh7143-reddy')}
            >
              <Icon name="logo-github" size={22} color={Colors.white} />
              <Text style={styles.socialText}>GitHub</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#0077B5' }]}
              onPress={() => Linking.openURL('https://linkedin.com/in/godi-naresh-reddy')}
            >
              <Icon name="logo-linkedin" size={22} color={Colors.white} />
              <Text style={styles.socialText}>LinkedIn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#EA4335' }]}
              onPress={() => Linking.openURL('mailto:nareshreddy.godi@gmail.com')}
            >
              <Icon name="mail" size={22} color={Colors.white} />
              <Text style={styles.socialText}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Built with ❤️ for Indian Farmers</Text>
          <Text style={styles.footerVersion}>AgriDirect {APP_VERSION} · © 2026 Godi Naresh Reddy</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  hero: {
    paddingTop: 80,
    paddingBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 64, marginBottom: 8 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  versionPill: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  versionText: { fontSize: 13, color: Colors.white, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 48 },
  missionCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    gap: 10,
  },
  missionText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  countersCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    padding: 20,
    marginBottom: 28,
    justifyContent: 'space-around',
  },
  counterItem: { alignItems: 'center' },
  counterValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  counterLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  counterDivider: { width: 1, backgroundColor: Colors.border },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  founderCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
    marginBottom: 28,
    alignItems: 'center',
  },
  founderName: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 12 },
  founderRole: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginTop: 4 },
  founderBio: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  memberCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    marginHorizontal: 4,
    ...shadow.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.white },
  memberName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  memberRole: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  socialText: { fontSize: 12, fontWeight: '600', color: Colors.white },
  footer: { fontSize: 15, textAlign: 'center', color: Colors.textPrimary, fontWeight: '600' },
  footerVersion: { fontSize: 12, textAlign: 'center', color: Colors.textHint, marginTop: 4 },
});

export default AboutScreen;
