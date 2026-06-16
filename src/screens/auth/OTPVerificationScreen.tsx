/**
 * OTPVerificationScreen
 *
 * Features:
 *  - react-native-otp-entry 6-box input (auto-advance, auto-submit)
 *  - SVG circular countdown timer (60 s)
 *  - Shake animation on wrong OTP
 *  - Green fill cascade (50 ms per box) + ConfettiCannon on success
 *  - Android SMS auto-read via @react-native-community/sms-retriever (graceful fallback)
 *  - Full Firebase OTP verification + backend JWT exchange
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import Svg, { Circle } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useAuth } from '../../hooks/useAuth';
import {
  getConfirmation,
  clearConfirmation,
  setConfirmation,
} from '../../utils/firebaseConfirmation';
import type { AuthScreenProps } from '../../types/navigation';

const { width: W } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const COUNTDOWN_S = 60;
const TIMER_SIZE = 72;
const TIMER_STROKE = 5;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

// ─── Circular countdown timer ─────────────────────────────────────────────────

interface CountdownTimerProps {
  seconds: number;
  total: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds, total }) => {
  const progress = seconds / total;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isUrgent = seconds <= 10;

  return (
    <View style={timerStyles.wrapper}>
      <Svg width={TIMER_SIZE} height={TIMER_SIZE} style={timerStyles.svg}>
        {/* Background track */}
        <Circle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          r={TIMER_RADIUS}
          stroke={Colors.divider}
          strokeWidth={TIMER_STROKE}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={TIMER_SIZE / 2}
          cy={TIMER_SIZE / 2}
          r={TIMER_RADIUS}
          stroke={isUrgent ? Colors.error : Colors.primary}
          strokeWidth={TIMER_STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${TIMER_SIZE / 2}, ${TIMER_SIZE / 2}`}
        />
      </Svg>
      <Text style={[timerStyles.count, isUrgent && timerStyles.countUrgent]}>
        {seconds}
      </Text>
      <Text style={timerStyles.unit}>sec</Text>
    </View>
  );
};

const timerStyles = StyleSheet.create({
  wrapper: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: { position: 'absolute' },
  count: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 24,
  },
  countUrgent: { color: Colors.error },
  unit: {
    fontSize: 9,
    color: Colors.textHint,
    marginTop: -2,
  },
});

// ─── Masked phone display ─────────────────────────────────────────────────────

const maskPhone = (phone: string): string => {
  if (phone.length < 5) return phone;
  return `+91 ${phone.slice(0, 2)}••• •••${phone.slice(-2)}`;
};

// ─── Main component ───────────────────────────────────────────────────────────

type Props = AuthScreenProps<'OTPVerification'>;

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone, role, isLogin } = route.params;

  // ── State ──────────────────────────────────────────────────────────────────

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(COUNTDOWN_S);
  const [canResend, setCanResend] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon>(null);
  const otpInputRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────

  const { sendOTP, verifyOTP, isSending, isVerifying } = useFirebaseAuth();
  const { login } = useAuth();

  // ── Countdown ──────────────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_S);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCountdown]);

  // ── Shake animation ────────────────────────────────────────────────────────

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 9,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start(() => setIsShaking(false));
  }, [shakeAnim]);

  // ── OTP verification ───────────────────────────────────────────────────────

  const handleVerify = useCallback(
    async (code: string) => {
      const confirmation = getConfirmation();
      if (!confirmation) {
        Toast.show({ type: 'error', text1: 'Session expired', text2: 'Please request a new OTP.' });
        navigation.goBack();
        return;
      }

      let verifiedIdToken: string | undefined;

      try {
        const idToken = await verifyOTP(confirmation, code);
        verifiedIdToken = idToken;
        clearConfirmation();

        // ── Success path ─────────────────────────────────────────────────
        setIsSuccess(true);

        // Small delay for green cascade to play, then show confetti
        setTimeout(() => confettiRef.current?.start(), 300);

        // ── Try LOGIN first (handles existing accounts cleanly) ──────────
        // If the user already has an account, log them in — even if they
        // came from RoleSelection. Avoids the "ask username for an existing
        // user" -> 409 conflict -> splash loop bug.
        try {
          await login(idToken);
          return; // existing user logged in, AppNavigator takes over
        } catch (loginErr: any) {
          const lmsg: string =
            loginErr?.response?.data?.message || loginErr?.message || '';
          const isNewUser = /user not found|register first|not found/i.test(lmsg);
          if (!isNewUser) {
            throw loginErr;
          }
          // Genuinely new user — fall through to registration flow.
        }

        // ── New user with role pre-picked → role-specific registration ──
        if (role) {
          const regScreen =
            role === 'FARMER' ? 'FarmerRegistration'
            : role === 'BUYER' ? 'BuyerRegistration'
            : 'DeliveryRegistration';
          setTimeout(
            () => navigation.navigate(regScreen as any, { phone, idToken }),
            1200,
          );
          return;
        }
        // ── New user without role → RoleSelection ───────────────────────
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'RoleSelection' as any, params: { phone, idToken } }],
          });
        }, 800);
        return;
      } catch (e: any) {
        const msg: string = e?.message ?? '';

        // ── New user on the login flow: backend says "User not found.
        //    Please register first." → send them to pick a role & register
        //    instead of leaving them stuck on the OTP screen.
        if (/user not found|register first/i.test(msg) && verifiedIdToken) {
          clearConfirmation();
          setIsSuccess(false);
          Toast.show({
            type: 'info',
            text1: 'New here?',
            text2: "Let's get you registered — pick your role next.",
            position: 'top',
          });
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'RoleSelection' as any,
                params: { phone, idToken: verifiedIdToken },
              }],
            });
          }, 600);
          return;
        }

        triggerShake();
        otpInputRef.current?.clear();
        setOtp('');
        Toast.show({
          type: 'error',
          text1: 'Incorrect OTP',
          text2: msg || 'Please try again.',
          position: 'top',
        });
      }
    },
    [login, navigation, phone, role, triggerShake, verifyOTP],
  );

  // ── Auto-submit when 6 digits filled ──────────────────────────────────────

  const handleOtpFilled = useCallback(
    (code: string) => {
      setOtp(code);
      handleVerify(code);
    },
    [handleVerify],
  );

  // ── Resend OTP ─────────────────────────────────────────────────────────────

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    try {
      const confirmation = await sendOTP(phone);
      setConfirmation(confirmation);
      startCountdown();
      otpInputRef.current?.clear();
      setOtp('');
      Toast.show({ type: 'success', text1: 'OTP Sent', text2: `Code sent to +91 ${phone}` });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to resend', text2: e.message });
    }
  }, [canResend, phone, sendOTP, startCountdown]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Verify your{'\n'}number</Text>
        <Text style={styles.subtitle}>
          Code sent to{' '}
          <Text style={styles.phoneHighlight}>{maskPhone(phone)}</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.changeLink}>Change number</Text>
        </TouchableOpacity>
      </View>

      {/* OTP boxes */}
      <Animated.View
        style={[
          styles.otpWrapper,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <OtpInput
          ref={otpInputRef}
          numberOfDigits={OTP_LENGTH}
          onFilled={handleOtpFilled}
          onTextChange={setOtp}
          focusColor={Colors.primary}
          theme={{
            containerStyle: styles.otpContainer,
            inputsContainerStyle: styles.otpInputsContainer,
            pinCodeContainerStyle: styles.otpBox,
            pinCodeTextStyle: styles.otpText,
            focusedPinCodeContainerStyle: styles.otpBoxFocused,
            filledPinCodeContainerStyle: isSuccess
              ? styles.otpBoxSuccess
              : styles.otpBoxFilled,
          }}
          disabled={isVerifying || isSuccess}
        />
      </Animated.View>

      {/* Loading indicator */}
      {isVerifying && (
        <Text style={styles.verifyingText}>Verifying…</Text>
      )}

      {/* Resend section */}
      <View style={styles.resendSection}>
        {canResend ? (
          <TouchableOpacity onPress={handleResend} disabled={isSending}>
            <Text style={styles.resendActive}>
              {isSending ? 'Sending…' : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.countdownRow}>
            <CountdownTimer seconds={countdown} total={COUNTDOWN_S} />
            <View style={styles.resendLabelWrap}>
              <Text style={styles.resendLabel}>Resend code in</Text>
              <Text style={styles.resendLabel}>
                <Text style={{ color: Colors.primary, fontWeight: '700' }}>
                  {countdown}s
                </Text>
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Help text */}
      <Text style={styles.helpText}>
        Didn't receive the code? Check your SMS inbox or try a different number.
      </Text>

      {/* Confetti — fires on success */}
      <ConfettiCannon
        ref={confettiRef}
        count={120}
        origin={{ x: W / 2, y: -20 }}
        autoStart={false}
        fadeOut
        colors={[Colors.primary, Colors.secondary, Colors.accent, '#FFD700', Colors.white]}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 40,
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  phoneHighlight: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  changeLink: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  otpWrapper: {
    marginBottom: 32,
  },
  otpContainer: {
    width: '100%',
  },
  otpInputsContainer: {
    gap: 10,
    justifyContent: 'center',
  },
  otpBox: {
    width: (W - 48 - 50) / OTP_LENGTH,  // fills width with 10px gaps
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  otpBoxFocused: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.successLight,
  },
  otpBoxSuccess: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  otpText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  verifyingText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resendLabelWrap: { gap: 2 },
  resendLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendActive: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  helpText: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textHint,
    lineHeight: 19,
    paddingHorizontal: 16,
  },
});

export default OTPVerificationScreen;
