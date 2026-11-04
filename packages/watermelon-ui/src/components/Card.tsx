import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useWatermelonTheme } from '../theme/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  padding = 'md',
}) => {
  const { theme, borderRadius, shadows, spacing } = useWatermelonTheme();

  const paddingValue =
    padding === 'none'
      ? 0
      : padding === 'sm'
      ? spacing.sm
      : padding === 'lg'
      ? spacing.xl
      : spacing.base;

  const cardStyle: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: borderRadius.lg,
    padding: paddingValue,
    ...(variant === 'elevated' ? shadows.card : {}),
    ...(variant === 'outlined'
      ? { borderWidth: 1, borderColor: theme.border }
      : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.base, cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.base, cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
