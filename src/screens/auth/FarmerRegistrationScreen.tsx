/**
 * FarmerRegistrationScreen
 *
 * 3-step multi-form:
 *   Step 1 — Personal Details (photo, name, email, language)
 *   Step 2 — Farm Details (farm name, location, land area, crop categories)
 *   Step 3 — Documents (Aadhaar upload, bank details) — skippable
 *
 * Animations:
 *   - Progress stepper: connecting lines animate green on completion
 *   - Step transition: slide left/right with Reanimated
 *   - Checkmark badge springs onto completed steps
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
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Image,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Dimensions,
  PermissionsAndroid,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import type { AuthScreenProps } from '../../types/navigation';
import { UserRole } from '../../types/auth';
import { launchCamera, launchGallery } from '../../utils/imagePicker';

const { width: W } = Dimensions.get('window');
const STEP_COUNT = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

type CropCategory =
  | 'Vegetables'
  | 'Fruits'
  | 'Grains'
  | 'Dairy'
  | 'Herbs'
  | 'Pulses';

const CROP_CATEGORIES: CropCategory[] = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Herbs',
  'Pulses',
];

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi'];

// ─── Progress Stepper ─────────────────────────────────────────────────────────

interface StepperProps {
  currentStep: number; // 0-indexed
}

const ProgressStepper: React.FC<StepperProps> = ({ currentStep }) => {
  // One animated value per connecting line
  const lineAnims = useRef(
    Array.from({ length: STEP_COUNT - 1 }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    lineAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: currentStep > i ? 1 : 0,
        duration: 350,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStep]);

  const labels = ['Personal', 'Farm', 'Documents'];

  return (
    <View style={stepperStyles.row}>
      {Array.from({ length: STEP_COUNT }).map((_, i) => {
        const isDone = currentStep > i;
        const isActive = currentStep === i;

        return (
          <React.Fragment key={i}>
            {/* Circle */}
            <View style={stepperStyles.circleWrap}>
              <View
                style={[
                  stepperStyles.circle,
                  isDone && stepperStyles.circleDone,
                  isActive && stepperStyles.circleActive,
                ]}
              >
                {isDone ? (
                  <Icon name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <Text
                    style={[
                      stepperStyles.circleText,
                      isActive && stepperStyles.circleTextActive,
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  stepperStyles.label,
                  (isDone || isActive) && stepperStyles.labelActive,
                ]}
              >
                {labels[i]}
              </Text>
            </View>

            {/* Connecting line */}
            {i < STEP_COUNT - 1 && (
              <View style={stepperStyles.lineTrack}>
                <Animated.View
                  style={[
                    stepperStyles.lineFill,
                    {
                      width: lineAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const stepperStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  circleWrap: {
    alignItems: 'center',
    width: 56,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginBottom: 6,
  },
  circleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  circleDone: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  circleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textHint,
  },
  circleTextActive: {
    color: Colors.white,
  },
  label: {
    fontSize: 11,
    color: Colors.textHint,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  lineTrack: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginTop: 16,
    borderRadius: 1,
    overflow: 'hidden',
  },
  lineFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
});

// ─── Photo picker placeholder ─────────────────────────────────────────────────

interface PhotoPickerProps {
  uri: string | null;
  onPress: () => void;
}

const PhotoPicker: React.FC<PhotoPickerProps> = ({ uri, onPress }) => (
  <TouchableOpacity style={photoStyles.wrap} onPress={onPress} activeOpacity={0.8}>
    {uri ? (
      <>
        <Image source={{ uri }} style={photoStyles.image} />
        <View style={photoStyles.editOverlay}>
          <Icon name="camera" size={16} color={Colors.white} />
        </View>
      </>
    ) : (
      <View style={photoStyles.placeholder}>
        <Icon name="camera-outline" size={28} color={Colors.primary} />
        <Text style={photoStyles.placeholderText}>Add Photo</Text>
      </View>
    )}
  </TouchableOpacity>
);

const photoStyles = StyleSheet.create({
  wrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  placeholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    gap: 4,
  },
  placeholderText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});

// ─── Crop category chip ───────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled: boolean;
}

const CropChip: React.FC<ChipProps> = ({ label, selected, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled && !selected}
    activeOpacity={0.8}
    style={[
      chipStyles.chip,
      selected && chipStyles.chipSelected,
      disabled && !selected && chipStyles.chipDisabled,
    ]}
  >
    <Text style={[chipStyles.text, selected && chipStyles.textSelected]}>
      {label}
    </Text>
    {selected && (
      <Icon name="checkmark-circle" size={14} color={Colors.white} style={{ marginLeft: 4 }} />
    )}
  </TouchableOpacity>
);

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 8,
    marginBottom: 10,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  textSelected: {
    color: Colors.white,
  },
});

// ─── Reusable labeled input ───────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'number-pad';
  optional?: boolean;
  multiline?: boolean;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  optional,
  multiline,
  rightIcon,
  secureTextEntry,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>
        {label}
        {optional && <Text style={fieldStyles.optional}> (optional)</Text>}
      </Text>
      <View
        style={[
          fieldStyles.inputRow,
          focused && fieldStyles.inputRowFocused,
        ]}
      >
        <TextInput
          style={[fieldStyles.input, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? ''}
          placeholderTextColor={Colors.textHint}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          selectionColor={Colors.primary}
        />
        {rightIcon}
      </View>
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  optional: {
    fontWeight: '400',
    color: Colors.textHint,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    ...shadow.sm,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
});

// ─── Language picker (simple inline list) ────────────────────────────────────

interface LangPickerProps {
  value: string;
  onChange: (lang: string) => void;
}

const LanguagePicker: React.FC<LangPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={langStyles.wrap}>
      <Text style={fieldStyles.label}>Language preference</Text>
      <TouchableOpacity
        style={[fieldStyles.inputRow, { paddingVertical: 14 }]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <Text style={{ flex: 1, fontSize: 15, color: value ? Colors.textPrimary : Colors.textHint }}>
          {value || 'Select language'}
        </Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <View style={langStyles.dropdown}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[langStyles.option, lang === value && langStyles.optionSelected]}
              onPress={() => { onChange(lang); setOpen(false); }}
            >
              <Text style={[langStyles.optionText, lang === value && { color: Colors.primary, fontWeight: '700' }]}>
                {lang}
              </Text>
              {lang === value && <Icon name="checkmark" size={16} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const langStyles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    ...shadow.md,
    zIndex: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  optionSelected: { backgroundColor: Colors.successLight },
  optionText: { fontSize: 15, color: Colors.textPrimary },
});

// ─── Upload box (Aadhaar / document) ─────────────────────────────────────────

interface UploadBoxProps {
  label: string;
  subtitle?: string;
  uri: string | null;
  onPress: () => void;
}

const UploadBox: React.FC<UploadBoxProps> = ({ label, subtitle, uri, onPress }) => (
  <TouchableOpacity style={uploadStyles.box} onPress={onPress} activeOpacity={0.8}>
    {uri ? (
      <View style={uploadStyles.doneRow}>
        <Icon name="document-text" size={24} color={Colors.primary} />
        <Text style={uploadStyles.doneText} numberOfLines={1}>
          Document uploaded ✓
        </Text>
      </View>
    ) : (
      <>
        <Icon name="cloud-upload-outline" size={32} color={Colors.primary} />
        <Text style={uploadStyles.label}>{label}</Text>
        {subtitle && <Text style={uploadStyles.subtitle}>{subtitle}</Text>}
      </>
    )}
  </TouchableOpacity>
);

const uploadStyles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: Colors.successLight,
    marginBottom: 18,
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneText: { fontSize: 14, fontWeight: '600', color: Colors.primary, flex: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Props = AuthScreenProps<'FarmerRegistration'>;

const FarmerRegistrationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone, idToken } = route.params;
  const { register, login } = useAuth();

  // ── Step state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('');

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [landArea, setLandArea] = useState('');
  const [crops, setCrops] = useState<CropCategory[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);

  // ── Step 3 ─────────────────────────────────────────────────────────────────
  const [aadhaarUri, setAadhaarUri] = useState<string | null>(null);
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // ── Slide animation ────────────────────────────────────────────────────────
  const translateX = useSharedValue(0);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animateStep = useCallback(
    (nextStep: number, direction: 'forward' | 'back') => {
      const sign = direction === 'forward' ? 1 : -1;
      translateX.value = sign * W;
      translateX.value = withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
      setStep(nextStep);
    },
    [translateX],
  );

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep1 = (): string | null => {
    if (!name.trim()) return 'Please enter your full name';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email';
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!farmName.trim()) return 'Please enter your farm name';
    if (!location.trim()) return 'Please select your farm location';
    if (crops.length === 0) return 'Select at least one crop category';
    return null;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePhotoPress = () => {
    Alert.alert('Profile Photo', 'Choose a source', [
      { text: 'Camera',  onPress: () => launchCamera((img)  => { if (img) setPhotoUri(img.uri); }) },
      { text: 'Gallery', onPress: () => launchGallery((img) => { if (img) setPhotoUri(img.uri); }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDocumentPress = (setter: (uri: string) => void) => {
    Alert.alert('Upload Document', 'Choose a source', [
      { text: 'Camera',  onPress: () => launchCamera((img)  => { if (img) setter(img.uri); }) },
      { text: 'Gallery', onPress: () => launchGallery((img) => { if (img) setter(img.uri); }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleGPS = async () => {
    // Android 6+ requires runtime permission before GPS calls will work —
    // without this, getCurrentPosition fails silently / never resolves.
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'AgriDirect needs your location to set your farm address.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Toast.show({
            type: 'error',
            text1: 'Permission denied',
            text2: 'Enable location access in settings to use GPS.',
          });
          return;
        }
      } catch {
        Toast.show({ type: 'error', text1: 'Permission request failed' });
        return;
      }
    }

    setGpsLoading(true);
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        Toast.show({ type: 'error', text1: 'Location error', text2: err.message || 'Could not fetch GPS location.' });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const toggleCrop = (crop: CropCategory) => {
    setCrops((prev) => {
      if (prev.includes(crop)) return prev.filter((c) => c !== crop);
      if (prev.length >= 3) {
        Toast.show({ type: 'info', text1: 'Max 3 categories', position: 'top' });
        return prev;
      }
      return [...prev, crop];
    });
  };

  const handleNext = () => {
    if (step === 0) {
      const err = validateStep1();
      if (err) { Toast.show({ type: 'error', text1: err }); return; }
      animateStep(1, 'forward');
    } else if (step === 1) {
      const err = validateStep2();
      if (err) { Toast.show({ type: 'error', text1: err }); return; }
      animateStep(2, 'forward');
    }
  };

  const handleBack = () => {
    if (step > 0) animateStep(step - 1, 'back');
    else navigation.goBack();
  };

  const handleSubmit = async (skip = false) => {
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        idToken,
        role: UserRole.FARMER,
        email: email.trim() || undefined,
        farmName: farmName.trim() || undefined,
        location: location.trim() || undefined,
      });
      navigation.replace('RegistrationSuccess', { role: 'FARMER', name: name.trim() });
    } catch (e: any) {
      // Recovery: if backend says "already registered", silently log them in
      // instead of throwing them back to the splash loop.
      const msg = e?.response?.data?.message || e?.message || '';
      if (/already registered|already exists|conflict/i.test(msg)) {
        try { await login(idToken); return; }
        catch (e2: any) {
          Toast.show({ type: 'error', text1: 'Login failed', text2: e2?.message ?? 'Try again' });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Registration failed',
          text2: msg || 'Please try again.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step panels ─────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <>
      <PhotoPicker uri={photoUri} onPress={handlePhotoPress} />
      <Field label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Ramesh Kumar" />
      <Field label="Email" value={email} onChangeText={setEmail} placeholder="farmer@example.com"
        keyboardType="email-address" optional />
      <LanguagePicker value={language} onChange={setLanguage} />
    </>
  );

  const renderStep2 = () => (
    <>
      <Field label="Farm Name" value={farmName} onChangeText={setFarmName} placeholder="e.g. Green Acres Farm" />

      {/* Location */}
      <View style={styles.fieldLabelRow}>
        <Text style={fieldStyles.label}>Farm Location</Text>
      </View>
      <View style={[fieldStyles.inputRow, { marginBottom: 8 }]}>
        <TextInput
          style={[fieldStyles.input]}
          value={location}
          onChangeText={setLocation}
          placeholder="Search location or use GPS"
          placeholderTextColor={Colors.textHint}
          selectionColor={Colors.primary}
        />
        <TouchableOpacity onPress={handleGPS} disabled={gpsLoading} style={{ padding: 4 }}>
          <Icon name={gpsLoading ? 'hourglass-outline' : 'location'} size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.gpsBtn} onPress={handleGPS} disabled={gpsLoading}>
        <Icon name="navigate-outline" size={16} color={Colors.primary} />
        <Text style={styles.gpsBtnText}>{gpsLoading ? 'Fetching location…' : 'Use current location'}</Text>
      </TouchableOpacity>

      <Field label="Land Area (acres)" value={landArea} onChangeText={setLandArea}
        placeholder="e.g. 5.5" keyboardType="numeric" optional />

      {/* Crop categories */}
      <View style={styles.fieldLabelRow}>
        <Text style={fieldStyles.label}>Crop Categories</Text>
        <Text style={styles.cropCount}>{crops.length}/3 selected</Text>
      </View>
      <View style={styles.chipWrap}>
        {CROP_CATEGORIES.map((c) => (
          <CropChip
            key={c}
            label={c}
            selected={crops.includes(c)}
            onPress={() => toggleCrop(c)}
            disabled={crops.length >= 3}
          />
        ))}
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.skipHeader}>
        <Text style={styles.stepSubtitle}>
          Documents are optional and can be added later from your profile.
        </Text>
      </View>

      <UploadBox
        label="Upload Aadhaar Card"
        subtitle="JPEG, PNG or PDF — max 5 MB"
        uri={aadhaarUri}
        onPress={() => handleDocumentPress(setAadhaarUri)}
      />

      <Text style={[fieldStyles.label, { marginBottom: 14 }]}>Bank Account Details</Text>
      <Field
        label="Account Number"
        value={accountNo}
        onChangeText={setAccountNo}
        placeholder="Enter account number"
        keyboardType="number-pad"
        secureTextEntry={false}
      />
      <Field
        label="IFSC Code"
        value={ifsc}
        onChangeText={(t) => setIfsc(t.toUpperCase())}
        placeholder="e.g. SBIN0001234"
      />

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => handleSubmit(true)}
        disabled={submitting}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Farmer Registration</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressStepper currentStep={step} />

        {/* Animated step panel */}
        <Reanimated.View style={[styles.panel, slideStyle]}>
          <Text style={styles.stepTitle}>
            {step === 0 ? 'Personal Details' : step === 1 ? 'Farm Details' : 'Documents'}
          </Text>

          {step === 0 && renderStep1()}
          {step === 1 && renderStep2()}
          {step === 2 && renderStep3()}
        </Reanimated.View>

        {/* Footer actions */}
        {step < 2 && (
          <Button
            onPress={handleNext}
            fullWidth
            size="lg"
            style={styles.nextBtn}
          >
            Next →
          </Button>
        )}
        {step === 2 && (
          <Button
            onPress={() => handleSubmit(false)}
            loading={submitting}
            fullWidth
            size="lg"
            style={styles.nextBtn}
          >
            Create Account
          </Button>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },
  panel: {
    // overflow clipped by parent ScrollView
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cropCount: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  gpsBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  skipHeader: { marginBottom: 8 },
  skipBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  nextBtn: {
    marginTop: 16,
  },
});

export default FarmerRegistrationScreen;
