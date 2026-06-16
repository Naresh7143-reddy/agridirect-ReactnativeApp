import React, { useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

interface SizeConfig {
  paddingVertical: number;
  paddingHorizontal: number;
  minHeight: number;
  textStyle: TextStyle;
  iconSize: number;
}

const SIZE_CONFIG: Record<ButtonSize, SizeConfig> = {
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    textStyle: typography.button.sm,
    iconSize: 16,
  },
  md: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
    textStyle: typography.button.md,
    iconSize: 20,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    minHeight: 56,
    textStyle: typography.button.lg,
    iconSize: 24,
  },
};

interface VariantConfig {
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  textColor: string;
  spinnerColor: string;
  gradient?: [string, string, ...string[]];
  disabledBg?: string;
}

const VARIANT_CONFIG: Record<ButtonVariant, VariantConfig> = {
  primary: {
    gradient: Colors.gradientGreen,
    textColor: Colors.white,
    spinnerColor: Colors.white,
    disabledBg: Colors.border,
  },
  secondary: {
    backgroundColor: Colors.secondary,
    textColor: Colors.textPrimary,
    spinnerColor: Colors.textPrimary,
    disabledBg: Colors.border,
  },
  ghost: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    textColor: Colors.primary,
    spinnerColor: Colors.primary,
    disabledBg: Colors.transparent,
  },
  destructive: {
    backgroundColor: Colors.error,
    textColor: Colors.white,
    spinnerColor: Colors.white,
    disabledBg: Colors.border,
  },
};

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;
  const sizeConfig = SIZE_CONFIG[size];
  const variantConfig = VARIANT_CONFIG[variant];

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      minHeight: sizeConfig.minHeight,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
    },
    variantConfig.borderWidth
      ? { borderWidth: variantConfig.borderWidth, borderColor: variantConfig.borderColor }
      : {},
    !variantConfig.gradient
      ? { backgroundColor: isDisabled ? variantConfig.disabledBg : variantConfig.backgroundColor }
      : {},
    fullWidth ? styles.fullWidth : {},
    isDisabled ? styles.disabled : {},
    style ?? {},
  ];

  const innerContent = (
    <View style={styles.inner}>
      {loading ? (
        <>
          <ActivityIndicator
            color={variantConfig.spinnerColor}
            size="small"
            style={styles.spinner}
          />
          <Text style={[sizeConfig.textStyle, { color: variantConfig.textColor }, textStyle]}>
            {children}
          </Text>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[sizeConfig.textStyle, { color: variantConfig.textColor }, textStyle]}>
            {children}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignSelf: fullWidth ? 'stretch' : 'flex-start' }}>
        {variantConfig.gradient && !isDisabled ? (
          <LinearGradient
            colors={variantConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={containerStyle}
          >
            {innerContent}
          </LinearGradient>
        ) : (
          <View style={containerStyle}>{innerContent}</View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  spinner: {
    marginRight: spacing.xs,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
