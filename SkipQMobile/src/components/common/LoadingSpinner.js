import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Colors } from '../../theme/colors';

/**
 * LoadingSpinner Component
 * Displays a centered loading spinner, optionally as a full-screen overlay
 *
 * @param {boolean} visible - Whether to show the spinner
 * @param {boolean} overlay - If true, displays as a full-screen overlay with backdrop
 * @param {string} size - Size of the spinner: 'small' | 'large' (default: 'large')
 * @param {string} color - Color of the spinner (default: primary color)
 */
const LoadingSpinner = ({
  visible = false,
  overlay = false,
  size = 'large',
  color = Colors.primary
}) => {
  const spinnerComponent = (
    <View style={styles.center}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );

  if (overlay) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        hardwareAccelerated
      >
        <View style={styles.overlayContainer}>
          {spinnerComponent}
        </View>
      </Modal>
    );
  }

  return visible ? spinnerComponent : null;
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;
