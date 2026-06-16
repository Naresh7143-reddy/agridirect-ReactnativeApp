const React = require('react');
const { View } = require('react-native');

const useSharedValue = initial => ({ value: initial });
const useAnimatedStyle = fn => {
  try {
    return fn();
  } catch {
    return {};
  }
};
const useDerivedValue = fn => ({ value: fn ? fn() : undefined });
const withTiming = (toValue) => toValue;
const withSpring = (toValue) => toValue;
const withRepeat = (animation) => animation;
const withSequence = (...animations) => animations[animations.length - 1];
const withDelay = (_delay, animation) => animation;
const cancelAnimation = () => {};
const runOnJS = fn => fn;
const runOnUI = fn => fn;
const interpolate = (value) => value;
const Easing = {
  linear: x => x,
  ease: x => x,
  bezier: () => x => x,
  in: x => x,
  out: x => x,
  inOut: x => x,
};

module.exports = {
  default: {
    View,
    Text: View,
    Image: View,
    ScrollView: View,
    FlatList: View,
    createAnimatedComponent: Component => Component,
  },
  View,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  runOnJS,
  runOnUI,
  interpolate,
  Easing,
  createAnimatedComponent: Component => Component,
};
