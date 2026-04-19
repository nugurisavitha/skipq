import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme/colors';

/**
 * Card Component
 * Elevated card wrapper with shadow, padding, and rounded corners
 * Can be interactive with onPress handler
 *
 * @param {React.ReactNode} children - Card content
 * @param {object} style - Additional custom styles
 * @param {function} onPress - Optional callback when card is pressed
 */
const Card = ({ children, style, onPress }) => {
  const containerStyle = [styles.card, style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderColor: Colors.border,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});

export default Card;
