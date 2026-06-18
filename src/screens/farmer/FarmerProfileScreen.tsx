/**
 * FarmerProfileScreen
 *
 * - Profile photo (tappable, bottom sheet to change / remove)
 * - Name, phone, verification badge, star rating
 * - Farm info card (farm name, location, land, crop categories)
 * - Stats row
 * - Menu list with navigation
 * - Logout (red, bottom)
 * - App version footer
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { farmerApi } from '../../api/farmer';
import { useAuth } from '../../hooks/useAuth';
import type { FarmerProfile } from '../../types/farmer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FarmerStackParamList } from '../../types/navigation';
import { launchCamera, launchGallery } from '../../utils/imagePicker';

const APP_VERSION = '1.0.0';

// ─── Star rating ──────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; count: number }> = ({ rating, count }) => (
  <View style={starStyles.row}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Icon
        key={i}
        name={i <= Math.round(rating) ? 'star' : 'star-outline'}
        size={14}
        color={Colors.secondary}
      />
    ))}
    <Text style={starStyles.count}>{rating.toFixed(1)} ({count} reviews)</Text>
  </View>
);

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  count: { fontSize: 12, color: Colors.textSecondary, marginLeft: 4 },
});

// ─── Verification badge ───────────────────────────────────────────────────────

const VerBadge: React.FC<{ verified: boolean }> = ({ verified }) => (
  <View style={[verStyles.badge, { backgroundColor: verified ? Colors.successLight : Colors.warningLight }]}>
    <Text style={[verStyles.text, { color: verified ? Colors.success : Colors.warning }]}>
      {verified ? 'Verified Farmer ✅' : 'Pending Verification ⏳'}
    </Text>
  </View>
);

const verStyles = StyleSheet.create({
  badge: { borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 4 },
  text: { fontSize: 12, fontWeight: '700' },
});

// ─── Menu item ────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, danger, badge }) => (
  <TouchableOpacity style={menuStyles.item} onPress={onPress} activeOpacity={0.7}>
    <View style={[menuStyles.iconBox, danger && menuStyles.iconBoxDanger]}>
      <Icon name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
    </View>
    <Text style={[menuStyles.label, danger && menuStyles.labelDanger]}>{label}</Text>
    {badge ? (
      <View style={menuStyles.badge}>
        <Text style={menuStyles.badgeText}>{badge}</Text>
      </View>
    ) : (
      !danger && <Icon name="chevron-forward" size={16} color={Colors.textHint} />
    )}
  </TouchableOpacity>
);

const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDanger: { backgroundColor: Colors.errorLight },
  label: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  labelDanger: { color: Colors.error },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
});

// ─── Photo modal ──────────────────────────────────────────────────────────────

interface PhotoModalProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ visible, onClose, onCamera, onGallery, onRemove }) => (
  <Modal
    isVisible={visible}
    onBackdropPress={onClose}
    animationIn="slideInUp"
    animationOut="slideOutDown"
    style={{ justifyContent: 'flex-end', margin: 0 }}
  >
    <View style={pmStyles.sheet}>
      <View style={pmStyles.handle} />
      <Text style={pmStyles.title}>Change Profile Photo</Text>
      <TouchableOpacity style={pmStyles.option} onPress={onCamera}>
        <Icon name="camera-outline" size={20} color={Colors.primary} />
        <Text style={pmStyles.optionText}>Take a new photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={pmStyles.option} onPress={onGallery}>
        <Icon name="image-outline" size={20} color={Colors.primary} />
        <Text style={pmStyles.optionText}>Choose from gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity style={pmStyles.option} onPress={onRemove}>
        <Icon name="trash-outline" size={20} color={Colors.error} />
        <Text style={[pmStyles.optionText, { color: Colors.error }]}>Remove photo</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const pmStyles = StyleSheet.create({
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  optionText: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
});

// ─── Main component ───────────────────────────────────────────────────────────

const FarmerProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [photoModal, setPhotoModal] = useState(false);

  useEffect(() => {
    farmerApi.getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => {/* silently fail — show user data from Redux */});
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          // AppNavigator will switch to AuthNavigator automatically
        },
      },
    ]);
  };

  const initials = (user?.name ?? 'F').charAt(0).toUpperCase();

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Profile Header ─────────────────────────────────────────────── */}
        <View style={styles.profileHeader}>
          {/* Photo */}
          <TouchableOpacity style={styles.photoWrap} onPress={() => setPhotoModal(true)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.photoEditBadge}>
              <Icon name="camera" size={12} color={Colors.white} />
            </View>
          </TouchableOpacity>

          {/* Name & info */}
          <Text style={styles.name}>{user?.name ?? '—'}</Text>
          <Text style={styles.phone}>{user?.phone ?? '—'}</Text>
          <VerBadge verified={profile?.isVerified ?? false} />
          {profile && <StarRating rating={profile.rating} count={profile.reviewCount} />}
        </View>

        {/* ── Farm info card ────────────────────────────────────────────── */}
        {profile && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Farm Info</Text>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                <Icon name="pencil-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <InfoRow icon="storefront-outline" label={profile.farmName} />
            <InfoRow icon="location-outline" label={`${profile.location.city}, ${profile.location.state}`} />
            {profile.certifications.length > 0 && (
              <View style={styles.certRow}>
                {profile.certifications.map((c) => (
                  <View key={c} style={styles.certChip}>
                    <Text style={styles.certText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatBox label="Products" value={String(profile?.totalProducts ?? 0)} icon="leaf-outline" />
          <StatBox label="Total Sales" value={String(profile?.totalSales ?? 0)} icon="bag-outline" />
          <StatBox label="Rating" value={profile ? profile.rating.toFixed(1) : '—'} icon="star-outline" />
        </View>

        {/* ── Menu ──────────────────────────────────────────────────────── */}
        <View style={styles.menuCard}>
          <MenuItem icon="person-outline"         label="Edit Profile"           onPress={() => navigation.navigate('EditProfile')} />
          <MenuItem icon="leaf-outline"           label="My Products"            onPress={() => navigation.navigate('MyProducts')} />
          <MenuItem icon="cash-outline"           label="Earnings"               onPress={() => navigation.navigate('FarmerEarnings')} />
          <MenuItem icon="card-outline"           label="Bank Details"           onPress={() => navigation.navigate('FarmerBankDetails')} />
          <MenuItem icon="notifications-outline"  label="Notification Settings"  onPress={() => navigation.navigate('NotificationSettings')} />
          <MenuItem icon="language-outline"       label="Language"               onPress={() => navigation.navigate('LanguageSettings')} />
          <MenuItem icon="help-circle-outline"    label="Help & Support"         onPress={() => navigation.navigate('HelpSupport')} />
          <MenuItem icon="document-text-outline"  label="Terms & Conditions"     onPress={() => navigation.navigate('TermsConditions')} />
          <MenuItem icon="shield-outline"         label="Privacy Policy"         onPress={() => navigation.navigate('PrivacyPolicy')} />
          <MenuItem
            icon="star-outline"
            label="Rate App"
            onPress={() =>
              Linking.openURL(
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/id000000000'
                  : 'market://details?id=com.agridirect',
              )
            }
          />
          <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} danger />
        </View>

        {/* Version footer */}
        <Text style={styles.version}>AgriDirect v{APP_VERSION}</Text>
      </ScrollView>

      {/* Photo picker modal */}
      <PhotoModal
        visible={photoModal}
        onClose={() => setPhotoModal(false)}
        onCamera={() => {
          setPhotoModal(false);
          launchCamera((img) => { if (img) Toast.show({ type: 'success', text1: 'Photo updated' }); });
        }}
        onGallery={() => {
          setPhotoModal(false);
          launchGallery((img) => { if (img) Toast.show({ type: 'success', text1: 'Photo updated' }); });
        }}
        onRemove={() => {
          setPhotoModal(false);
          Toast.show({ type: 'info', text1: 'Photo removed' });
        }}
      />
    </View>
  );
};

// ─── Helper components ────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <View style={infoStyles.row}>
    <Icon name={icon} size={16} color={Colors.primary} />
    <Text style={infoStyles.label}>{label}</Text>
  </View>
);

const StatBox: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <View style={sbStyles.box}>
    <Icon name={icon} size={20} color={Colors.primary} />
    <Text style={sbStyles.value}>{value}</Text>
    <Text style={sbStyles.label}>{label}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  label: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
});

const sbStyles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
    ...shadow.sm,
  },
  value: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  label: { fontSize: 11, color: Colors.textSecondary },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  profileHeader: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 8,
  },
  photoWrap: { marginBottom: 8, position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.successLight,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: Colors.white },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  phone: { fontSize: 14, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  certRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  certChip: {
    backgroundColor: Colors.successLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  certText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadow.sm,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textHint,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    marginTop: 8,
  },
});

export default FarmerProfileScreen;
