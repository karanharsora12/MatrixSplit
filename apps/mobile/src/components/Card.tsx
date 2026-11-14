import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useWatermelonTheme } from '@/theme';
import { cn } from '@/lib/utils';
export {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

export interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  [key: string]: any;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  padding = 'md',
  className,
  ...rest
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

  const combinedClass = cn(
    'overflow-hidden rounded-2xl bg-card border border-border',
    variant === 'flat' && 'border-0',
    className
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        className={combinedClass}
        style={[styles.base, cardStyle, style]}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={combinedClass}
      style={[styles.base, cardStyle, style]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
