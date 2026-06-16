/**
 * ReferEarnScreen
 *
 * "Earn ₹50 per referral" screen.
 * - Copy/Share referral code
 * - Progress: referred friends + earned amount
 * - 3 illustrated how-it-works steps
 * - Transaction history (mocked)
 * - "Coming Soon" frosted overlay with "Notify me" button
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Animated,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Clipboard } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';

// ─── Animated count-up ─────────────────────────────────────────────────────────

const AnimatedStat: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({
  value, prefix = '', suffix = '',
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const listener = anim.addListener(({ value: v }) => setDisplayed(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration: 1000, useNativeDriver: false }).start();
    return () => anim.removeListener(listener);
  }, [value]);
  return (
    <Text style={statStyles.value}>{prefix}{displayed}{suffix}</Text>
  );
};

const statStyles = StyleSheet.create({
  value: { fontSize: 28, fontWeight: '800', color: Colors.white },
});

// ─── Step card ────────────────────────────────────────────────────────────────

const StepCard: React.FC<{ num: number; icon: string; title: string; desc: string }> = ({
  num, icon, title, desc,
}) => (
  <View style={stepStyles.card}>
    <View style={stepStyles.numCircle}>
      <Text style={stepStyles.num}>{num}</Text>
    </View>
    <Icon name={icon} size={28} color={Colors.primary} style={{ marginVertical: 8 }} />
    <Text style={stepStyles.title}>{title}</Text>
    <Text style={stepStyles.desc}>{desc}</Text>
  </View>
);

const stepStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    alignItems: 'center',
    ...shadow.sm,
    marginHorizontal: 4,
  },
  numCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  num: { fontSize: 13, fontWeight: '800', color: Colors.white },
  title: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginTop: 4 },
  desc: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 15 },
});

// ─── Main component ───────────────────────────────────────────────────────────

const ReferEarnScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [notifyInterest, setNotifyInterest] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const referralCode = (user?.name ?? 'USER').replace(/\s/g, '').toUpperCase().slice(0, 8) + '2024';

  useEffect(() => {
    // Frosted overlay fades in after a short delay
    setTimeout(() => {
      Animated.timing(overlayAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 600);
  }, []);

  const handleCopy = () => {
    try {
      Clipboard.setString(referralCode);
    } catch { /* Clipboard not linked */ }
    HapticFeedback.trigger('impactMedium');
    Toast.show({ type: 'success', text1: 'Referral code copied!', position: 'top' });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌾 Join AgriDirect — get fresh produce directly from farmers! Use my code ${referralCode} to get ₹50 off your first order.\n\nhttps://agridirect.app/join`,
        title: 'Join AgriDirect',
      });
    } catch { /* share cancelled */ }
  };

  const handleNotify = () => {
    setNotifyInterest(true);
    Toast.show({ type: 'success', text1: "We'll notify you when it launches! 🎉" });
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <LinearGradient colors={Colors.gradientGreen} style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Refer & Earn 🎁</Text>
        <Text style={styles.heroSub}>Earn ₹50 for every friend who places their first order</Text>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <AnimatedStat value={3} suffix=" friends" />
            <Text style={styles.statLabel}>Referred</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <AnimatedStat value={150} prefix="₹" />
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Referral code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Icon name="copy-outline" size={16} color={Colors.white} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Icon name="share-social-outline" size={18} color={Colors.primary} />
            <Text style={styles.shareBtnText}>Share with Friends</Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How it Works</Text>
        <View style={styles.stepsRow}>
          <StepCard num={1} icon="share-outline"    title="Share Code"    desc="Send your code to friends" />
          <StepCard num={2} icon="person-add-outline" title="They Sign Up" desc="Friend registers & orders" />
          <StepCard num={3} icon="cash-outline"     title="You Earn ₹50"  desc="Credit added to wallet" />
        </View>

        {/* History */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Referral History</Text>
        {[
          { name: 'Priya S.', date: 'Jun 1', status: 'Credited', amount: 50 },
          { name: 'Ravi K.', date: 'May 28', status: 'Credited', amount: 50 },
          { name: 'Anita M.', date: 'May 20', status: 'Pending', amount: 50 },
        ].map((item, i) => (
          <View key={i} style={styles.txRow}>
            <View style={styles.txAvatar}>
              <Text style={styles.txAvatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txName}>{item.name}</Text>
              <Text style={styles.txDate}>{item.date}</Text>
            </View>
            <View>
              <Text style={[styles.txAmount, { color: item.status === 'Credited' ? Colors.success : Colors.warning }]}>
                {item.status === 'Credited' ? '+' : ''}₹{item.amount}
              </Text>
              <Text style={[styles.txStatus, { color: item.status === 'Credited' ? Colors.success : Colors.warning }]}>
                {item.status}
              </Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Coming Soon frosted overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} pointerEvents="box-none">
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonEmoji}>🚀</Text>
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          <Text style={styles.comingSoonSub}>
            The referral program is launching soon. Be the first to know!
          </Text>
          {!notifyInterest ? (
            <TouchableOpacity style={styles.notifyBtn} onPress={handleNotify}>
              <Icon name="notifications-outline" size={16} color={Colors.white} />
              <Text style={styles.notifyBtnText}>Notify Me</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.notifyBtn, { backgroundColor: Colors.success }]}>
              <Icon name="checkmark-circle" size={16} color={Colors.white} />
              <Text style={styles.notifyBtnText}>You'll be notified!</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  backBtn: { marginBottom: 16 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: 24 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  scroll: { padding: 20, paddingBottom: 48 },
  codeCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    ...shadow.sm,
  },
  codeLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  codeText: { fontSize: 26, fontWeight: '800', color: Colors.primary, letterSpacing: 2 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: borderRadius.full, paddingHorizontal: 16, paddingVertical: 8 },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: Colors.primary },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  stepsRow: { flexDirection: 'row' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  txAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  txAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  txDate: { fontSize: 12, color: Colors.textSecondary },
  txAmount: { fontSize: 14, fontWeight: '800', textAlign: 'right' },
  txStatus: { fontSize: 10, fontWeight: '600', textAlign: 'right', marginTop: 2 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(250,250,247,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  comingSoonCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.xl,
    padding: 28,
    alignItems: 'center',
    ...shadow.lg,
    width: '100%',
  },
  comingSoonEmoji: { fontSize: 48, marginBottom: 12 },
  comingSoonTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  comingSoonSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  notifyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: borderRadius.full, paddingHorizontal: 24, paddingVertical: 12 },
  notifyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});

export default ReferEarnScreen;
