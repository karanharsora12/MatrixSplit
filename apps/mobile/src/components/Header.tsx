import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useWatermelonTheme } from '@/theme';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  style,
  className,
}) => {
  const { theme, typography, spacing } = useWatermelonTheme();

  return (
    <View
      className={cn(
        'flex-row items-center justify-between border-b border-border bg-background',
        className
      )}
      style={[
        {
          backgroundColor: theme.background,
          borderBottomColor: theme.divider,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
        },
        style,
      ]}
    >
      <View className="flex-1 flex-row items-center">
        {onBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            className="mr-3 h-[38px] w-[38px] items-center justify-center rounded-full bg-secondary"
            style={{ backgroundColor: theme.surface }}
          >
            <Text
              className="text-foreground"
              style={{
                color: theme.text,
                fontSize: typography.fontSize.lg,
                fontWeight: '700',
              }}
            >
              ‹
            </Text>
          </TouchableOpacity>
        )}

        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-xl font-bold tracking-tight text-foreground"
            style={{ color: theme.text, fontSize: typography.fontSize.xl }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              numberOfLines={1}
              className="mt-0.5 text-xs text-muted-foreground"
              style={{ color: theme.textMuted, fontSize: typography.fontSize.xs }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightAction && <View className="ml-3">{rightAction}</View>}
    </View>
  );
};
