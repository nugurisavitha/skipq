import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';

/**
 * Header Component
 * Screen header with title, back button, and optional right action
 * Uses SafeAreaView for proper iOS/Android positioning
 *
 * @param {string} title - Header title
 * @param {function} onBack - Callback when back button is pressed
 * @param {React.ReactNode} rightIcon - Optional right side icon/element
 * @param {function} onRightPress - Callback when right icon is pressed
 */
const Header = ({ title, onBack, rightIcon, onRightPress }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        <Text style={styles.title}>{title}</Text>

        {rightIcon && onRightPress ? (
          <TouchableOpacity
            style={styles.rightButton}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : (
          <View style={styles.rightButton} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.card,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  backText: {
    fontSize: 28,
    color: Colors.text,
    fontWeight: '300',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  rightButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
});

export default Header;
