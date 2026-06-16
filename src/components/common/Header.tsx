import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightActions?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
  titleCenter?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  rightActions,
  transparent = false,
  style,
  titleCenter = true,
}) => {
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 0;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: statusBarHeight },
        transparent && styles.transparent,
        style,
      ]}
    >
      <View style={styles.row}>
        {/* Left */}
        <View style={styles.side}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <Text
          style={[styles.title, titleCenter && styles.titleCenter]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        {/* Right */}
        <View style={[styles.side, styles.right]}>{rightActions}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.base,
  },
  side: {
    width: 60,
  },
  right: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    ...typography.heading.h6,
    color: Colors.textPrimary,
  },
  titleCenter: {
    textAlign: 'center',
  },
  backBtn: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
});
