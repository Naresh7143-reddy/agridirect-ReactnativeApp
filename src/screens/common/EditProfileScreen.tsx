// FILE: src/screens/common/EditProfileScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';
import { useAuth } from '../../hooks/useAuth';
import { farmerApi } from '../../api/farmer';
import { buyerApi } from '../../api/buyer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  language: string;
}

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'];

// ─── Screen ───────────────────────────────────────────────────────────────────

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, role } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const uploadProgress = useRef(new Animated.Value(0)).current;

  // Track whether we just successfully saved — used to bypass the "Discard
  // Changes?" prompt because react-hook-form's isDirty stays true until reset.
  const justSavedRef = useRef(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      language: 'English',
    },
  });

  const selectedLang = watch('language');

  // Intercept back navigation if there are unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || justSavedRef.current) return;
      e.preventDefault();
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  const handlePhotoPress = useCallback(() => {
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => {
          setUploading(true);
          Animated.timing(uploadProgress, { toValue: 1, duration: 2000, useNativeDriver: false }).start(() => {
            setUploading(false);
            uploadProgress.setValue(0);
            Toast.show({ type: 'success', text1: 'Photo updated!' });
          });
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: () => {
          setUploading(true);
          Animated.timing(uploadProgress, { toValue: 1, duration: 2000, useNativeDriver: false }).start(() => {
            setUploading(false);
            uploadProgress.setValue(0);
            Toast.show({ type: 'success', text1: 'Photo updated!' });
          });
        },
      },
      { text: 'Remove Photo', style: 'destructive', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [uploadProgress]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      setSaving(true);
      try {
        if (role === 'FARMER') {
          await farmerApi.updateProfile({ farmName: data.name });
        } else {
          await buyerApi.updateProfile({ name: data.name, email: data.email || undefined });
        }
        Toast.show({ type: 'success', text1: 'Profile updated successfully!' });
        // Mark form as no longer dirty + flag so the beforeRemove listener
        // skips the "Discard Changes?" prompt on this programmatic back-nav.
        reset(data);
        justSavedRef.current = true;
        navigation.goBack();
      } catch {
        Toast.show({ type: 'error', text1: 'Failed to update profile', text2: 'Please try again.' });
      } finally {
        setSaving(false);
      }
    },
    [role, navigation],
  );

  const progressStroke = uploadProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const initials = (user?.name ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePhotoPress} activeOpacity={0.8}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.cameraBtn}>
                <Icon name="camera" size={14} color={Colors.white} />
              </View>
            </View>
            {uploading && (
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressStroke }]} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.tapToChange}>Tap to change photo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <Controller
              control={control}
              name="name"
              rules={{
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.textHint}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email (optional)</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  placeholder="Enter email address"
                  placeholderTextColor={Colors.textHint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Phone (locked) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.input, styles.lockedInput]}>
              <Text style={styles.lockedText}>{user?.phone ?? '+91 XXXXX XXXXX'}</Text>
              <View style={styles.verifiedRow}>
                <Icon name="lock-closed" size={14} color={Colors.textHint} />
                <Text style={styles.verifiedText}> ✓ Verified</Text>
              </View>
            </View>
          </View>

          {/* Language */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Preferred Language</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowLangPicker(!showLangPicker)}
              activeOpacity={0.8}
            >
              <View style={styles.langRow}>
                <Text style={styles.langSelected}>{selectedLang}</Text>
                <Icon name={showLangPicker ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textHint} />
              </View>
            </TouchableOpacity>
            {showLangPicker && (
              <View style={[styles.langDropdown, shadow.md]}>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.langOption, selectedLang === lang && styles.langOptionActive]}
                    onPress={() => {
                      setValue('language', lang, { shouldDirty: true });
                      setShowLangPicker(false);
                    }}
                  >
                    <Text style={[styles.langOptionText, selectedLang === lang && styles.langOptionTextActive]}>
                      {lang}
                    </Text>
                    {selectedLang === lang && (
                      <Icon name="checkmark" size={16} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (!isDirty || saving) && styles.saveBtnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={!isDirty || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 16, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarOuter: { position: 'relative' },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.white },
  cameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 8,
    width: 100,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  tapToChange: { fontSize: 13, color: Colors.textHint, marginTop: 8 },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
  lockedInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSecondary,
  },
  lockedText: { fontSize: 15, color: Colors.textPrimary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center' },
  verifiedText: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  errorText: { fontSize: 12, color: Colors.error },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langSelected: { fontSize: 15, color: Colors.textPrimary },
  langDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: 4,
  },
  langOption: { paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langOptionActive: { backgroundColor: Colors.successLight },
  langOptionText: { fontSize: 15, color: Colors.textPrimary },
  langOptionTextActive: { color: Colors.primary, fontWeight: '600' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: Colors.border },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

export default EditProfileScreen;
