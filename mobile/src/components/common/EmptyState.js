import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme/colors';
import Button from './Button';

/**
 * EmptyState Component
 * Displays an icon, title, subtitle, and optional action button
 * Useful for empty lists, no results screens, etc.
 *
 * @param {React.ReactNode} icon - Icon component or element
 * @param {string} title - Main heading
 * @param {string} subtitle - Descriptive subtitle
 * @param {string} actionLabel - Label for action button (optional)
 * @param {function} onAction - Callback when action button is pressed
 */
const EmptyState = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}

      <Text style={styles.title}>{title}</Text>

      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}

      {actionLabel && onAction && (
        <View style={styles.buttonContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 21,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
    minWidth: 150,
  },
});

export default EmptyState;
