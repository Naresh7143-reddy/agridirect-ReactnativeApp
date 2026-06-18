import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, RefreshControl, StatusBar, Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { productsApi } from '../../api/products';
import { productImageUrl } from '../../utils/productImage';
import type { Product } from '../../types/product';
import type { FarmerStackParamList } from '../../types/navigation';

const formatINR = (n: number) =>
  '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const MyProductsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await productsApi.getMyListings({ page: 1, limit: 50 });
      const data: any = res?.data;
      if (Array.isArray(data)) setProducts(data);
      else if (Array.isArray(data?.items)) setProducts(data.items);
      else if (Array.isArray(data?.content)) setProducts(data.content);
      else setProducts([]);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load products' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (productId: string) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await productsApi.delete(productId);
            setProducts((p) => p.filter((x) => x.id !== productId));
            Toast.show({ type: 'success', text1: 'Product deleted' });
          } catch {
            Toast.show({ type: 'error', text1: 'Could not delete product' });
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Product }) => {
    const img = productImageUrl(item);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductPreview', { productId: item.id })}
        activeOpacity={0.85}
      >
        {img ? (
          <Image source={{ uri: img }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Icon name="leaf-outline" size={28} color={Colors.primary} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.price}>{formatINR(item.price)}/{item.unit}</Text>
          <Text style={styles.stock}>Stock: {item.stock} {item.unit}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.isAvailable ? Colors.successLight : Colors.errorLight }]}>
            <Text style={[styles.statusText, { color: item.isAvailable ? Colors.success : Colors.error }]}>
              {item.isAvailable ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
          >
            <Icon name="pencil-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Icon name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddProduct')} style={styles.addBtn}>
          <Icon name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlashList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={100}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="leaf-outline" size={48} color={Colors.primary} />
              <Text style={styles.emptyTitle}>No products yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddProduct')}>
                <Text style={styles.emptyBtnText}>Add your first product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: borderRadius.lg,
    marginBottom: 12, padding: 12, ...shadow.sm,
  },
  image: { width: 70, height: 70, borderRadius: 10, marginRight: 12 },
  imageFallback: { backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  price: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  stock: { fontSize: 12, color: Colors.textSecondary },
  statusBadge: { alignSelf: 'flex-start', borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actions: { gap: 8 },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.errorLight, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.full, paddingHorizontal: 24, paddingVertical: 10 },
  emptyBtnText: { color: Colors.white, fontWeight: '700' },
});

export default MyProductsScreen;
