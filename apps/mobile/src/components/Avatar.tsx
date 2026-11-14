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
  const { theme, borderRadius, typography } = useWatermelonTheme();

  const dimension =
    size === 'sm' ? 32 : size === 'lg' ? 52 : size === 'xl' ? 72 : 42;
  const fontSize =
    size === 'sm'
      ? typography.fontSize.xs
      : size === 'lg'
      ? typography.fontSize.lg
      : size === 'xl'
      ? typography.fontSize['2xl']
      : typography.fontSize.base;

  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <View
      className={cn('items-center justify-center overflow-hidden border border-border/40', className)}
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: borderRadius.full,
          backgroundColor: theme.primaryLight,
          borderColor: theme.border,
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
        <Text style={[styles.initials, { color: theme.primary, fontSize }]}>
          {initials}
        </Text>
      )}
    </View>
  );
};

export interface AvatarGroupProps {
  users: { name: string; imageUrl?: string | null }[];
  max?: number;
  size?: 'sm' | 'md';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 4,
  size = 'sm',
}) => {
  const { theme, borderRadius, typography } = useWatermelonTheme();
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  const dimension = size === 'sm' ? 28 : 36;

  return (
    <View className="flex-row items-center">
      {visible.map((user, idx) => (
        <View
          key={idx}
          style={{
            marginLeft: idx === 0 ? 0 : -8,
            zIndex: max - idx,
          }}
        >
          <Avatar name={user.name} imageUrl={user.imageUrl} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={{
            width: dimension,
            height: dimension,
            borderRadius: borderRadius.full,
            backgroundColor: theme.surface,
            borderColor: theme.background,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: -8,
            zIndex: 0,
          }}
        >
          <Text
            style={{
              color: theme.textMuted,
              fontSize: typography.fontSize.xs,
              fontWeight: '700',
            }}
          >
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  initials: {
    fontWeight: '700',
  },
});
