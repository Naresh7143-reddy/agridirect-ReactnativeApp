/**
 * SettingsScreen
 *
 * Generic settings hub used by the Admin navigator (drawer item "Settings").
 * Lists app-level settings (notifications, language, theme) and account
 * actions (change password, logout).
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius, spacing } from '../../theme/spacing';
import { useAuth } from '../../hooks/useAuth';

const APP_VERSION = '1.0.0';

interface RowProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  rightText?: string;
}

const Row: React.FC<RowProps> = ({ icon, label, onPress, danger, rightText }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconBox, danger && styles.iconBoxDanger]}>
      <Icon name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
    </View>
    <Text style={[styles.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
    {rightText && <Text style={styles.rightText}>{rightText}</Text>}
    {!danger && <Icon name="chevron-forward" size={18} color={Colors.textHint} />}
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout, user } = useAuth();

  const go = (screen: string) => navigation.navigate(screen);

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You can log back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Settings</Text>
        {user?.name ? <Text style={styles.subheading}>Signed in as {user.name}</Text> : null}

        {/* App */}
        <Text style={styles.section}>App</Text>
        <View style={styles.card}>
          <Row icon="notifications-outline" label="Notification Settings" onPress={() => go('NotificationSettings')} />
          <Row icon="language-outline"      label="Language"               onPress={() => go('LanguageSettings')} rightText="English" />
        </View>

        {/* Account */}
        <Text style={styles.section}>Account</Text>
        <View style={styles.card}>
          <Row icon="person-outline"  label="Edit Profile"   onPress={() => go('EditProfile')} />
          <Row icon="lock-closed-outline" label="Privacy Policy" onPress={() => go('PrivacyPolicy')} />
          <Row icon="document-text-outline" label="Terms & Conditions" onPress={() => go('TermsConditions')} />
          <Row icon="help-circle-outline" label="Help & Support" onPress={() => go('HelpSupport')} />
          <Row icon="information-circle-outline" label="About AgriDirect" onPress={() => go('About')} />
        </View>

        {/* Session */}
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Row icon="log-out-outline" label="Log Out" onPress={confirmLogout} danger />
        </View>

        <Text style={styles.version}>AgriDirect v{APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  heading: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginTop: spacing.md },
  subheading: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  section: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: spacing.md, marginBottom: 6, letterSpacing: 0.4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconBoxDanger: { backgroundColor: '#FDECEC' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rightText: { fontSize: 13, color: Colors.textHint, marginRight: 6 },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textHint, marginTop: spacing.lg },
});

export default SettingsScreen;
