import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useWatermelonTheme } from '@/theme/ThemeContext';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  const { theme, borderRadius, typography, spacing } = useWatermelonTheme();

  return (
    <View style={[styles.container, style]} className="items-center justify-center py-10 px-6">
      {icon && (
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: theme.primaryLight,
              borderRadius: borderRadius.full,
              marginBottom: spacing.base,
            },
          ]}
          className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4"
        >
          {icon}
        </View>
      )}

      <Text
        style={[
          styles.title,
          {
            color: theme.text,
            fontSize: typography.fontSize.lg,
          },
        ]}
        className="text-lg font-bold text-foreground text-center"
      >
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          {
            color: theme.textMuted,
            fontSize: typography.fontSize.sm,
            marginTop: spacing.xs,
            marginBottom: spacing.lg,
          },
        ]}
        className="text-sm text-muted-foreground text-center mt-1.5 mb-6"
      >
        {description}
      </Text>

      {actionLabel && onAction && (
        <Button variant="default" onPress={onAction}>
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
