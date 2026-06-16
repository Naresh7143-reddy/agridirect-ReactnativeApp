/**
 * AuthChoiceScreen
 *
 * The very first "fork in the road" for anyone without a session:
 *   "New here? Create an account"  vs  "Already have an account? Log in"
 *
 * Asking this up front avoids the confusing loop where a user tries to
 * log in, gets told "account not found, let's register", and then lands
 * back on a phone-entry screen that looks identical to the login screen.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import type { AuthScreenProps } from '../../types/navigation';

type Props = AuthScreenProps<'AuthChoice'>;

const AuthChoiceScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Icon name="leaf" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Welcome to AgriDirect</Text>
        <Text style={styles.subtitle}>
          Fresh produce, straight from farm to your door.{'\n'}
          Let's get you started — are you new here?
        </Text>
      </View>

      <View style={styles.actions}>
        {/* New user → pick a role, then verify phone, then fill registration */}
        <TouchableOpacity
          style={[styles.card, styles.cardPrimary]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('RoleSelection', undefined)}
        >
          <View style={[styles.iconBadge, styles.iconBadgePrimary]}>
            <Icon name="person-add" size={22} color={Colors.white} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitlePrimary}>I'm new here</Text>
            <Text style={styles.cardSubtitlePrimary}>
              Create an account as a Farmer, Buyer, or Delivery Partner
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        {/* Existing user → straight to phone login, no role assumption */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PhoneLogin', undefined)}
        >
          <View style={styles.iconBadge}>
            <Icon name="log-in" size={22} color={Colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>I already have an account</Text>
            <Text style={styles.cardSubtitle}>
              Log in with your registered mobile number
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textHint} />
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>
        You'll verify your number with a one-time OTP either way — it only
        takes a few seconds.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...shadow.sm,
  },
  cardPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconBadgePrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.heading.h4,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardTitlePrimary: {
    ...typography.heading.h4,
    color: Colors.white,
  },
  cardSubtitlePrimary: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  footerNote: {
    ...typography.caption,
    color: Colors.textHint,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});

export default AuthChoiceScreen;
