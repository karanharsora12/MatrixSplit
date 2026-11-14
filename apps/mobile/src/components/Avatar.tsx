import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useWatermelonTheme } from '@/theme';
import { cn } from '@/lib/utils';
export { AvatarImage, AvatarFallback } from './ui/avatar';

export interface AvatarProps {
  name?: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  style,
  className,
  children,
}) => {
  const { theme, isDark } = useWatermelonTheme();

  const dimension =
    size === 'sm' ? 32 : size === 'lg' ? 52 : size === 'xl' ? 72 : 42;
  const fontSize =
    size === 'sm' ? 12 : size === 'lg' ? 18 : size === 'xl' ? 24 : 14;

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#D1FAE5',
          borderColor: isDark ? 'rgba(16,185,129,0.25)' : '#A7F3D0',
        },
        style,
      ]}
    >
      {children ? (
        children
      ) : imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              color: isDark ? '#34D399' : '#059669',
              fontSize,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
