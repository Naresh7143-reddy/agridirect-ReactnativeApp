import React from 'react';
import {
  View as RNView,
  Text as RNText,
  Image as RNImage,
  ScrollView as RNScrollView,
  FlatList as RNFlatList,
  Animated as RNAnimated,
} from 'react-native';

export const useSharedValue = (initialValue: any) => {
  return { value: initialValue ?? 0 };
};

export const useAnimatedStyle = (updater: () => any) => {
  try {
    const res = updater();
    return res && typeof res === 'object' ? res : {};
  } catch {
    return {};
  }
};

export const useDerivedValue = (updater: () => any) => {
  try {
    const val = updater ? updater() : 0;
    return { value: val };
  } catch {
    return { value: 0 };
  }
};

export const useAnimatedProps = (updater: () => any) => {
  try {
    return updater() ?? {};
  } catch {
    return {};
  }
};

export const useAnimatedGestureHandler = () => ({});
export const useAnimatedScrollHandler = () => ({});
export const useAnimatedRef = () => ({ current: null });
export const useWorkletCallback = (fn: any) => fn;

export const runOnJS = (fn: any) => {
  return (...args: any[]) => {
    if (typeof fn === 'function') {
      try { fn(...args); } catch {}
    }
  };
};

export const runOnUI = (fn: any) => {
  return (...args: any[]) => {
    if (typeof fn === 'function') {
      try { fn(...args); } catch {}
    }
  };
};

export const ReduceMotion = {
  System: 'system',
  Always: 'always',
  Never: 'never',
};

export const interpolate = (val: any, _input: number[], output: number[]) => {
  const raw = typeof val === 'number' ? val : (val && typeof val === 'object' && 'value' in val ? val.value : 0);
  if (Array.isArray(output) && output.length > 0) {
    return output[0];
  }
  return typeof raw === 'number' ? raw : 0;
};

export const interpolateColor = (_val: any, _input: number[], output: string[]) => {
  if (Array.isArray(output) && output.length > 0) {
    return output[0];
  }
  return '#000000';
};

export const withRepeat = (anim: any, _numberOfReps?: number, _reverse?: boolean, _callback?: any) => anim;
export const withSequence = (...anims: any[]) => anims[0] ?? 0;
export const withTiming = (toValue: any, _config?: any, _callback?: any) => toValue;
export const withSpring = (toValue: any, _config?: any, _callback?: any) => toValue;
export const withDelay = (_delay: number, anim: any, _config?: any) => anim;
export const withDecay = (toValue: any, _config?: any) => toValue;
export const cancelAnimation = () => {};

export const Easing = {
  bezier: () => (t: number) => t,
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t,
  cubic: (t: number) => t,
  poly: () => (t: number) => t,
  sin: (t: number) => t,
  circle: (t: number) => t,
  exp: (t: number) => t,
  elastic: () => (t: number) => t,
  back: () => (t: number) => t,
  bounce: (t: number) => t,
  in: (fn: any) => fn,
  out: (fn: any) => fn,
  inOut: (fn: any) => fn,
};

export const FadeIn = { duration: () => FadeIn, springify: () => FadeIn, delay: () => FadeIn };
export const FadeInDown = { duration: () => FadeInDown, springify: () => FadeInDown, delay: () => FadeInDown };
export const FadeInUp = { duration: () => FadeInUp, springify: () => FadeInUp, delay: () => FadeInUp };
export const FadeInLeft = { duration: () => FadeInLeft, springify: () => FadeInLeft, delay: () => FadeInLeft };
export const FadeInRight = { duration: () => FadeInRight, springify: () => FadeInRight, delay: () => FadeInRight };
export const FadeOut = { duration: () => FadeOut, delay: () => FadeOut };
export const Layout = { duration: () => Layout, springify: () => Layout };
export const ZoomIn = { duration: () => ZoomIn };
export const ZoomOut = { duration: () => ZoomOut };
export const SlideInRight = { duration: () => SlideInRight };
export const SlideOutLeft = { duration: () => SlideOutLeft };

export const createAnimatedComponent = (Component: any) => Component || RNView;

const AnimatedView = RNAnimated.View || RNView;
const AnimatedText = RNAnimated.Text || RNText;
const AnimatedImage = RNAnimated.Image || RNImage;
const AnimatedScrollView = RNAnimated.ScrollView || RNScrollView;
const AnimatedFlatList = RNAnimated.FlatList || RNFlatList;

const ReanimatedObj: any = {
  View: AnimatedView,
  Text: AnimatedText,
  Image: AnimatedImage,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  Value: RNAnimated.Value,
  event: RNAnimated.event,
  add: RNAnimated.add,
  multiply: RNAnimated.multiply,
  createAnimatedComponent,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedProps,
  interpolate,
  interpolateColor,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  withDecay,
  Easing,
  runOnJS,
  runOnUI,
  ReduceMotion,
};

export default ReanimatedObj;
