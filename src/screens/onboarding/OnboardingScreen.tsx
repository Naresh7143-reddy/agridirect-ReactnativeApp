/**
 * OnboardingScreen
 *
 * Three slides in a paging FlatList:
 *  1. "Fresh from the Farm"    — Lottie tractor + Reanimated floating veggies
 *  2. "Order in Seconds"       — spring phone mockup + SVG route line + bounce box
 *  3. "Support Local Farmers"  — counter 0→12000 + India map dots
 *
 * Controls:
 *  - Animated dot indicators (active dot expands width)
 *  - Skip (top-right)
 *  - Next / Get Started (bottom CTA)
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  ListRenderItemInfo,
  ImageBackground,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

import { Colors } from '../../theme/colors';
import { setOnboardingDone } from '../../utils/storage';
import type { AuthScreenProps } from '../../types/navigation';

const { width: W, height: H } = Dimensions.get('window');

// ─── Slide data ───────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: 'fresh',
    title: 'Fresh from\nthe Farm',
    subtitle:
      'Get vegetables, fruits and grains harvested today — delivered straight to your doorstep.',
  },
  {
    id: 'order',
    title: 'Order in\nSeconds',
    subtitle:
      'Browse hundreds of fresh products, pick what you love, and checkout in just a few taps.',
  },
  {
    id: 'support',
    title: 'Support Local\nFarmers',
    subtitle:
      'Every purchase goes directly to the farmer — no middlemen, fair prices, real impact.',
  },
];

// ─── Floating veggie (Slide 1) ────────────────────────────────────────────────

const VEGGIES = ['🥦', '🥕', '🍅', '🌽', '🥬', '🍆'];

const FloatingVeggie: React.FC<{ emoji: string; index: number }> = ({
  emoji,
  index,
}) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const x = useMemo(() => (W / VEGGIES.length) * index + 20, [index]);
  const y = useMemo(() => H * 0.25 + (index % 3) * 60, [index]);
  const baseDelay = index * 220;

  useEffect(() => {
    translateY.value = withDelay(
      baseDelay,
      withRepeat(
        withSequence(
          withTiming(-18, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    translateX.value = withDelay(
      baseDelay + 400,
      withRepeat(
        withSequence(
          withTiming(8, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    rotate.value = withDelay(
      baseDelay,
      withRepeat(
        withSequence(
          withTiming(12, { duration: 2000 }),
          withTiming(-12, { duration: 2000 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Reanimated.View style={[{ position: 'absolute', left: x, top: y }, animStyle]}>
      <Text style={{ fontSize: 32 }}>{emoji}</Text>
    </Reanimated.View>
  );
};

// ─── Phone mockup (Slide 2) ───────────────────────────────────────────────────

const PhoneMockup: React.FC = () => {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  // delivery box bounce
  const boxY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phone springs in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Box bounces continuously
    Animated.loop(
      Animated.sequence([
        Animated.timing(boxY, { toValue: -10, duration: 400, useNativeDriver: true }),
        Animated.timing(boxY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        slide2Styles.phoneWrapper,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {/* Phone body */}
      <View style={slide2Styles.phone}>
        {/* Screen content mock */}
        <View style={slide2Styles.screenRow}>
          <View style={slide2Styles.screenBlock} />
          <View style={[slide2Styles.screenBlock, { width: 50, backgroundColor: Colors.accent + '60' }]} />
        </View>
        <View style={[slide2Styles.screenRow, { marginTop: 8 }]}>
          <View style={[slide2Styles.screenBlock, { width: 90 }]} />
        </View>
        {/* SVG route line */}
        <Svg height={60} width={120} style={{ marginTop: 12 }}>
          <Path
            d="M 10 50 Q 60 10 110 50"
            stroke={Colors.primary}
            strokeWidth={2.5}
            strokeDasharray="4 3"
            fill="none"
          />
          <Circle cx={10} cy={50} r={5} fill={Colors.primary} />
          <Circle cx={110} cy={50} r={5} fill={Colors.secondary} />
        </Svg>
      </View>

      {/* Bouncing delivery box */}
      <Animated.View
        style={[slide2Styles.box, { transform: [{ translateY: boxY }] }]}
      >
        <Text style={{ fontSize: 28 }}>📦</Text>
      </Animated.View>
    </Animated.View>
  );
};

const slide2Styles = StyleSheet.create({
  phoneWrapper: { alignItems: 'center', marginBottom: 16 },
  phone: {
    width: 160,
    height: 260,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.primary,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  screenRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  screenBlock: {
    height: 12,
    width: 60,
    borderRadius: 6,
    backgroundColor: Colors.divider,
  },
  box: { marginTop: -20, alignSelf: 'flex-end', marginRight: 20 },
});

// ─── Animated counter (Slide 3) ───────────────────────────────────────────────

const AnimatedCounter: React.FC<{ target: number; duration?: number }> = ({
  target,
  duration = 2000,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const step = Math.ceil(target / (duration / 16));
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);

  return (
    <Text style={counterStyles.number}>
      {count.toLocaleString('en-IN')}+
    </Text>
  );
};

const counterStyles = StyleSheet.create({
  number: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.secondary,
    letterSpacing: -1,
  },
});

// ─── India map dots (Slide 3) ─────────────────────────────────────────────────

// Simplified dot positions (normalised 0-1, mapped to container dims)
const MAP_DOTS = [
  { x: 0.35, y: 0.28 }, { x: 0.55, y: 0.22 }, { x: 0.72, y: 0.35 },
  { x: 0.48, y: 0.45 }, { x: 0.30, y: 0.55 }, { x: 0.60, y: 0.52 },
  { x: 0.45, y: 0.65 }, { x: 0.50, y: 0.78 }, { x: 0.38, y: 0.38 },
  { x: 0.65, y: 0.68 }, { x: 0.25, y: 0.42 }, { x: 0.70, y: 0.48 },
];

const MAP_W = W * 0.55;
const MAP_H = 180;

const IndiaMapDots: React.FC = () => {
  const pulses = useRef(MAP_DOTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anims = pulses.map((p, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.sequence([
            Animated.timing(p, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(p, { toValue: 0, duration: 900, useNativeDriver: true }),
          ]),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ width: MAP_W, height: MAP_H }}>
      {MAP_DOTS.map((dot, i) => {
        const scale = pulses[i].interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
        const opacity = pulses[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 0.5, 0] });
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: dot.x * MAP_W - 6,
              top: dot.y * MAP_H - 6,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Pulse ring */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: Colors.secondary,
                opacity,
                transform: [{ scale }],
              }}
            />
            {/* Solid dot */}
            <View style={mapStyles.dot} />
          </View>
        );
      })}
    </View>
  );
};

const mapStyles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
});

// ─── Individual slide renderers ───────────────────────────────────────────────

const Slide1: React.FC = () => (
  <View style={[slideStyles.slide, { backgroundColor: Colors.primary }]}>
    <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

    {/* Floating veggies */}
    {VEGGIES.map((v, i) => (
      <FloatingVeggie key={v} emoji={v} index={i} />
    ))}

    {/* Lottie tractor */}
    <LottieView
      source={require('../../assets/lottie/tractor.json')}
      style={slideStyles.lottie}
      autoPlay
      loop
      speed={0.8}
    />

    {/* Bottom gradient overlay */}
    <LinearGradient
      colors={['transparent', Colors.primary]}
      style={slideStyles.gradient}
    />

    {/* Text block at bottom */}
    <View style={slideStyles.textBlock}>
      <Text style={slideStyles.titleLight}>{SLIDES[0].title}</Text>
      <Text style={slideStyles.subtitleLight}>{SLIDES[0].subtitle}</Text>
    </View>
  </View>
);

const Slide2: React.FC = () => (
  <View style={[slideStyles.slide, { backgroundColor: Colors.background }]}>
    <View style={slideStyles.centerContent}>
      <PhoneMockup />
    </View>
    <View style={slideStyles.textBlockDark}>
      <Text style={slideStyles.titleDark}>{SLIDES[1].title}</Text>
      <Text style={slideStyles.subtitleDark}>{SLIDES[1].subtitle}</Text>
    </View>
  </View>
);

const Slide3: React.FC = () => (
  <View style={[slideStyles.slide, { backgroundColor: Colors.background }]}>
    <View style={slideStyles.centerContent}>
      {/* Counter */}
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4 }}>
          Farmers on AgriDirect
        </Text>
        <AnimatedCounter target={12000} duration={2200} />
      </View>

      {/* India map dots */}
      <IndiaMapDots />
    </View>

    <View style={slideStyles.textBlockDark}>
      <Text style={slideStyles.titleDark}>{SLIDES[2].title}</Text>
      <Text style={slideStyles.subtitleDark}>{SLIDES[2].subtitle}</Text>
    </View>
  </View>
);

const SLIDE_COMPONENTS = [Slide1, Slide2, Slide3];

const slideStyles = StyleSheet.create({
  slide: { width: W, height: H, overflow: 'hidden' },
  lottie: {
    position: 'absolute',
    top: H * 0.05,
    alignSelf: 'center',
    width: W * 0.9,
    height: H * 0.5,
    opacity: 0.6,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.45,
  },
  textBlock: {
    position: 'absolute',
    bottom: 160,
    left: 32,
    right: 32,
  },
  textBlockDark: {
    position: 'absolute',
    bottom: 160,
    left: 32,
    right: 32,
  },
  titleLight: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 44,
    marginBottom: 12,
  },
  titleDark: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitleLight: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
  },
  subtitleDark: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});

// ─── Dot indicators ───────────────────────────────────────────────────────────

const DOT_BASE = 8;
const DOT_ACTIVE_W = 28;
const DOT_GAP = 6;

const DotIndicator: React.FC<{ count: number; activeIndex: number; light?: boolean }> = ({
  count,
  activeIndex,
  light = false,
}) => {
  const widths = useRef(
    Array.from({ length: count }, (_, i) =>
      new Animated.Value(i === 0 ? DOT_ACTIVE_W : DOT_BASE),
    ),
  ).current;

  useEffect(() => {
    widths.forEach((w, i) => {
      Animated.spring(w, {
        toValue: i === activeIndex ? DOT_ACTIVE_W : DOT_BASE,
        friction: 7,
        useNativeDriver: false,
      }).start();
    });
  }, [activeIndex]);

  return (
    <View style={dotStyles.row}>
      {widths.map((w, i) => (
        <Animated.View
          key={i}
          style={[
            dotStyles.dot,
            {
              width: w,
              backgroundColor:
                i === activeIndex
                  ? light ? Colors.white : Colors.primary
                  : light ? 'rgba(255,255,255,0.35)' : Colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
};

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: DOT_GAP },
  dot: { height: 8, borderRadius: 4 },
});

// ─── Main component ───────────────────────────────────────────────────────────

type Props = AuthScreenProps<'Onboarding'>;

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLightSlide = activeIndex === 0; // Slide 1 has dark bg, rest light

  // ── Navigation ─────────────────────────────────────────────────────────────

  const finish = useCallback(() => {
    setOnboardingDone();
    navigation.replace('AuthChoice');
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      finish();
    }
  }, [activeIndex, finish]);

  const handleSkip = useCallback(() => finish(), [finish]);

  // ── Render slide ───────────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Slide>) => {
    const SlideComponent = SLIDE_COMPONENTS[SLIDES.indexOf(item)];
    return <SlideComponent />;
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / W);
      setActiveIndex(idx);
    },
    [],
  );

  // ── CTA button label ───────────────────────────────────────────────────────

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={onMomentumScrollEnd}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: W,
          offset: W * index,
          index,
        })}
      />

      {/* ── Skip button (top right) ─────────────────────────────────────── */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.skipText, isLightSlide && styles.skipTextLight]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Bottom controls ──────────────────────────────────────────────── */}
      <View style={[styles.controls, isLightSlide && styles.controlsLight]}>
        <DotIndicator
          count={SLIDES.length}
          activeIndex={activeIndex}
          light={isLightSlide}
        />

        <TouchableOpacity
          style={[styles.ctaBtn, isLightSlide && styles.ctaBtnLight]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, isLightSlide && styles.ctaTextLight]}>
            {isLast ? 'Get Started' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skipBtn: {
    position: 'absolute',
    top: 52,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  skipTextLight: { color: 'rgba(255,255,255,0.8)' },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 20,
  },
  controlsLight: {
    // Slide 1 has dark bg — transparent controls look good
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaBtnLight: {
    backgroundColor: Colors.white,
  },
  ctaText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  ctaTextLight: { color: Colors.primary },
});

export default OnboardingScreen;
