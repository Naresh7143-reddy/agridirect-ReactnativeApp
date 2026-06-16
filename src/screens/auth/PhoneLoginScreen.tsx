/**
 * PhoneLoginScreen
 *
 * - Animated phone icon with 3 Reanimated signal-wave rings
 * - Country code pill (+91, India only for now)
 * - Auto-formatted phone input (groups: XXX XX XXXXX)
 * - Send OTP button (disabled < 10 digits, loading spinner)
 * - Shake + red border on validation / Firebase error
 * - Terms & Privacy links at bottom
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
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { setConfirmation } from '../../utils/firebaseConfirmation';
import type { AuthScreenProps } from '../../types/navigation';

const { width: W } = Dimensions.get('window');

// ─── Signal waves (Reanimated) ────────────────────────────────────────────────

const SignalWave: React.FC<{ delay: number; size: number }> = ({ delay, size }) => {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }),
          withTiming(0.4, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 200 }),
          withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Reanimated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: Colors.primary,
        },
        style,
      ]}
    />
  );
};

const PhoneIconWithWaves: React.FC = () => {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <View style={waveStyles.container}>
      <SignalWave delay={0}    size={120} />
      <SignalWave delay={400}  size={90}  />
      <SignalWave delay={800}  size={60}  />
      <Reanimated.View style={[waveStyles.iconCircle, iconStyle]}>
        <Icon name="phone-portrait-outline" size={32} color={Colors.white} />
      </Reanimated.View>
    </View>
  );
};

const waveStyles = StyleSheet.create({
  container: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

// ─── Phone number formatter ───────────────────────────────────────────────────

/** Formats 10-digit number as XXX XXXXX XX for display */
const formatPhoneDisplay = (digits: string): string => {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 5) return d;
  if (d.length <= 7) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
};

const stripFormatting = (formatted: string): string =>
  formatted.replace(/\s/g, '');

// ─── Shake animation ──────────────────────────────────────────────────────────

const useShakeAnim = () => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  return { shakeAnim, shake };
};

// ─── Main component ───────────────────────────────────────────────────────────

type Props = AuthScreenProps<'PhoneLogin'>;

const PhoneLoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const role = route.params?.role;

  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<TextInput>(null);
  const { shakeAnim, shake } = useShakeAnim();
  const { sendOTP, isSending } = useFirebaseAuth();

  const rawDigits = stripFormatting(phoneDisplay);
  const isReady = rawDigits.length === 10;

  // ── Input handling ─────────────────────────────────────────────────────────

  const handleChangeText = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setPhoneDisplay(formatPhoneDisplay(digits));
    setHasError(false);
    setErrorMsg('');
  }, []);

  // ── Send OTP ───────────────────────────────────────────────────────────────

  const handleSendOTP = useCallback(async () => {
    if (!isReady) {
      setHasError(true);
      setErrorMsg('Enter a valid 10-digit mobile number');
      shake();
      return;
    }

    try {
      const confirmation = await sendOTP(rawDigits);
      // Store non-serialisable result globally
      setConfirmation(confirmation);
      navigation.navigate('OTPVerification', {
        phone: rawDigits,
        role,
        isLogin: !role,
      });
    } catch (e: any) {
      setHasError(true);
      setErrorMsg(e.message ?? 'Failed to send OTP');
      shake();
      Toast.show({
        type: 'error',
        text1: 'Could not send OTP',
        text2: e.message,
        position: 'top',
      });
    }
  }, [isReady, rawDigits, role, sendOTP, navigation, shake]);

  // ── Border colour ──────────────────────────────────────────────────────────

  const borderColor = hasError
    ? Colors.error
    : isFocused
    ? Colors.primary
    : Colors.border;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button (when coming from registration) */}
        {!!role && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}

        {/* Animated phone icon + signal waves */}
        <View style={styles.iconWrapper}>
          <PhoneIconWithWaves />
        </View>

        {/* Header text */}
        <Text style={styles.title}>Enter your{'\n'}phone number</Text>
        <Text style={styles.subtitle}>
          We'll send you a 6-digit verification code
        </Text>

        {/* Phone input row */}
        <Animated.View
          style={[
            styles.inputRow,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {/* Country code pill */}
          <TouchableOpacity
            style={[styles.countryPill, { borderColor }]}
            activeOpacity={0.8}
            // For now, India only — no bottom sheet needed
          >
            <Text style={styles.flag}>🇮🇳</Text>
            <Text style={styles.countryCode}>+91</Text>
            <Icon name="chevron-down" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Phone number field */}
          <TouchableOpacity
            style={[
              styles.phoneField,
              { borderColor },
              isFocused && styles.phoneFieldFocused,
            ]}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            {/* Floating label */}
            <Text
              style={[
                styles.floatingLabel,
                (isFocused || rawDigits.length > 0) && styles.floatingLabelActive,
              ]}
            >
              Mobile number
            </Text>
            <TextInput
              ref={inputRef}
              style={[
                styles.phoneInput,
                (isFocused || rawDigits.length > 0) && styles.phoneInputActive,
              ]}
              value={phoneDisplay}
              onChangeText={handleChangeText}
              keyboardType="number-pad"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
              selectionColor={Colors.primary}
              maxLength={13} // 10 digits + 2 spaces
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Error message */}
        {!!errorMsg && (
          <Text style={styles.errorText}>
            <Icon name="alert-circle-outline" size={13} /> {errorMsg}
          </Text>
        )}

        {/* Character counter */}
        <Text style={styles.counter}>
          {rawDigits.length}/10
        </Text>

        {/* Send OTP button */}
        <Button
          onPress={handleSendOTP}
          loading={isSending}
          disabled={!isReady || isSending}
          fullWidth
          size="lg"
          style={styles.ctaBtn}
        >
          Send OTP
        </Button>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing you agree to our{' '}
          <Text
            style={styles.termsLink}
            onPress={() => navigation.navigate('TermsConditions' as any)}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            style={styles.termsLink}
            onPress={() => navigation.navigate('PrivacyPolicy' as any)}
          >
            Privacy Policy
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 0,
  },
  flag: { fontSize: 20 },
  countryCode: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  phoneField: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 10,
    minHeight: 60,
    justifyContent: 'flex-end',
    // Neumorphic inset when not focused
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 0,
  },
  phoneFieldFocused: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: 18,
    fontSize: 15,
    color: Colors.textHint,
  },
  floatingLabelActive: {
    top: 8,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  phoneInput: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
    padding: 0,
    opacity: 0,           // hidden when empty + unfocused (label covers it)
  },
  phoneInputActive: {
    opacity: 1,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: Colors.textHint,
    marginTop: 6,
    marginBottom: 24,
  },
  ctaBtn: {
    marginBottom: 24,
  },
  terms: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default PhoneLoginScreen;
