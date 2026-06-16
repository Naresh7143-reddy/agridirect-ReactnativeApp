/**
 * ProfileScreen
 *
 * Shared profile screen used by Buyer and Delivery role tabs (Farmer has its
 * own dedicated FarmerProfileScreen with farm-specific info).
 *
 * Shows:
 *  - Avatar (initials fallback), name, phone, role badge, verification status
 *  - Edit Profile shortcut
 *  - Menu: Edit Profile, Saved Addresses (buyer only), Notifications,
 *    Help & Support, Terms & Conditions, About
 *  - Logout (red, bottom) with confirmation
 *  - App version footer
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
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

// ─── Avatar ───────────────────────────────────────────────────────────────────

const initialsOf = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
};

const Avatar: React.FC<{ name?: string }> = ({ name }) => (
  <View style={avatarStyles.circle}>
    <Text style={avatarStyles.text}>{initialsOf(name)}</Text>
  </View>
);

const avatarStyles = StyleSheet.create({
  circle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  text: { fontSize: 30, fontWeight: '800', color: Colors.white },
});

// ─── Role / verification badges ───────────────────────────────────────────────

const ROLE_LABELS: Record<string, { label: string; emoji: string }> = {
  BUYER: { label: 'Buyer', emoji: '🛒' },
  FARMER: { label: 'Farmer', emoji: '🌾' },
  DELIVERY: { label: 'Delivery Partner', emoji: '🚲' },
  ADMIN: { label: 'Admin', emoji: '🛡️' },
};

const RoleBadge: React.FC<{ role?: string | null }> = ({ role }) => {
  const cfg = (role && ROLE_LABELS[role]) || { label: role ?? 'User', emoji: '👤' };
  return (
    <View style={badgeStyles.wrap}>
      <Text style={badgeStyles.text}>{cfg.label} {cfg.emoji}</Text>
    </View>
  );
};

const VerificationBadge: React.FC<{ verified?: boolean }> = ({ verified }) => (
  <View
    style={[
      badgeStyles.verWrap,
      { backgroundColor: verified ? Colors.successLight : Colors.warningLight },
    ]}
  >
    <Text style={[badgeStyles.verText, { color: verified ? Colors.success : Colors.warning }]}>
      {verified ? 'Verified ✅' : 'Pending Verification ⏳'}
    </Text>
  </View>
);

const badgeStyles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 6,
  },
  text: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  verWrap: {
    alignSelf: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  verText: { fontSize: 12, fontWeight: '700' },
});

// ─── Menu item ────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, danger }) => (
  <TouchableOpacity style={menuStyles.item} onPress={onPress} activeOpacity={0.7}>
    <View style={[menuStyles.iconBox, danger && menuStyles.iconBoxDanger]}>
      <Icon name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
    </View>
    <Text style={[menuStyles.label, danger && menuStyles.labelDanger]}>{label}</Text>
    {!danger && <Icon name="chevron-forward" size={18} color={Colors.textHint} />}
  </TouchableOpacity>
);

const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconBoxDanger: { backgroundColor: '#FDECEC' },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  labelDanger: { color: Colors.error },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, role, logout } = useAuth();

  const go = useCallback((screen: string) => navigation.navigate(screen), [navigation]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log out?', 'You can log back in anytime with your phone number.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }, [logout]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <View style={styles.headerCard}>
        <Avatar name={user?.name} />
        <Text style={styles.name}>{user?.name || 'AgriDirect User'}</Text>
        <Text style={styles.phone}>{user?.phone || ''}</Text>
        <RoleBadge role={role ?? user?.role} />
        <VerificationBadge verified={user?.isVerified} />

        <TouchableOpacity style={styles.editBtn} onPress={() => go('EditProfile')} activeOpacity={0.85}>
          <Icon name="create-outline" size={16} color={Colors.primary} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ── Menu ─────────────────────────────────────────────────────────── */}
      <View style={styles.menuCard}>
        <MenuItem icon="person-outline" label="Edit Profile" onPress={() => go('EditProfile')} />
        {role === 'BUYER' && (
          <MenuItem icon="location-outline" label="Saved Addresses" onPress={() => go('SavedAddresses')} />
        )}
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => go('Notifications')} />
        <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => go('HelpSupport')} />
        <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => go('TermsConditions')} />
        <MenuItem icon="information-circle-outline" label="About AgriDirect" onPress={() => go('About')} />
      </View>

      <View style={styles.menuCard}>
        <MenuItem icon="log-out-outline" label="Log Out" onPress={handleLogout} danger />
      </View>

      <Text style={styles.version}>AgriDirect v{APP_VERSION}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: spacing.xl },
  headerCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  name: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  phone: { fontSize: 14, color: Colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: spacing.sm,
  },
  editBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  menuCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  version: {
    textAlign: 'center',
    color: Colors.textHint,
    fontSize: 12,
    marginTop: spacing.lg,
  },
});

export default ProfileScreen;
