// FILE: src/screens/buyer/BrowseScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FastImage from 'react-native-fast-image';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { productsApi } from '../../api/products';
import { productImageUrl } from '../../utils/productImage';
import { categoriesApi } from '../../api/categories';
import type { Product } from '../../types/product';
import type { Category } from '../../types/category';

const SORT_OPTIONS = [
  { label: 'Relevance', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Highest Rated', value: 'rating_desc' },
];

// ── ResultItem — rendered via FlatList, manages its own animation ─────────────
interface ResultItemProps {
  item: Product;
  index: number;
  onPress: () => void;
}

const ResultItem: React.FC<ResultItemProps> = ({ item, index, onPress }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      <TouchableOpacity style={styles.resultCard} onPress={onPress} activeOpacity={0.85}>
        <FastImage
          source={{ uri: productImageUrl(item) }}
          style={styles.resultImage}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.resultFarmer}>{item.farmerName}</Text>
          {(item.rating ?? 0) > 0 && <Text style={styles.resultRating}>⭐ {(item.rating ?? 0).toFixed(1)}</Text>}
          <View style={styles.resultBottom}>
            <Text style={styles.resultPrice}>₹{item.price}/{item.unit}</Text>
            {item.stock === 0 && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of stock</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const BrowseScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    categoriesApi.getAll().then((r: any) => setCategories(r.data || [])).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() && !selectedCategory) { setResults([]); return; }
    setLoading(true);
    try {
      const params: any = { sort: sortBy || undefined };
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (selectedCategory) params.categoryId = selectedCategory;
      const res: any = await productsApi.search(q, params);
      setResults(res.data?.items || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, minPrice, maxPrice]);

  const onChangeQuery = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      doSearch(text);
      if (text.trim() && !recentSearches.includes(text.trim())) {
        setRecentSearches((prev) => [text.trim(), ...prev].slice(0, 8));
      }
    }, 400);
  };

  const applyFilters = () => {
    setShowFilter(false);
    doSearch(query);
  };

  const renderResult = ({ item, index }: { item: Product; index: number }) => (
    <ResultItem
      item={item}
      index={index}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    />
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search vegetables, fruits..."
            placeholderTextColor={Colors.textHint}
            value={query}
            onChangeText={onChangeQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => doSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Results Header */}
      {results.length > 0 && query.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{results.length} results for "{query}"</Text>
        </View>
      )}

      {/* Recent Searches */}
      {query.length === 0 && recentSearches.length > 0 && (
        <View style={styles.recentWrap}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
            {recentSearches.map((s) => (
              <TouchableOpacity key={s} style={styles.recentChip} onPress={() => { setQuery(s); doSearch(s); }}>
                <Text style={styles.recentChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />}

      {!loading && results.length === 0 && query.length > 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔎</Text>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try different keywords or filters</Text>
        </View>
      )}

      {!loading && (
        <FlashList
          data={results}
          renderItem={renderResult}
          keyExtractor={(p) => p.id}
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Filter Modal */}
      <Modal
        isVisible={showFilter}
        onBackdropPress={() => setShowFilter(false)}
        style={styles.modal}
        swipeDirection="down"
        onSwipeComplete={() => setShowFilter(false)}
      >
        <View style={styles.filterSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.filterTitle}>Filters</Text>

          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {[{ id: '', name: 'All' } as Category, ...categories].map((c) => (
              <TouchableOpacity
                key={c.id || 'all'}
                style={[styles.chip, selectedCategory === c.id && styles.chipActive]}
                onPress={() => setSelectedCategory(c.id || '')}
              >
                <Text style={[styles.chipText, selectedCategory === c.id && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Price Range (₹)</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              placeholderTextColor={Colors.textHint}
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <Text style={styles.priceDash}>—</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              placeholderTextColor={Colors.textHint}
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>

          <Text style={styles.filterLabel}>Sort By</Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.radioRow}
              onPress={() => setSortBy(opt.value)}
            >
              <View style={[styles.radio, sortBy === opt.value && styles.radioActive]}>
                {sortBy === opt.value && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default BrowseScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 12, backgroundColor: Colors.white, ...shadow.sm },
  backBtn: { padding: 8 },
  backText: { fontSize: 22, color: Colors.textPrimary },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: borderRadius.lg, paddingHorizontal: 10, paddingVertical: 8, marginHorizontal: 8 },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, padding: 0 },
  clearBtn: { color: Colors.textHint, fontSize: 14, padding: 4 },
  filterBtn: { padding: 8 },
  filterIcon: { fontSize: 20, color: Colors.primary },
  resultsHeader: { paddingHorizontal: 16, paddingVertical: 10 },
  resultsCount: { color: Colors.textSecondary, fontSize: 13 },
  recentWrap: { paddingHorizontal: 16, paddingTop: 12 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  recentRow: { gap: 8, paddingBottom: 8 },
  recentChip: { backgroundColor: Colors.white, borderRadius: borderRadius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  recentChipText: { color: Colors.textSecondary, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  resultCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: borderRadius.md, marginBottom: 12, overflow: 'hidden', ...shadow.sm },
  resultImage: { width: 90, height: 90 },
  resultInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
  resultName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  resultFarmer: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  resultRating: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  resultBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  resultPrice: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  outOfStockBadge: { backgroundColor: Colors.errorLight, borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  outOfStockText: { color: Colors.error, fontSize: 10, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textHint, marginTop: 4 },
  modal: { justifyContent: 'flex-end', margin: 0 },
  filterSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  filterTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginTop: 12 },
  chipRow: { gap: 8, flexDirection: 'row', paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, marginRight: 8 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInput: { flex: 1, backgroundColor: Colors.background, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  priceDash: { color: Colors.textHint, fontSize: 18 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  radioLabel: { fontSize: 14, color: Colors.textPrimary },
  applyBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  applyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
