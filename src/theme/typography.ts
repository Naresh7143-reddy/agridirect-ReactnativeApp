import { Platform, TextStyle } from 'react-native';

// Font family configuration
// Requires react-native-font or manual linking of Poppins, Inter, SpaceGrotesk
const Fonts = {
  poppins: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
    extraBold: 'Poppins-ExtraBold',
  },
  inter: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  spaceGrotesk: {
    regular: 'SpaceGrotesk-Regular',
    medium: 'SpaceGrotesk-Medium',
    bold: 'SpaceGrotesk-Bold',
  },
  // Fallbacks when custom fonts aren't loaded yet
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  })!,
};

// Font size scale
export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
} as const;

// Line heights (absolute px values)
export const LineHeight = {
  xs: 14,
  sm: 18,
  md: 21,
  lg: 24,
  xl: 27,
  '2xl': 30,
  '3xl': 36,
  '4xl': 44,
} as const;

// Letter spacing
export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1.2,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

// --- Named text styles ---

// Headlines — Poppins Bold
export const Heading: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', TextStyle> = {
  h1: {
    fontFamily: Fonts.poppins.bold,
    fontSize: FontSize['4xl'],
    lineHeight: LineHeight['4xl'],
    letterSpacing: LetterSpacing.tight,
    fontWeight: '700',
  },
  h2: {
    fontFamily: Fonts.poppins.bold,
    fontSize: FontSize['3xl'],
    lineHeight: LineHeight['3xl'],
    letterSpacing: LetterSpacing.tight,
    fontWeight: '700',
  },
  h3: {
    fontFamily: Fonts.poppins.semiBold,
    fontSize: FontSize['2xl'],
    lineHeight: LineHeight['2xl'],
    letterSpacing: LetterSpacing.normal,
    fontWeight: '600',
  },
  h4: {
    fontFamily: Fonts.poppins.semiBold,
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
    letterSpacing: LetterSpacing.normal,
    fontWeight: '600',
  },
  h5: {
    fontFamily: Fonts.poppins.semiBold,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    letterSpacing: LetterSpacing.normal,
    fontWeight: '600',
  },
  h6: {
    fontFamily: Fonts.poppins.medium,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    letterSpacing: LetterSpacing.normal,
    fontWeight: '500',
  },
};

// Body — Inter
export const Body: Record<'large' | 'medium' | 'small' | 'xs', TextStyle> = {
  large: {
    fontFamily: Fonts.inter.regular,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.xl,
    fontWeight: '400',
  },
  medium: {
    fontFamily: Fonts.inter.regular,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: '400',
  },
  small: {
    fontFamily: Fonts.inter.regular,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: '400',
  },
  xs: {
    fontFamily: Fonts.inter.regular,
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    fontWeight: '400',
  },
};

// Labels — Inter Medium
export const Label: Record<'large' | 'medium' | 'small', TextStyle> = {
  large: {
    fontFamily: Fonts.inter.medium,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    fontWeight: '500',
  },
  medium: {
    fontFamily: Fonts.inter.medium,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: '500',
  },
  small: {
    fontFamily: Fonts.inter.medium,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: '500',
  },
};

// Prices & numbers — Space Grotesk Bold
export const Price: Record<'large' | 'medium' | 'small', TextStyle> = {
  large: {
    fontFamily: Fonts.spaceGrotesk.bold,
    fontSize: FontSize['2xl'],
    lineHeight: LineHeight['2xl'],
    letterSpacing: LetterSpacing.tight,
    fontWeight: '700',
  },
  medium: {
    fontFamily: Fonts.spaceGrotesk.bold,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    letterSpacing: LetterSpacing.tight,
    fontWeight: '700',
  },
  small: {
    fontFamily: Fonts.spaceGrotesk.medium,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: '500',
  },
};

// Button text
export const ButtonText: Record<'sm' | 'md' | 'lg', TextStyle> = {
  sm: {
    fontFamily: Fonts.poppins.semiBold,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    letterSpacing: LetterSpacing.wide,
    fontWeight: '600',
  },
  md: {
    fontFamily: Fonts.poppins.semiBold,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    letterSpacing: LetterSpacing.wide,
    fontWeight: '600',
  },
  lg: {
    fontFamily: Fonts.poppins.semiBold,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    letterSpacing: LetterSpacing.wide,
    fontWeight: '600',
  },
};

// Caption & overline
export const Caption: TextStyle = {
  fontFamily: Fonts.inter.regular,
  fontSize: FontSize.xs,
  lineHeight: LineHeight.xs,
  fontWeight: '400',
};

export const Overline: TextStyle = {
  fontFamily: Fonts.inter.medium,
  fontSize: FontSize.xs,
  lineHeight: LineHeight.xs,
  letterSpacing: LetterSpacing.widest,
  fontWeight: '500',
  textTransform: 'uppercase',
};

export const typography = {
  fonts: Fonts,
  fontSize: FontSize,
  lineHeight: LineHeight,
  letterSpacing: LetterSpacing,
  fontWeight: FontWeight,
  heading: Heading,
  body: Body,
  label: Label,
  price: Price,
  button: ButtonText,
  caption: Caption,
  overline: Overline,
} as const;
