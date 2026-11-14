import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { useWatermelonTheme } from '@/theme';
import { cn } from '@/lib/utils';
export { buttonVariants, buttonTextVariants } from './ui/button';

export interface ButtonProps {
  label?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'destructive'
    | 'default';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  className?: string;
  [key: string]: any;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  className,
  ...rest
}) => {
  const { theme, borderRadius, typography, spacing } = useWatermelonTheme();

  // Normalize variant names
  const normVariant =
    variant === 'primary' || variant === 'default'
      ? 'primary'
      : variant === 'danger' || variant === 'destructive'
      ? 'destructive'
      : variant;

  let bgColor = theme.primary;
  let textColor = '#FFFFFF';
  let borderWidth = 0;
  let borderColor = 'transparent';

  if (normVariant === 'secondary') {
    bgColor = theme.secondary;
    textColor = '#FFFFFF';
  } else if (normVariant === 'outline') {
    bgColor = 'transparent';
    textColor = theme.text;
    borderWidth = 1.5;
    borderColor = theme.border;
  } else if (normVariant === 'ghost') {
    bgColor = 'transparent';
    textColor = theme.primary;
  } else if (normVariant === 'destructive') {
    bgColor = theme.negative;
    textColor = '#FFFFFF';
  }

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
  };

  const labelStyle: TextStyle = {
    color: disabled ? theme.textMuted : textColor,
    fontSize,
    fontWeight: '600',
    textAlign: 'center',
  };

  const tailwindClasses = cn(
    'flex-row items-center justify-center rounded-xl',
    className
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={tailwindClasses}
      style={({ pressed }) => [
        containerStyle,
        { opacity: disabled ? 0.6 : pressed ? 0.8 : 1 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : children ? (
        children
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && iconPosition === 'left' && <View className="mr-2">{icon}</View>}
          <Text style={[labelStyle, textStyle]}>{label}</Text>
          {icon && iconPosition === 'right' && <View className="ml-2">{icon}</View>}
        </View>
      )}
    </Pressable>
  );
};
