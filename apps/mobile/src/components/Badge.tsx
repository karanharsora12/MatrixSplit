import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useWatermelonTheme } from '@/theme';
import { cn } from '@/lib/utils';
export { badgeVariants } from './ui/badge';

export interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?:
    | 'positive'
    | 'negative'
    | 'neutral'
    | 'warning'
    | 'info'
    | 'primary'
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  children,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle,
  className,
}) => {
  const { theme, borderRadius, typography, spacing } = useWatermelonTheme();

  let bgColor = theme.neutralBg;
  let textColor = theme.neutral;
  let borderColor = theme.neutralBorder;

  if (variant === 'positive') {
    bgColor = theme.positiveBg;
    textColor = theme.positive;
    borderColor = theme.positiveBorder;
  } else if (variant === 'negative' || variant === 'destructive') {
    bgColor = theme.negativeBg;
    textColor = theme.negative;
    borderColor = theme.negativeBorder;
  } else if (variant === 'warning') {
    bgColor = theme.warningBg;
    textColor = theme.warning;
    borderColor = theme.warning;
  } else if (variant === 'info') {
    bgColor = theme.infoBg;
    textColor = theme.info;
    borderColor = theme.info;
  } else if (variant === 'primary' || variant === 'default') {
    bgColor = theme.primaryLight;
    textColor = theme.primary;
    borderColor = theme.primary;
  }

  const isSmall = size === 'sm';

  const badgeClass = cn(
    'items-center justify-center rounded-full border self-start flex-row',
    isSmall ? 'px-2 py-0.5' : 'px-3 py-1',
    className
  );

  return (
    <View
      className={badgeClass}
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          borderColor,
          borderRadius: borderRadius.full,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
        },
        style,
      ]}
    >
      {children ? (
        children
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: textColor,
              fontSize: isSmall ? typography.fontSize.xs : typography.fontSize.sm,
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
