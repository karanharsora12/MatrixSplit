import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { useWatermelonTheme } from '../theme/ThemeContext';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { theme, borderRadius, typography, spacing } = useWatermelonTheme();

  // Resolve background and border styles
  let bgColor = theme.primary;
  let textColor = '#FFFFFF';
  let borderWidth = 0;
  let borderColor = 'transparent';

  if (variant === 'secondary') {
    bgColor = theme.secondary;
    textColor = '#FFFFFF';
  } else if (variant === 'outline') {
    bgColor = 'transparent';
    textColor = theme.text;
    borderWidth = 1.5;
    borderColor = theme.border;
  } else if (variant === 'ghost') {
    bgColor = 'transparent';
    textColor = theme.primary;
  } else if (variant === 'danger') {
    bgColor = theme.negative;
    textColor = '#FFFFFF';
  }

  // Resolve sizing
  let paddingVertical = spacing.md;
  let paddingHorizontal = spacing.lg;
  let fontSize = typography.fontSize.base;

  if (size === 'sm') {
    paddingVertical = spacing.xs + 2;
    paddingHorizontal = spacing.md;
    fontSize = typography.fontSize.sm;
  } else if (size === 'lg') {
    paddingVertical = spacing.base;
    paddingHorizontal = spacing.xl;
    fontSize = typography.fontSize.lg;
  }

  const containerStyle: ViewStyle = {
    backgroundColor: disabled ? theme.border : bgColor,
    borderRadius: borderRadius.md,
    borderWidth,
    borderColor: disabled ? 'transparent' : borderColor,
    paddingVertical,
    paddingHorizontal,
    opacity: disabled ? 0.6 : 1,
  };

  const labelStyle: TextStyle = {
    color: disabled ? theme.textMuted : textColor,
    fontSize,
    fontWeight: '600',
    textAlign: 'center',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, containerStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[labelStyle, textStyle]}>{label}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
