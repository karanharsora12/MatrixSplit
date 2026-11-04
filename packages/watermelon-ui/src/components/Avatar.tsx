import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useWatermelonTheme } from '../theme/ThemeContext';

export interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  style,
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
      {imageUrl ? (
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
    <View style={styles.groupContainer}>
      {visible.map((user, idx) => (
        <View
          key={idx}
          style={[
            styles.avatarOverlap,
            { marginLeft: idx === 0 ? 0 : -8, zIndex: max - idx },
          ]}
        >
          <Avatar name={user.name} imageUrl={user.imageUrl} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.avatarOverlap,
            styles.remainingBadge,
            {
              width: dimension,
              height: dimension,
              borderRadius: borderRadius.full,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              marginLeft: -8,
              zIndex: 0,
            },
          ]}
        >
          <Text
            style={{
              color: theme.textMuted,
              fontSize: typography.fontSize.xs,
              fontWeight: '600',
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
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  initials: {
    fontWeight: '700',
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 9999,
  },
  remainingBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
