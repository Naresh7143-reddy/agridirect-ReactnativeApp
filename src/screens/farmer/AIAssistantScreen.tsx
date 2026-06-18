/**
 * AIAssistantScreen — "Krishi AI 🌱"
 *
 * Chat interface for farmer AI assistant powered by the backend Gemini integration.
 *
 * Features:
 *  - FlatList (inverted) with user/AI message bubbles
 *  - Animated 3-dot typing indicator
 *  - Quick prompt chips above keyboard
 *  - Language selector (EN | हिं | తె | தமிழ்)
 *  - Camera → disease detection flow (stub, image-picker stubs)
 *  - Rich response cards: Disease, Price Forecast, General Advice
 *  - Chat history stored in component state (cleared on unmount)
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { aiApi } from '../../api/ai';
import type { ChatMessage, DiseaseDetectionResult } from '../../types/ai';
import { launchCamera, launchGallery } from '../../utils/imagePicker';
import { appStorage } from '../../utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageType = 'text' | 'disease' | 'price' | 'weather' | 'image';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  type: MessageType;
  text?: string;
  imageUri?: string;
  diseaseResult?: DiseaseDetectionResult;
  timestamp: Date;
}

// ─── Language config ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'English', label: 'EN',    langCode: 'en' },
  { code: 'Hindi',   label: 'हिं',    langCode: 'hi' },
  { code: 'Telugu',  label: 'తె',    langCode: 'te' },
  { code: 'Tamil',   label: 'தமிழ்', langCode: 'ta' },
];

const langCodeToName = (code: string): string => {
  const match = LANGUAGES.find((l) => l.langCode === code);
  return match ? match.code : 'English';
};

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: 'Disease help 🪲', text: 'How do I identify and treat common crop diseases?' },
  { label: 'Best price 💰',   text: 'What is the best time to sell my produce for maximum profit?' },
  { label: 'Weather tips 🌤', text: 'Give me farming tips based on current weather conditions.' },
  { label: 'Crop advice 🌱',  text: 'What crops should I grow this season for my region?' },
];

// ─── Typing indicator ─────────────────────────────────────────────────────────
// Each dot is its own component so useAnimatedStyle is called at component
// level — never inside a loop — satisfying the Rules of Hooks.

interface AnimatedDotProps { delay: number }

const AnimatedDot: React.FC<AnimatedDotProps> = ({ delay }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Stagger each dot by `delay` ms before starting the bounce loop
    const timer = setTimeout(() => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Reanimated.View style={[typingStyles.dot, style]} />;
};

const TypingIndicator: React.FC = () => (
  <View style={typingStyles.wrap}>
    <View style={typingStyles.avatar}>
      <Text style={typingStyles.aiLabel}>AI</Text>
    </View>
    <View style={typingStyles.bubble}>
      <AnimatedDot delay={0} />
      <AnimatedDot delay={150} />
      <AnimatedDot delay={300} />
    </View>
  </View>
);

const typingStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: { fontSize: 11, fontWeight: '700', color: Colors.white },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    ...shadow.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});

// ─── Disease card ─────────────────────────────────────────────────────────────

const DiseaseCard: React.FC<{ result: DiseaseDetectionResult }> = ({ result }) => {
  const sevColor: Record<string, string> = {
    low: Colors.success,
    medium: Colors.warning,
    high: Colors.error,
    critical: Colors.error,
  };
  const pct = Math.round(result.confidence * 100);

  return (
    <View style={diseaseStyles.card}>
      <View style={diseaseStyles.header}>
        <Text style={diseaseStyles.name}>{result.diseaseName}</Text>
        <View style={[diseaseStyles.sevBadge, { backgroundColor: sevColor[result.severity] + '22' }]}>
          <Text style={[diseaseStyles.sevText, { color: sevColor[result.severity] }]}>
            {result.severity.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={diseaseStyles.confidenceRow}>
        <Text style={diseaseStyles.confLabel}>Confidence</Text>
        <View style={diseaseStyles.bar}>
          <View style={[diseaseStyles.barFill, { width: `${pct}%` }]} />
        </View>
        <Text style={diseaseStyles.confPct}>{pct}%</Text>
      </View>
      <Text style={diseaseStyles.sectionLabel}>Treatment</Text>
      {result.treatment.slice(0, 3).map((step) => (
        <Text key={step.step} style={diseaseStyles.stepText}>
          {step.step}. {step.description}
        </Text>
      ))}
    </View>
  );
};

const diseaseStyles = StyleSheet.create({
  card: { backgroundColor: Colors.errorLight, borderRadius: 12, padding: 14, marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  sevBadge: { borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  sevText: { fontSize: 11, fontWeight: '700' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  confLabel: { fontSize: 12, color: Colors.textSecondary, width: 70 },
  bar: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  confPct: { fontSize: 12, fontWeight: '700', color: Colors.primary, width: 36 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  stepText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 4 },
});

// ─── Message bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: UIMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const ts = `${message.timestamp.getHours().toString().padStart(2,'0')}:${message.timestamp.getMinutes().toString().padStart(2,'0')}`;

  if (isUser) {
    return (
      <View style={bubbleStyles.userWrap}>
        <LinearGradient
          colors={['#1B5E20', '#2E7D32']}
          style={bubbleStyles.userBubble}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={bubbleStyles.userText}>{message.text}</Text>
        </LinearGradient>
        <Text style={bubbleStyles.ts}>{ts}</Text>
      </View>
    );
  }

  return (
    <View style={bubbleStyles.aiWrap}>
      <View style={bubbleStyles.aiAvatar}>
        <Text style={bubbleStyles.aiLabel}>AI</Text>
      </View>
      <View style={bubbleStyles.aiContent}>
        <View style={bubbleStyles.aiBubble}>
          {message.text && (
            <Text style={bubbleStyles.aiText}>{message.text}</Text>
          )}
          {message.diseaseResult && (
            <DiseaseCard result={message.diseaseResult} />
          )}
        </View>
        <Text style={bubbleStyles.ts}>{ts}</Text>
      </View>
    </View>
  );
};

const bubbleStyles = StyleSheet.create({
  userWrap: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 4 },
  userBubble: {
    maxWidth: '78%',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 14,
  },
  userText: { fontSize: 14, color: Colors.white, lineHeight: 20 },
  aiWrap: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 4, gap: 8 },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: { fontSize: 11, fontWeight: '700', color: Colors.white },
  aiContent: { flex: 1 },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: 14,
    ...shadow.sm,
  },
  aiText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  ts: { fontSize: 10, color: Colors.textHint, marginTop: 4, marginHorizontal: 4 },
});

// ─── Main component ───────────────────────────────────────────────────────────

const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      type: 'text',
      text: 'Namaste! 🌱 I\'m Krishi AI, your farming assistant. Ask me about crop diseases, market prices, weather tips, or any farming advice. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState(() => langCodeToName(appStorage.getString('language') ?? 'en'));

  const flatListRef = useRef<FlatList>(null);
  const history = useRef<ChatMessage[]>([]);

  // ── Send message ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: UIMessage = {
      id: Date.now().toString(),
      role: 'user',
      type: 'text',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [userMsg, ...prev]);
    setInputText('');
    setIsTyping(true);

    history.current.push({ role: 'user', content: text.trim() });

    try {
      const res: any = await aiApi.chat(text.trim(), language, history.current.slice(-10));
      // Backend may return either { data: { reply: "..." } } (new shape) or
      // { data: "raw string" } (old shape). Handle both gracefully.
      const reply: string =
        (res?.data && typeof res.data === 'object' && (res.data as any).reply) ||
        (typeof res?.data === 'string' && res.data) ||
        (res as any)?.message ||
        '';
      if (!reply) throw new Error('Empty reply from AI');

      history.current.push({ role: 'assistant', content: reply });

      const aiMsg: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        type: 'text',
        text: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [aiMsg, ...prev]);
    } catch (e: any) {
      // Surface the actual backend error so we can debug instead of a generic
      // "having trouble connecting" message that hides the cause.
      const backendMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Unknown error';
      const status = e?.response?.status ? ` (HTTP ${e.response.status})` : '';
      const errMsg: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        type: 'text',
        text: `⚠️ AI error${status}: ${backendMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [errMsg, ...prev]);
    } finally {
      setIsTyping(false);
    }
  }, [language]);

  // ── Disease detection ────────────────────────────────────────────────────────

  const analyzeImage = useCallback(async (uri: string) => {
    const userMsg: UIMessage = {
      id: Date.now().toString(),
      role: 'user',
      type: 'image',
      text: '📸 Crop photo sent for disease detection...',
      imageUri: uri,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri, type: 'image/jpeg', name: 'crop.jpg' } as any);
      const apiResult = await aiApi.detectDisease(formData);
      const result = apiResult.data;
      const summary = result.diseaseName
        ? `🔍 Detected: **${result.diseaseName}** (${result.severity} severity)\n\n${result.treatment?.[0]?.description ?? 'Consult your local agronomist.'}`
        : 'No disease detected. Your crop looks healthy! 🌱';
      const botMsg: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        type: 'disease',
        text: summary,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errMsg: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        type: 'text',
        text: 'Could not analyze the image. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [language]);

  const handleCameraPress = () => {
    Alert.alert('Detect Disease', 'Upload a photo of your crop for AI analysis', [
      { text: 'Camera',  onPress: () => launchCamera((img)  => { if (img) analyzeImage(img.uri); }) },
      { text: 'Gallery', onPress: () => launchGallery((img) => { if (img) analyzeImage(img.uri); }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Krishi AI 🌱</Text>
        </View>
        {/* Language chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              style={[styles.langChip, language === lang.code && styles.langChipActive]}
            >
              <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Messages (inverted FlatList = latest at bottom) */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={isTyping ? <TypingIndicator /> : null}
      />

      {/* Quick prompt chips */}
      <View style={styles.quickPromptsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPrompts}>
          {QUICK_PROMPTS.map((qp) => (
            <TouchableOpacity
              key={qp.label}
              style={styles.quickChip}
              onPress={() => sendMessage(qp.text)}
            >
              <Text style={styles.quickChipText}>{qp.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleCameraPress}>
          <Icon name="camera-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask anything about farming…"
          placeholderTextColor={Colors.textHint}
          multiline
          maxLength={500}
          selectionColor={Colors.primary}
          onSubmitEditing={() => sendMessage(inputText)}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isTyping}
        >
          <Icon
            name="arrow-up"
            size={20}
            color={inputText.trim() ? Colors.white : Colors.textHint}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingBottom: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  poweredBy: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  poweredText: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  langScroll: { flexGrow: 0 },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    marginRight: 8,
  },
  langChipActive: { backgroundColor: Colors.white },
  langText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  langTextActive: { color: Colors.primary },
  listContent: { paddingTop: 12, paddingBottom: 8 },
  quickPromptsWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  quickPrompts: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 4,
  },
  quickChipText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});

export default AIAssistantScreen;
