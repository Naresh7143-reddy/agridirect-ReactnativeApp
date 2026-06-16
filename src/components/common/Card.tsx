import React, { useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  elevation?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  radius?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  padding = 16,
  elevation = 'md',
  radius,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const shadowStyle = elevation !== 'none' ? shadow[elevation] : {};
  const cardStyle: ViewStyle[] = [
    styles.card,
    shadowStyle,
    { padding, borderRadius: radius ?? borderRadius.lg },
    style ?? {},
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[cardStyle, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
});
