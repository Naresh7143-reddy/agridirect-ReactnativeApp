/**
 * AddProductScreen
 *
 * Also used for editing when route.params.productId is present.
 * Presented as a modal bottom-sheet from the FAB (AddProduct)
 * or as a push screen (EditProduct).
 *
 * Features:
 *  - 4 image slots with upload stubs
 *  - Live preview mini-card (updates on every field change)
 *  - react-hook-form with manual zod-style validation
 *  - Category chips loaded from /api/categories
 *  - Unit pill toggle
 *  - Stock +/- stepper with spring animation
 *  - Available switch
 *  - POST /api/farmer/products  (create)
 *  - PUT  /api/farmer/products/:id (edit)
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Image,
  Animated,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useForm, Controller, useWatch } from 'react-hook-form';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import type { ProductCategory } from '../../types/product';
import type { FarmerScreenProps } from '../../types/navigation';
import { launchCamera, launchGallery } from '../../utils/imagePicker';

const { width: W } = Dimensions.get('window');
const SLOT_SIZE = (W - 48 - 30) / 4; // 4 slots with 10px gaps + 24px horizontal padding

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormValues {
  name: string;
  categoryId: string;
  price: string;
  unit: string;
  stock: string;
  description: string;
  isAvailable: boolean;
}

interface ImageSlot {
  uri: string | null;
  uploading: boolean;
  progress: number;
  url: string | null; // returned from server
}

const UNITS = ['kg', 'piece', 'litre', 'bunch', 'dozen'];

const DEFAULT_FORM: FormValues = {
  name: '',
  categoryId: '',
  price: '',
  unit: 'kg',
  stock: '0',
  description: '',
  isAvailable: true,
};

// ─── Live Preview Card ─────────────────────────────────────────────────────────

interface PreviewCardProps {
  name: string;
  price: string;
  unit: string;
  categoryName: string;
  imageUri: string | null;
}

const PreviewCard: React.FC<PreviewCardProps> = ({
  name, price, unit, categoryName, imageUri,
}) => (
  <View style={previewStyles.card}>
    <View style={previewStyles.imageBox}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={previewStyles.image} />
      ) : (
        <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={previewStyles.imagePlaceholder}>
          <Icon name="leaf-outline" size={28} color={Colors.primary} />
        </LinearGradient>
      )}
    </View>
    <View style={previewStyles.info}>
      <Text style={previewStyles.tag} numberOfLines={1}>
        {categoryName || 'Category'}
      </Text>
      <Text style={previewStyles.pName} numberOfLines={2}>
        {name || 'Product Name'}
      </Text>
      <Text style={previewStyles.price}>
        {price ? `₹${price}` : '₹—'}{' '}
        <Text style={previewStyles.unit}>/{unit || 'kg'}</Text>
      </Text>
    </View>
    <View style={previewStyles.badge}>
      <Text style={previewStyles.badgeText}>Preview</Text>
    </View>
  </View>
);

const previewStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...shadow.sm,
    position: 'relative',
  },
  imageBox: { borderRadius: 10, overflow: 'hidden' },
  image: { width: 64, height: 64, borderRadius: 10 },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  tag: { fontSize: 11, color: Colors.primary, fontWeight: '700', marginBottom: 2 },
  pName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  price: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  unit: { fontSize: 12, fontWeight: '400', color: Colors.textSecondary },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, color: Colors.white, fontWeight: '700' },
});

// ─── Image Slot ───────────────────────────────────────────────────────────────

interface ImageSlotProps {
  slot: ImageSlot;
  index: number;
  onTap: (index: number) => void;
  onDelete: (index: number) => void;
}

const ImageSlotView: React.FC<ImageSlotProps> = ({ slot, index, onTap, onDelete }) => (
  <TouchableOpacity
    style={[slotStyles.slot, slot.uri && slotStyles.slotFilled]}
    onPress={() => !slot.uri && onTap(index)}
    activeOpacity={0.8}
  >
    {slot.uri ? (
      <>
        <Image source={{ uri: slot.uri }} style={slotStyles.image} />
        {slot.uploading && (
          <View style={slotStyles.uploadOverlay}>
            <Text style={slotStyles.progressText}>{slot.progress}%</Text>
          </View>
        )}
        <TouchableOpacity style={slotStyles.deleteBtn} onPress={() => onDelete(index)}>
          <Icon name="close-circle" size={18} color={Colors.error} />
        </TouchableOpacity>
      </>
    ) : (
      <>
        <Icon name="camera-outline" size={20} color={Colors.primary} />
        <Text style={slotStyles.slotLabel}>Photo</Text>
      </>
    )}
  </TouchableOpacity>
);

const slotStyles = StyleSheet.create({
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    gap: 4,
  },
  slotFilled: { borderStyle: 'solid', borderColor: Colors.border },
  image: { width: '100%', height: '100%', borderRadius: 9 },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  deleteBtn: { position: 'absolute', top: -6, right: -6 },
  slotLabel: { fontSize: 9, color: Colors.primary, fontWeight: '600' },
});

// ─── Stock Stepper ────────────────────────────────────────────────────────────

interface StepperProps {
  value: string;
  onChange: (v: string) => void;
}

const StockStepper: React.FC<StepperProps> = ({ value, onChange }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const num = parseInt(value, 10) || 0;

  const bump = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.15, useNativeDriver: true, friction: 5 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
  };

  const dec = () => {
    if (num <= 0) return;
    bump();
    onChange(String(num - 1));
  };
  const inc = () => {
    bump();
    onChange(String(num + 1));
  };

  return (
    <View style={stepperStyles.row}>
      <TouchableOpacity style={[stepperStyles.btn, num <= 0 && stepperStyles.btnDisabled]} onPress={dec}>
        <Icon name="remove" size={20} color={num > 0 ? Colors.primary : Colors.textDisabled} />
      </TouchableOpacity>
      <Animated.View style={[stepperStyles.valueBox, { transform: [{ scale }] }]}>
        <TextInput
          style={stepperStyles.valueInput}
          value={value}
          onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          textAlign="center"
          selectionColor={Colors.primary}
        />
      </Animated.View>
      <TouchableOpacity style={stepperStyles.btn} onPress={inc}>
        <Icon name="add" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const stepperStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  btnDisabled: { borderColor: Colors.divider },
  valueBox: {
    width: 72,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  valueInput: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    width: '100%',
    padding: 0,
  },
});

// ─── Section Label ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string; optional?: boolean }> = ({ label, optional }) => (
  <Text style={sectionStyles.label}>
    {label}
    {optional && <Text style={sectionStyles.opt}> (optional)</Text>}
  </Text>
);

const sectionStyles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  opt: { fontWeight: '400', color: Colors.textHint },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Props = FarmerScreenProps<'AddProduct'>;

const AddProductScreen: React.FC<Props> = ({ navigation }) => {
  const [images, setImages] = useState<ImageSlot[]>([
    { uri: null, uploading: false, progress: 0, url: null },
    { uri: null, uploading: false, progress: 0, url: null },
    { uri: null, uploading: false, progress: 0, url: null },
    { uri: null, uploading: false, progress: 0, url: null },
  ]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<FormValues>({ defaultValues: DEFAULT_FORM });

  const watchedName = watch('name');
  const watchedPrice = watch('price');
  const watchedUnit = watch('unit');
  const watchedCategoryId = watch('categoryId');

  const categoryName = useMemo(
    () => categories.find((c) => c.id === watchedCategoryId)?.name ?? '',
    [categories, watchedCategoryId],
  );
  const firstImageUri = images.find((s) => s.uri)?.uri ?? null;

  // ── Load categories ──────────────────────────────────────────────────────────

  useEffect(() => {
    categoriesApi.getAll().then((res) => {
      setCategories(res.data ?? []);
    }).catch(() => {/* no-op */});
  }, []);

  // ── Image handling ───────────────────────────────────────────────────────────

  const handleSlotTap = (index: number) => {
    const applyImage = (uri: string) => {
      setImages((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], uri };
        return next;
      });
    };
    Alert.alert('Add Photo', 'Choose source', [
      { text: 'Camera',  onPress: () => launchCamera((img)  => { if (img) applyImage(img.uri); }) },
      { text: 'Gallery', onPress: () => launchGallery((img) => { if (img) applyImage(img.uri); }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteSlot = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = { uri: null, uploading: false, progress: 0, url: null };
      return next;
    });
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = (values: FormValues): string | null => {
    if (!values.name.trim() || values.name.trim().length < 3)
      return 'Product name must be at least 3 characters';
    if (!values.categoryId) return 'Please select a category';
    const price = parseFloat(values.price);
    if (!values.price || isNaN(price) || price <= 0) return 'Enter a valid price';
    if (!values.unit) return 'Please select a unit';
    const stock = parseInt(values.stock, 10);
    if (isNaN(stock) || stock < 0) return 'Stock must be 0 or more';
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  // Upload a single local image URI to Cloudinary via the backend.
  // Returns the hosted URL, or null on failure.
  const uploadOne = async (uri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      // RN multipart file shape
      formData.append('file', { uri, type: 'image/jpeg', name: `crop_${Date.now()}.jpg` } as any);
      const res: any = await productsApi.uploadImage(formData);
      // Backend now returns { imageUrl, publicId }. Fall back to string just
      // in case (older deploy).
      const data = res?.data;
      if (data && typeof data === 'object' && data.imageUrl) return data.imageUrl;
      if (typeof data === 'string') return data;
      return null;
    } catch (e) {
      return null;
    }
  };

  const onSubmit = async (values: FormValues) => {
    const err = validate(values);
    if (err) { Toast.show({ type: 'error', text1: err }); return; }

    setSubmitting(true);
    try {
      // 1. Upload any local images to Cloudinary first.
      const localUris = images.filter((s) => s.uri && !s.url).map((s) => s.uri!) ;
      const uploadedUrls: string[] = [];
      for (const uri of localUris) {
        const hosted = await uploadOne(uri);
        if (hosted) uploadedUrls.push(hosted);
      }
      // Merge already-hosted URLs (from earlier upload runs) with newly uploaded.
      const alreadyHosted = images.map((s) => s.url).filter((u): u is string => !!u);
      const imageUrls = [...alreadyHosted, ...uploadedUrls];

      // 2. Create the product including the image URLs so they persist.
      await productsApi.create({
        name: values.name.trim(),
        description: values.description.trim(),
        price: parseFloat(values.price),
        unit: values.unit,
        stock: parseInt(values.stock, 10),
        minOrderQuantity: 1,
        categoryId: values.categoryId,
        images: imageUrls as any,
      } as any);
      Toast.show({ type: 'success', text1: 'Product added!', text2: values.name });
      setSubmitting(false);
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Try again';
      Toast.show({ type: 'error', text1: 'Failed to add product', text2: msg });
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Live preview */}
        <PreviewCard
          name={watchedName}
          price={watchedPrice}
          unit={watchedUnit}
          categoryName={categoryName}
          imageUri={firstImageUri}
        />

        {/* ── Image slots ───────────────────────────────────── */}
        <SectionLabel label="Product Photos" />
        <View style={styles.slotsRow}>
          {images.map((slot, i) => (
            <ImageSlotView
              key={i}
              slot={slot}
              index={i}
              onTap={handleSlotTap}
              onDelete={handleDeleteSlot}
            />
          ))}
        </View>
        <Text style={styles.photoHint}>First photo is the cover. Tap a slot to add.</Text>

        {/* ── Product Name ──────────────────────────────────── */}
        <Controller
          control={control}
          name="name"
          rules={{ required: true, minLength: 3, maxLength: 50 }}
          render={({ field: { value, onChange } }) => (
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <SectionLabel label="Product Name" />
                <Text style={styles.charCount}>{value.length}/50</Text>
              </View>
              <TextInput
                style={[styles.textInput, errors.name && styles.inputError]}
                value={value}
                onChangeText={(t) => onChange(t.slice(0, 50))}
                placeholder="e.g. Fresh Tomatoes"
                placeholderTextColor={Colors.textHint}
                selectionColor={Colors.primary}
              />
              {errors.name && <Text style={styles.errorText}>Min 3 chars required</Text>}
            </View>
          )}
        />

        {/* ── Category ─────────────────────────────────────── */}
        <Controller
          control={control}
          name="categoryId"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <View style={styles.fieldBlock}>
              <SectionLabel label="Category" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {categories.length === 0 ? (
                  <Text style={{ color: Colors.textHint, fontSize: 13, paddingVertical: 8 }}>
                    Loading categories…
                  </Text>
                ) : (
                  categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => onChange(cat.id)}
                      style={[styles.chip, value === cat.id && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, value === cat.id && styles.chipTextSelected]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              {errors.categoryId && <Text style={styles.errorText}>Please select a category</Text>}
            </View>
          )}
        />

        {/* ── Price ─────────────────────────────────────────── */}
        <Controller
          control={control}
          name="price"
          rules={{ required: true }}
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.fieldBlock}>
              <SectionLabel label="Price (₹ per unit)" />
              <View style={[styles.priceRow, errors.price && styles.inputError]}>
                <Text style={styles.pricePrefix}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textHint}
                  keyboardType="decimal-pad"
                  selectionColor={Colors.primary}
                />
              </View>
              <Text style={styles.hint}>💡 Suggested price: ₹25–₹40 for similar items</Text>
            </View>
          )}
        />

        {/* ── Unit ─────────────────────────────────────────── */}
        <Controller
          control={control}
          name="unit"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <View style={styles.fieldBlock}>
              <SectionLabel label="Unit" />
              <View style={styles.pillRow}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => onChange(u)}
                    style={[styles.pill, value === u && styles.pillSelected]}
                  >
                    <Text style={[styles.pillText, value === u && styles.pillTextSelected]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        {/* ── Stock ─────────────────────────────────────────── */}
        <Controller
          control={control}
          name="stock"
          render={({ field: { value, onChange } }) => (
            <View style={styles.fieldBlock}>
              <SectionLabel label="Stock Quantity" />
              <StockStepper value={value} onChange={onChange} />
              {value === '0' && (
                <Text style={styles.hint}>0 = out of stock (won't show to buyers)</Text>
              )}
            </View>
          )}
        />

        {/* ── Description ───────────────────────────────────── */}
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <SectionLabel label="Description" optional />
                <Text style={styles.charCount}>{value.length}/200</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textarea]}
                value={value}
                onChangeText={(t) => onChange(t.slice(0, 200))}
                placeholder="Describe your product — freshness, variety, harvest date…"
                placeholderTextColor={Colors.textHint}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                selectionColor={Colors.primary}
              />
            </View>
          )}
        />

        {/* ── Available toggle ──────────────────────────────── */}
        <Controller
          control={control}
          name="isAvailable"
          render={({ field: { value, onChange } }) => (
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Icon name="eye-outline" size={18} color={Colors.primary} />
                <Text style={styles.toggleText}>List as available</Text>
              </View>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={value ? Colors.white : Colors.surface}
              />
            </View>
          )}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnLoading]}
          onPress={handleSubmit(onSubmit)}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Colors.gradientGreen}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {submitting ? (
              <>
                <Icon name="cloud-upload-outline" size={20} color={Colors.white} />
                <Text style={styles.submitText}>Uploading…</Text>
              </>
            ) : (
              <>
                <Icon name="checkmark-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.submitText}>Add Product</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    ...shadow.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 20, paddingBottom: 48 },
  slotsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  photoHint: { fontSize: 12, color: Colors.textHint, marginBottom: 20 },
  fieldBlock: { marginBottom: 22 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { fontSize: 12, color: Colors.textHint, marginBottom: 8 },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    ...shadow.sm,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  inputError: { borderColor: Colors.error },
  errorText: { color: Colors.error, fontSize: 12, marginTop: 4 },
  chipScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 8,
    marginBottom: 4,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextSelected: { color: Colors.white },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    ...shadow.sm,
  },
  pricePrefix: { fontSize: 24, fontWeight: '700', color: Colors.primary, marginRight: 6 },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  hint: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  pillTextSelected: { color: Colors.white },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  submitBtn: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  submitBtnLoading: { opacity: 0.8 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.white, letterSpacing: 0.3 },
});

export default AddProductScreen;
