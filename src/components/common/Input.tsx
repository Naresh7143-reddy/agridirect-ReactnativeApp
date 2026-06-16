import React, { useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Platform,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  required?: boolean;
}

const LABEL_ACTIVE_TOP = -10;
const LABEL_INACTIVE_TOP = 14;
const LABEL_ACTIVE_SIZE = 11;
const LABEL_INACTIVE_SIZE = 14;

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  secureTextEntry,
  containerStyle,
  required,
  value,
  defaultValue,
  onFocus,
  onBlur,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry ?? false);
  const [hasValue, setHasValue] = useState(
    Boolean(value || defaultValue || props.placeholder),
  );

  // Floating label animation
  const labelAnim = useRef(
    new Animated.Value(hasValue || Boolean(value) ? 1 : 0),
  ).current;

  const animateLabel = (toValue: number) => {
    Animated.timing(labelAnim, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setIsFocused(true);
    animateLabel(1);
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setIsFocused(false);
    if (!hasValue) animateLabel(0);
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setHasValue(text.length > 0);
    if (text.length > 0) animateLabel(1);
    onChangeText?.(text);
  };

  // Interpolated label styles
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [LABEL_INACTIVE_TOP, LABEL_ACTIVE_TOP],
  });
  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [LABEL_INACTIVE_SIZE, LABEL_ACTIVE_SIZE],
  });
  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.textHint, error ? Colors.error : Colors.primary],
  });

  // Border & background logic
  const borderColor = error
    ? Colors.error
    : isFocused
    ? Colors.primary
    : Colors.border;

  // Neumorphic inset shadow when focused
  const inputBg = isFocused ? Colors.neumorphicInsetBg : Colors.surface;
  const insetShadow: ViewStyle =
    isFocused && !error
      ? Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          },
          android: { elevation: 0 },
          default: {},
        }) ?? {}
      : {};

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.inputWrapper,
          { borderColor, backgroundColor: inputBg },
          insetShadow,
        ]}
      >
        {/* Floating label */}
        {label && (
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: labelColor,
                left: leftIcon ? spacing['5'] + spacing['3'] : spacing.base,
              },
            ]}
            numberOfLines={1}
          >
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Animated.Text>
        )}

        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          {...props}
          value={value}
          defaultValue={defaultValue}
          style={[
            styles.input,
            label ? styles.inputWithLabel : {},
            leftIcon ? { paddingLeft: spacing.xs } : {},
          ]}
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          placeholderTextColor={label ? Colors.transparent : Colors.textHint}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setIsSecure(s => !s)}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.toggleText}>{isSecure ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    minHeight: 56,
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    paddingHorizontal: 4,
    zIndex: 1,
    ...typography.body.small,
  },
  input: {
    flex: 1,
    ...typography.body.medium,
    color: Colors.textPrimary,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
  },
  inputWithLabel: {
    paddingTop: spacing.base,
  },
  leftIcon: {
    paddingLeft: spacing.base,
    justifyContent: 'center',
  },
  rightIcon: {
    paddingRight: spacing.base,
    justifyContent: 'center',
  },
  required: {
    color: Colors.error,
  },
  toggleText: {
    ...typography.label.small,
    color: Colors.primary,
  },
  errorText: {
    ...typography.caption,
    color: Colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  hintText: {
    ...typography.caption,
    color: Colors.textHint,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
