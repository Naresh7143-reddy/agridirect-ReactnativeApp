import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { Colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  transparent = false,
}) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
    <View style={[styles.overlay, transparent && styles.transparent]}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 120,
  },
  message: {
    ...typography.body.small,
    color: Colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
