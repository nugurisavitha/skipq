import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../theme/colors';

const LoadingSpinner = ({ size = 'medium', color, style }) => {
  const sizeMap = {
    small: 30,
    medium: 50,
    large: 70,
  };

  const spinnerColor = color || Colors.primary;

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator
        size="small"
        color={spinnerColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;
