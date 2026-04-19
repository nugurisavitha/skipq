import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';

/**
 * Button Component
 * Styled button with multiple variants: primary, secondary, outline, danger
 *
 * @param {string} title - Button text
 * @param {function} onPress - Callback when pressed
 * @param {string} variant - Button style: 'primary' | 'secondary' | 'outline' | 'danger' (default: 'primary')
 * @param {boolean} loading - Show loading indicator
 * @param {boolean} disabled - Disable button
 * @param {React.ReactNode} icon - Optional icon element (rendered before text)
 * @param {object} style - Additional custom styles
 */
const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const variantStyles = {
    primary: {
      bg: Colors.primary,
      text: Colors.white,
      borderColor: Colors.primary,
    },
    secondary: {
      bg: Colors.secondary,
      text: Colors.white,
      borderColor: Colors.secondary,
    },
    outline: {
      bg: 'transparent',
      text: Colors.primary,
      borderColor: Colors.primary,
    },
    danger: {
      bg: Colors.error,
      text: Colors.white,
      borderColor: Colors.error,
    },
  };

  const config = variantStyles[variant] || variantStyles.primary;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.bg,
          borderColor: config.borderColor,
        },
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={config.text}
            size="small"
            style={styles.loader}
          />
        ) : (
          <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={[styles.text, { color: config.text }]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  loader: {
    marginRight: Spacing.sm,
  },
});

export default Button;
