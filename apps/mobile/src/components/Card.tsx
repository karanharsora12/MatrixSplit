import React from 'react';
import {
  View,
  Pressable,
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
  const { theme, isDark } = useWatermelonTheme();

  const paddingValue =
    padding === 'none'
      ? 0
      : padding === 'sm'
      ? 10
      : padding === 'lg'
      ? 20
      : 14;

  const cardStyle: ViewStyle = {
    backgroundColor: isDark ? '#111827' : '#FFFFFF',
    borderRadius: 16,
    padding: paddingValue,
    borderWidth: 1,
    borderColor: isDark ? '#1E293B' : '#E2E8F0',
    ...(variant === 'elevated'
      ? {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.04,
          shadowRadius: 5,
          elevation: 2,
        }
      : variant === 'flat'
      ? { borderWidth: 0 }
      : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        role="button"
        style={({ pressed }) => [
          styles.base,
          cardStyle,
          {
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
          style,
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
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
