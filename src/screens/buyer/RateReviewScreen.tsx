// FILE: src/screens/buyer/RateReviewScreen.tsx
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import type { BuyerStackParamList } from '../../navigation/types';

const TAGS = ['Fresh', 'Good Value', 'Fast Delivery', 'Organic', 'Friendly Farmer'];

// ── StarButton sub-component ──────────────────────────────────────────────────
interface StarButtonProps {
  star: number;
  selected: boolean;
  onPress: () => void;
}

const StarButton: React.FC<StarButtonProps> = ({ star, selected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.4, useNativeDriver: true, speed: 80 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 80 }),
    ]).start();
    onPress();
  }, [scaleAnim, onPress]);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.starBtn}>
      <Animated.Text style={[styles.starChar, selected && styles.starCharActive, { transform: [{ scale: scaleAnim }] }]}>
        ★
      </Animated.Text>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const RateReviewScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const route = useRoute<RouteProp<BuyerStackParamList, 'RateReview'>>();
  const { orderId } = route.params;

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const fullReview = [review, ...selectedTags.map((t) => `#${t.replace(/ /g, '')}`)].join(' ');
      await ordersApi.rateOrder(orderId, rating, fullReview.trim());
      setSubmitted(true);
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 60 }).start();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }, [rating, review, selectedTags, orderId, successScale]);

  const getRatingLabel = (r: number) => {
    const labels = ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🌟'];
    return labels[r] || '';
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Animated.View style={[styles.successContent, { transform: [{ scale: successScale }] }]}>
          <Text style={styles.successIcon}>🌱</Text>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successSubtitle}>Your review helps farmers improve</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate & Review</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product info header */}
        <View style={styles.productHeader}>
          <View style={styles.productIcon}>
            <Text style={styles.productIconText}>🥬</Text>
          </View>
          <View>
            <Text style={styles.productTitle}>Order #{orderId.slice(-8).toUpperCase()}</Text>
            <Text style={styles.productSub}>Share your experience</Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>How was your experience?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <StarButton
                key={s}
                star={s}
                selected={s <= rating}
                onPress={() => setRating(s)}
              />
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
          )}
        </View>

        {/* Review Text */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your experience</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Tell us about your order quality, freshness, and delivery..."
            placeholderTextColor={Colors.textHint}
            multiline
            maxLength={300}
            value={review}
            onChangeText={setReview}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{review.length}/300</Text>
        </View>

        {/* Tags */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>What stood out? (optional)</Text>
          <View style={styles.tagsWrap}>
            {TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tagChipText, selectedTags.includes(tag) && styles.tagChipTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (rating === 0 || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default RateReviewScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  successContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  successContent: { alignItems: 'center', padding: 24 },
  successIcon: { fontSize: 80 },
  successTitle: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginTop: 16 },
  successSubtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  doneBtn: { marginTop: 32, backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: 48, paddingVertical: 14 },
  doneBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: Colors.white, ...shadow.sm },
  backText: { fontSize: 22, color: Colors.textPrimary, width: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  productIcon: { width: 56, height: 56, borderRadius: borderRadius.lg, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  productIconText: { fontSize: 30 },
  productTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  productSub: { fontSize: 13, color: Colors.textHint, marginTop: 2 },
  card: { backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12, ...shadow.sm },
  cardLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 14 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  starBtn: { padding: 8 },
  starChar: { fontSize: 44, color: Colors.border },
  starCharActive: { color: Colors.secondary },
  ratingLabel: { textAlign: 'center', fontSize: 15, fontWeight: '600', color: Colors.primary },
  reviewInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: borderRadius.md, padding: 12, fontSize: 14, color: Colors.textPrimary, height: 100, backgroundColor: Colors.background },
  charCount: { fontSize: 11, color: Colors.textHint, textAlign: 'right', marginTop: 4 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  tagChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tagChipTextActive: { color: Colors.white },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: borderRadius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { backgroundColor: Colors.border },
  submitBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
