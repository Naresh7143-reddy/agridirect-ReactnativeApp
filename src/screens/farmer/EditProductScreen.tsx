/**
 * EditProductScreen
 *
 * Thin wrapper over the shared product form.
 * Loads existing product data and passes it as default values.
 * Submits via PUT /api/farmer/products/:id.
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import type { Product, ProductCategory } from '../../types/product';
import type { FarmerScreenProps } from '../../types/navigation';

// ─── Shared sub-components (duplicated lightweight versions) ──────────────────

const UNITS = ['kg', 'piece', 'litre', 'bunch', 'dozen'];

interface FormValues {
  name: string;
  categoryId: string;
  price: string;
  unit: string;
  stock: string;
  description: string;
  isAvailable: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = FarmerScreenProps<'EditProduct'>;

const EditProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      categoryId: '',
      price: '',
      unit: 'kg',
      stock: '0',
      description: '',
      isAvailable: true,
    },
  });

  // ── Load product + categories ────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      productsApi.getById(productId),
      categoriesApi.getAll(),
    ]).then(([prodRes, catRes]) => {
      const p = prodRes.data;
      setProduct(p);
      setCategories(catRes.data ?? []);
      reset({
        name: p.name,
        categoryId: p.categoryId,
        price: String(p.price),
        unit: p.unit,
        stock: String(p.stock),
        description: p.description ?? '',
        isAvailable: p.isAvailable,
      });
    }).catch((e) => {
      Toast.show({ type: 'error', text1: 'Could not load product' });
    }).finally(() => setLoadingProduct(false));
  }, [productId]);

  // ── Validate ─────────────────────────────────────────────────────────────────

  const validate = (v: FormValues): string | null => {
    if (!v.name.trim() || v.name.trim().length < 3) return 'Name must be at least 3 characters';
    if (!v.categoryId) return 'Please select a category';
    const price = parseFloat(v.price);
    if (!v.price || isNaN(price) || price <= 0) return 'Enter a valid price';
    if (!v.unit) return 'Please select a unit';
    const stock = parseInt(v.stock, 10);
    if (isNaN(stock) || stock < 0) return 'Stock must be 0 or more';
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    const err = validate(values);
    if (err) { Toast.show({ type: 'error', text1: err }); return; }

    setSubmitting(true);
    try {
      await productsApi.update(productId, {
        name: values.name.trim(),
        description: values.description.trim(),
        price: parseFloat(values.price),
        unit: values.unit,
        stock: parseInt(values.stock, 10),
        categoryId: values.categoryId,
        isAvailable: values.isAvailable,
      });
      Toast.show({ type: 'success', text1: 'Product updated!' });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loadingProduct) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading product…</Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Product image (read-only thumbnail row) */}
        {product?.images?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {product.images.map((img) => (
              <Image key={img.id} source={{ uri: img.url }} style={styles.existingThumb} />
            ))}
          </ScrollView>
        ) : null}

        {/* Name */}
        <Controller
          control={control}
          name="name"
          rules={{ required: true, minLength: 3, maxLength: 50 }}
          render={({ field: { value, onChange } }) => (
            <View style={styles.block}>
              <Text style={styles.label}>Product Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputErr]}
                value={value}
                onChangeText={(t) => onChange(t.slice(0, 50))}
                placeholder="Product name"
                placeholderTextColor={Colors.textHint}
                selectionColor={Colors.primary}
              />
            </View>
          )}
        />

        {/* Category */}
        <Controller
          control={control}
          name="categoryId"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <View style={styles.block}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => onChange(cat.id)}
                    style={[styles.chip, value === cat.id && styles.chipSel]}
                  >
                    <Text style={[styles.chipTxt, value === cat.id && styles.chipTxtSel]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        />

        {/* Price */}
        <Controller
          control={control}
          name="price"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <View style={styles.block}>
              <Text style={styles.label}>Price (₹)</Text>
              <View style={[styles.priceRow, errors.price && styles.inputErr]}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textHint}
                  selectionColor={Colors.primary}
                />
              </View>
            </View>
          )}
        />

        {/* Unit */}
        <Controller
          control={control}
          name="unit"
          render={({ field: { value, onChange } }) => (
            <View style={styles.block}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pillRow}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => onChange(u)}
                    style={[styles.pill, value === u && styles.pillSel]}
                  >
                    <Text style={[styles.pillTxt, value === u && styles.pillTxtSel]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        {/* Stock */}
        <Controller
          control={control}
          name="stock"
          render={({ field: { value, onChange } }) => (
            <View style={styles.block}>
              <Text style={styles.label}>Stock</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textHint}
                selectionColor={Colors.primary}
              />
            </View>
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <View style={styles.block}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={value}
                onChangeText={(t) => onChange(t.slice(0, 200))}
                placeholder="Describe your product…"
                placeholderTextColor={Colors.textHint}
                multiline
                selectionColor={Colors.primary}
              />
            </View>
          )}
        />

        {/* Available toggle */}
        <Controller
          control={control}
          name="isAvailable"
          render={({ field: { value, onChange } }) => (
            <View style={styles.toggleRow}>
              <Text style={styles.toggleTxt}>List as available</Text>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={Colors.white}
              />
            </View>
          )}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.8 }]}
          onPress={handleSubmit(onSubmit)}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={Colors.gradientGreen}
            style={styles.submitGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitTxt}>
              {submitting ? 'Updating…' : 'Update Product'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Colors.background },
  loaderText: { fontSize: 14, color: Colors.textSecondary },
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 20, paddingBottom: 48 },
  existingThumb: { width: 72, height: 72, borderRadius: 10, marginRight: 10 },
  block: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  input: {
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
  inputErr: { borderColor: Colors.error },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  chipSel: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTxtSel: { color: Colors.white },
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
  rupee: { fontSize: 22, fontWeight: '700', color: Colors.primary, marginRight: 6 },
  priceInput: { flex: 1, fontSize: 22, fontWeight: '700', color: Colors.textPrimary, paddingVertical: 12 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillSel: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillTxt: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  pillTxtSel: { color: Colors.white },
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
  toggleTxt: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  submitBtn: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  submitGrad: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitTxt: { fontSize: 16, fontWeight: '700', color: Colors.white, letterSpacing: 0.3 },
});

export default EditProductScreen;
