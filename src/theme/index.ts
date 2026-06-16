export { Colors, OrderStatusColors } from './colors';
export type { ColorKey } from './colors';

export {
  typography,
  FontSize,
  LineHeight,
  LetterSpacing,
  FontWeight,
  Heading,
  Body,
  Label,
  Price,
  ButtonText,
  Caption,
  Overline,
} from './typography';

export { spacing, borderRadius, shadow, neumorphicInset } from './spacing';
export type { SpacingKey, BorderRadiusKey, ShadowKey } from './spacing';

import { Colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadow } from './spacing';

export const theme = {
  colors: Colors,
  typography,
  spacing,
  borderRadius,
  shadow,
} as const;

export type Theme = typeof theme;
