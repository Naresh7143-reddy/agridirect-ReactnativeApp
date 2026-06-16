// FILE: src/screens/common/LanguageSettingsScreen.tsx
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';
import { appStorage } from '../../utils/storage';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Language {
  code: string;
  flag: string;
  nativeName: string;
  englishName: string;
  region: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', flag: '🇬🇧', nativeName: 'English', englishName: 'English', region: 'India' },
  { code: 'hi', flag: '🇮🇳', nativeName: 'हिंदी', englishName: 'Hindi', region: 'India' },
  { code: 'te', flag: '🇮🇳', nativeName: 'తెలుగు', englishName: 'Telugu', region: 'India' },
  { code: 'ta', flag: '🇮🇳', nativeName: 'தமிழ்', englishName: 'Tamil', region: 'India' },
  { code: 'kn', flag: '🇮🇳', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', region: 'India' },
  { code: 'ml', flag: '🇮🇳', nativeName: 'മലയാളം', englishName: 'Malayalam', region: 'India' },
];

// ─── LanguageItem ─────────────────────────────────────────────────────────────

interface ItemProps {
  lang: Language;
  isSelected: boolean;
  onSelect: (code: string) => void;
}

const LanguageItem: React.FC<ItemProps> = ({ lang, isSelected, onSelect }) => {
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  const handlePress = useCallback(() => {
    onSelect(lang.code);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [lang.code, onSelect, scaleAnim]);

  return (
    <TouchableOpacity
      style={[
        styles.langCard,
        shadow.sm,
        isSelected && styles.langCardSelected,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={styles.flag}>{lang.flag}</Text>
      <View style={styles.langInfo}>
        <Text style={styles.nativeName}>{lang.nativeName}</Text>
        <Text style={styles.englishName}>{lang.englishName}</Text>
        <Text style={styles.region}>{lang.region}</Text>
      </View>
      <Animated.View
        style={[
          styles.radioOuter,
          isSelected && styles.radioOuterSelected,
        ]}
      >
        {isSelected && (
          <Animated.View
            style={[styles.radioInner, { transform: [{ scale: scaleAnim }] }]}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const LanguageSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const savedCode = appStorage.getString('language') ?? 'en';
  const [currentCode, setCurrentCode] = useState(savedCode);
  const [selectedCode, setSelectedCode] = useState(savedCode);

  const hasChanged = selectedCode !== currentCode;

  const handleApply = useCallback(() => {
    const lang = LANGUAGES.find((l) => l.code === selectedCode);
    if (!lang) return;
    Alert.alert(
      'Language Change',
      `App will use ${lang.englishName} after restart. Restart now?`,
      [
        {
          text: 'Later',
          style: 'cancel',
          onPress: () => {
            appStorage.set('language', selectedCode);
            setCurrentCode(selectedCode);
          },
        },
        {
          text: 'Restart',
          onPress: () => {
            appStorage.set('language', selectedCode);
            setCurrentCode(selectedCode);
            Alert.alert(
              'Restart Required',
              'Please close and reopen the app for the language change to take effect.',
            );
          },
        },
      ],
    );
  }, [selectedCode]);

  const renderItem = useCallback(
    ({ item }: { item: Language }) => (
      <LanguageItem
        lang={item}
        isSelected={selectedCode === item.code}
        onSelect={setSelectedCode}
      />
    ),
    [selectedCode],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={styles.subtitle}>
        Select your preferred language for the app interface.
      </Text>

      <FlashList
        data={LANGUAGES}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        estimatedItemSize={60}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyBtn, !hasChanged && styles.applyBtnDisabled]}
          onPress={handleApply}
          disabled={!hasChanged}
          activeOpacity={0.8}
        >
          <Text style={[styles.applyText, !hasChanged && styles.applyTextDisabled]}>
            Apply Language
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  langCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.successLight,
  },
  flag: { fontSize: 28, marginRight: 12 },
  langInfo: { flex: 1 },
  nativeName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  englishName: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  region: { fontSize: 11, color: Colors.textHint, marginTop: 1 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: Colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
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
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnDisabled: { backgroundColor: Colors.border },
  applyText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  applyTextDisabled: { color: Colors.textHint },
});

export default LanguageSettingsScreen;
